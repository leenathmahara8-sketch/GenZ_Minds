"""
Train ML models on the Sri Lanka accommodation dataset.

Target  : Price Per Night - Double (LKR)   (regression)
Models  : RandomForestRegressor  (primary, per spec)
          DecisionTreeRegressor  (baseline, for comparison)
Outputs : models/model.json   - tree ensemble, portable to any runtime
          models/metrics.json  - train/test metrics for both models
          models/preprocess.json - feature schema + encodings

Usage:  python train.py
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeRegressor

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data", "accommodation.csv")
MODEL_DIR = os.path.join(BASE, "models")
TARGET = "Price Per Night - Double (LKR)"
RANDOM_STATE = 42


# --------------------------------------------------------------------------
# 1. Load & clean
# --------------------------------------------------------------------------
def load_data():
    df = pd.read_csv(DATA)

    # Categorical fill: the spec's dataset uses "-" as the "no grade" marker.
    for col in ["Grade", "AGA Division", "PS/MC/UC", "Meal Plan (BB/HB/FB)", "District", "Type"]:
        df[col] = df[col].fillna("-").astype(str).str.strip()

    # A handful of properties have no coordinates; impute with the district
    # centroid so they keep a sane geographic signal instead of being dropped.
    has_geo = df[["Longitude", "Latitude"]].notna().all(axis=1)
    if (~has_geo).any():
        centres = df.loc[has_geo].groupby("District")[["Longitude", "Latitude"]].median()
        default = df.loc[has_geo, ["Longitude", "Latitude"]].median()
        for idx in df.index[~has_geo]:
            d = df.at[idx, "District"]
            lon, lat = centres.loc[d].tolist() if d in centres.index else default.tolist()
            df.at[idx, "Longitude"] = lon
            df.at[idx, "Latitude"] = lat

    df["Rooms"] = df["Rooms"].fillna(df["Rooms"].median()).astype(int)
    df["Meal Plan (BB/HB/FB)"] = df["Meal Plan (BB/HB/FB)"].replace("", "BB")

    return df


# --------------------------------------------------------------------------
# 2. Features
# --------------------------------------------------------------------------
CATEGORICAL = ["Type", "Grade", "District", "Meal Plan (BB/HB/FB)", "AGA Division", "PS/MC/UC"]
NUMERIC = ["Rooms", "Longitude", "Latitude"]


def build_pipeline(model, params=None):
    pre = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
            ("num", StandardScaler(), NUMERIC),
        ]
    )
    pipe = Pipeline([("pre", pre), ("model", model)])
    if params:
        return GridSearchCV(pipe, params, cv=5, scoring="r2", n_jobs=-1)
    return pipe


# --------------------------------------------------------------------------
# 3. Tree -> portable JSON (so the forest can be evaluated outside sklearn)
# --------------------------------------------------------------------------
def export_tree(estimator, feature_names):
    """Recursively serialise a fitted DecisionTreeRegressor."""
    t = estimator.tree_
    left, right, feat, thr, val = (
        t.children_left, t.children_right, t.feature, t.threshold, t.value,
    )

    def walk(i):
        if left[i] == -1:  # leaf
            return {"leaf": float(val[i].ravel()[0])}
        return {
            "feature": feature_names[feat[i]],
            "threshold": float(thr[i]),
            "left": walk(left[i]),
            "right": walk(right[i]),
        }

    return walk(0)


def get_feature_names(preprocessor):
    """Feature names after one-hot encoding."""
    return list(preprocessor.get_feature_names_out())


def metrics(y_true, y_pred):
    y_pred = np.asarray(y_pred, dtype=float)
    y_true = np.asarray(y_true, dtype=float)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    mape = float(np.mean(np.abs((y_true - y_pred) / np.clip(np.abs(y_true), 1, None))) * 100)
    return {"rmse": rmse, "mae": mae, "r2": r2, "mape_pct": mape}


def leakage_report(df, target):
    """
    The published prices are generated from the (Type, Grade) rate card on
    Sheet 2, so a model given those columns reproduces the table exactly.
    Record that fact explicitly so the near-perfect R2 is never mistaken for
    genuine predictive power.
    """
    lut_path = os.path.join(BASE, "data", "price_list.csv")
    note = {
        "verdict": "target_is_derived_not_observed",
        "target": target,
        "explanation": (
            "Sheet 1 prices are generated from the Sheet 2 rate card by "
            "(Type, Grade). Including those columns makes R2 ~ 1.0 because the "
            "model memorises an 22-row lookup table. Treat this model as a "
            "price ESTIMATOR / rate-card recovery tool, not as evidence of "
            "predictive accuracy."
        ),
    }
    if os.path.exists(lut_path):
        price_list = pd.read_csv(lut_path)
        key = df["Type"].str.strip() + "|" + df["Grade"].fillna("-").str.strip()
        price_list["Key"] = price_list["Type"].str.strip() + "|" + price_list["Grade"].str.strip()
        expect = key.map(price_list.set_index("Key")["Double (LKR)"].to_dict())
        ok = expect.notna()
        matches = int((expect[ok] == df.loc[ok, target]).sum())
        note.update({
            "lookup_rows": int(len(price_list)),
            "lookup_matches": matches,
            "lookup_rows_checked": int(ok.sum()),
            "lookup_match_pct": round(matches / max(int(ok.sum()), 1) * 100, 2),
            "distinct_type_grade_pairs": int(df.groupby(["Type", "Grade"]).ngroups),
            "distinct_price_values": int(df[target].nunique()),
            "n_rows": int(len(df)),
        })
    return note


# --------------------------------------------------------------------------
# 4. Main
# --------------------------------------------------------------------------
def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    df = load_data()

    X = df[CATEGORICAL + NUMERIC]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )
    print(f"Rows: {len(df)}  train: {len(X_train)}  test: {len(X_test)}")
    print(f"Target: {TARGET}  (mean LKR {y.mean():,.0f}, median LKR {y.median():,.0f})\n")

    # --- Baseline: plain Decision Tree -----------------------------------
    print("Training Decision Tree baseline ...")
    dt_pipe = build_pipeline(DecisionTreeRegressor(random_state=RANDOM_STATE))
    dt_pipe.fit(X_train, y_train)

    # --- Primary: Random Forest ------------------------------------------
    print("Training Random Forest ...")
    rf_params = {
        "model__n_estimators": [200, 400],
        "model__max_depth": [None, 18],
        "model__min_samples_leaf": [1, 2],
    }
    rf_search = build_pipeline(
        RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1), rf_params
    )
    rf_search.fit(X_train, y_train)
    rf = rf_search.best_estimator_
    print(f"  best params: {rf_search.best_params_}")

    # --- Evaluate ---------------------------------------------------------
    results = {
        "target": TARGET,
        "n_samples": int(len(df)),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "models": {
            "decision_tree": metrics(y_test, dt_pipe.predict(X_test)),
            "random_forest": metrics(y_test, rf.predict(X_test)),
        },
        "baseline": {
            "mean_predictor_mae": float(mean_absolute_error(y_test, np.full(len(y_test), y_train.mean()))),
            "mean_price_lkr": float(y.mean()),
        },
        "best_params": {k.replace("model__", ""): (v if not isinstance(v, (np.integer,)) else int(v))
                        for k, v in rf_search.best_params_.items()},
    }

    # --- Export -----------------------------------------------------------
    pre = rf.named_steps["pre"]
    feature_names = get_feature_names(pre)

    forest = [export_tree(est, feature_names) for est in rf.named_steps["model"].estimators_]
    dt_pre = dt_pipe.named_steps["pre"]
    dt_feature_names = get_feature_names(dt_pre)

    with open(os.path.join(MODEL_DIR, "model.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "kind": "random_forest_regressor",
                "target": TARGET,
                "features": {"categorical": CATEGORICAL, "numeric": NUMERIC},
                "n_estimators": len(forest),
                "trees": forest,
            },
            f,
        )

    with open(os.path.join(MODEL_DIR, "decision_tree.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "kind": "decision_tree_regressor",
                "target": TARGET,
                "features": {"categorical": CATEGORICAL, "numeric": NUMERIC},
                "tree": export_tree(dt_pipe.named_steps["model"], dt_feature_names),
            },
            f,
        )

    with open(os.path.join(MODEL_DIR, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Persist the fitted pipelines so Flask can serve predictions without retraining.
    joblib.dump(rf, os.path.join(MODEL_DIR, "rf_pipeline.joblib"))
    joblib.dump(dt_pipe, os.path.join(MODEL_DIR, "dt_pipeline.joblib"))

    # Encodings the API needs at inference time
    ohe = pre.named_transformers_["cat"]
    with open(os.path.join(MODEL_DIR, "preprocess.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "categorical": {
                    col: list(ohe.categories_[i])
                    for i, col in enumerate(CATEGORICAL)
                },
                "numeric": NUMERIC,
                "target": TARGET,
                "districts": sorted(df["District"].unique().tolist()),
                "types": sorted(df["Type"].unique().tolist()),
                "grades": sorted(df["Grade"].unique().tolist()),
                "meal_plans": sorted(df["Meal Plan (BB/HB/FB)"].unique().tolist()),
                "price_stats": {
                    "min": int(y.min()),
                    "max": int(y.max()),
                    "mean": float(y.mean()),
                    "median": float(y.median()),
                },
            },
            f,
            indent=2,
        )

    # --- Report -----------------------------------------------------------
    print("\n" + "=" * 62)
    print(f"{'Model':<22}{'RMSE':>12}{'MAE':>12}{'R2':>10}{'MAPE%':>10}")
    print("-" * 62)
    for name, m in results["models"].items():
        print(f"{name:<22}{m['rmse']:>12,.0f}{m['mae']:>12,.0f}{m['r2']:>10.4f}{m['mape_pct']:>10.2f}")
    print("-" * 62)
    print(f"{'naive mean baseline':<22}{'':>12}{results['baseline']['mean_predictor_mae']:>12,.0f}")
    print("=" * 62)

    print("\nWritten:")
    for fn in ["model.json", "decision_tree.json", "metrics.json", "preprocess.json"]:
        p = os.path.join(MODEL_DIR, fn)
        print(f"  models/{fn:<20} {os.path.getsize(p):>9,} bytes")

    # Feature importance (top 12)
    importances = rf.named_steps["model"].feature_importances_
    order = np.argsort(importances)[::-1][:12]
    print("\nTop 12 features:")
    for i in order:
        print(f"  {feature_names[i]:<45} {importances[i]:.4f}")

    # Persist feature importances + leakage findings alongside the metrics.
    results["feature_importance"] = {
        feature_names[i]: float(importances[i]) for i in np.argsort(importances)[::-1]
    }
    results["leakage"] = leakage_report(df, TARGET)
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    lk = results["leakage"]
    print("\n" + "!" * 62)
    print("LEAKAGE CHECK")
    print("!" * 62)
    print(f"  verdict          : {lk['verdict']}")
    print(f"  lookup matches   : {lk.get('lookup_matches')}/{lk.get('lookup_rows_checked')}"
          f"  ({lk.get('lookup_match_pct')}%)")
    print(f"  distinct prices  : {lk.get('distinct_price_values')}"
          f"  from {lk.get('distinct_type_grade_pairs')} (Type,Grade) pairs")
    print("  => R2 near 1.0 means rate-card recovery, not prediction.")
    print("!" * 62)


if __name__ == "__main__":
    main()
