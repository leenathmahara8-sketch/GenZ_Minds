# GenZ_Minds
# Sri Lanka Tourism — Smart AI Trip Planner

An AI-powered personalised travel planning system for Sri Lanka: a React front
end, a Flask API serving a Random Forest price estimator over a 2,130-property
accommodation dataset, and a rule-based itinerary generator.

## Layout

```
Sri-Lanka-Tourism\
├── sri-lanka-tourism-backend\   Flask API + ML training   <- run this first
│   ├── app.py                   dataset + model routes    (http://127.0.0.1:5000)
│   ├── store.py                 SQLite: users, destinations, trips
│   ├── auth.py                  HMAC tokens + route guards
│   ├── routes_auth.py           /api/auth/*      register, login, profile, demo
│   ├── routes_destinations.py   /api/destinations*
│   ├── routes_trips.py          /api/trips*      plan, list, read, delete
│   ├── routes_admin.py          /api/admin/*     stats, analytics, users
│   ├── train.py                 trains Random Forest + Decision Tree baseline
│   ├── import_data.py           workbook (.xlsx) -> data/*.csv
│   ├── itinerary.py             attraction catalogue, routes, stay picker
│   ├── test_itinerary.py        smoke tests for the planner
│   ├── test_api.py              97 checks across every endpoint
│   ├── check_leakage.py         verifies the (Type, Grade) -> price lookup
│   ├── compare_leakage.py       leaky vs leakage-free training
│   ├── data\                    CSVs, destinations_seed.json, tourism.db
│   ├── models\                  rf_pipeline.joblib, model.json, metrics.json
│   └── README.md                data, model results, API reference, caveats
│
├── sri-lanka-tourism-frontend\  React + Vite + Leaflet  <- run this second
│   ├── src\pages\               Accommodation, detail, planner, itinerary...
│   ├── src\components\          Navbar, map, estimator, location media
│   ├── src\styles\lanka.css     the design system (cream/teal/amber, .lt-*)
│   ├── vite.config.js           proxies /api -> http://localhost:5000
│   ├── .env                     VITE_RAPIDAPI_KEY (git-ignored)
│   └── BOOKING_API.md           Booking.com / RapidAPI integration notes
│
├── prototype\                   earlier TypeScript skeleton of the planner
│   └── src\types\index.ts       Destination / Activity interfaces
│
└── docs\
    ├── Sri_Lanka_Smart_Tourism_AI_Trip_Planner_Proposal.md
    ├── Sri_Lanka_Smart_Tourism_AI_Trip_Planner_Proposal.pdf
    ├── Sri_Lanka_Smart_Tourism_System_Documentation.md
    ├── Sri_Lanka_Smart_Tourism_System_Documentation.pdf
    └── md_to_pdf.py             renders either document to PDF (needs fpdf2)
```

## Documentation

Two documents, both in `docs\` as Markdown with a matching PDF.

| Document | What it covers |
|---|---|
| **System Documentation** | The system **as built** — architecture, SQLite schema, all 25 endpoints, the price model and its leakage disclosure, the itinerary engine and its notes keyword rules, auth, frontend, testing, limitations, runbook |
| **Project Proposal** | The system **as intended** — background, objectives, literature review, methodology, timeline |

```powershell
cd docs
py md_to_pdf.py    # regenerates the proposal (unchanged behaviour)
py md_to_pdf.py Sri_Lanka_Smart_Tourism_System_Documentation.md `
    --header "Sri Lanka Smart Tourism & AI Trip Planner - System Documentation" `
    --title "SYSTEM DOCUMENTATION"
```

The converter takes the header, title and subtitle as arguments and defaults to the
proposal, so regenerating the proposal still works with no arguments.

## Running it

Both servers must be running — the frontend proxies `/api` to port 5000.

```powershell
# terminal 1 — API
cd sri-lanka-tourism-backend
py app.py                 # or: & "C:\...\Python313\python.exe" app.py

# terminal 2 — frontend
cd sri-lanka-tourism-frontend
npm.cmd run dev           # http://localhost:3000
```

Re-training after a new workbook arrives:

```powershell
cd sri-lanka-tourism-backend
py import_data.py "C:\path\to\Accommodation_with_Price_List.xlsx"
py train.py
```

Restart `app.py` afterwards — models are loaded once at import.

> **Windows note:** the Store `python` stub shadows the real interpreter, so use
> `py` or the full path rather than bare `python`.

## Key routes

| Route | What it is |
|---|---|
| `/` | hero + featured destinations (from the API) |
| `/accommodation` | card grid, filters, pagination, map — the dataset |
| `/accommodation/:id` | detail, rate card, model estimate, estimator |
| `/destinations`, `/destinations/:id` | destination catalogue and detail |
| `/plan-trip` | two-step itinerary wizard |
| `/itinerary/:id` | day-by-day plan, stays, cost breakdown |
| `/hotels`, `/hotels/:id` | Booking.com search (needs `VITE_RAPIDAPI_KEY`) |
| `/login`, `/register` | auth forms |
| `/profile`, `/my-trips`, `/my-trips/:id` | account + saved itineraries (protected) |
| `/admin`, `/admin/destinations`, `/admin/users`, `/admin/analytics` | admin (admin role) |

The app signs itself in as a seeded **demo account** on first load
(`demo@smarttourism.lk` / `demo1234`) so the protected pages open without a login form.
**Logout** switches that off — use `/login` with those credentials afterwards.

```powershell
cd sri-lanka-tourism-backend
py test_api.py          # 97 checks, 97 passed, 0 failed
```

## Read before quoting the model scores

The target — `Price Per Night - Double (LKR)` — is **generated** from the Sheet 2
rate card by `(Type, Grade)`. The leakage check confirms a **100% match
(2,130/2,130)**, 18 distinct prices from 25 pairs, so Random Forest R² = 0.9999
and Decision Tree R² = 1.0000 measure *rate-card recovery*, not predictive
accuracy. The model is presented as a **price estimator**, and that caveat lives
in `sri-lanka-tourism-backend\README.md` §4, `models\metrics.json`, and on the
property detail page.

Full details: [`sri-lanka-tourism-backend/README.md`](sri-lanka-tourism-backend/README.md).
