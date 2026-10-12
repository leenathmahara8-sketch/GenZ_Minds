import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiTrendingUp, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi'
import { getFilters, predictPrice, formatLKR } from '../services/tourismApi'

const MEALS = ['BB', 'HB', 'FB']

/**
 * Live price estimator backed by the Flask/scikit-learn endpoint.
 * `defaults` lets the detail page pre-fill from the property being viewed.
 */
export default function PriceEstimator({ defaults }) {
  const [filters, setFilters] = useState(null)

  const blank = {
    Type: '',
    Grade: '-',
    District: '',
    'Meal Plan (BB/HB/FB)': 'BB',
    Rooms: 1,
    Longitude: 80.7,
    Latitude: 7.9,
    'AGA Division': '',
    'PS/MC/UC': '',
  }

  const fromProperty = (p) => ({
    Type: p.Type || '',
    Grade: p.Grade || '-',
    District: p.District || '',
    'Meal Plan (BB/HB/FB)': p['Meal Plan (BB/HB/FB)'] || 'BB',
    Rooms: p.Rooms || 1,
    Longitude: p.Longitude ?? 80.7,
    Latitude: p.Latitude ?? 7.9,
    'AGA Division': p['AGA Division'] || '',
    'PS/MC/UC': p['PS/MC/UC'] || '',
  })

  const [form, setForm] = useState(() => (defaults ? fromProperty(defaults) : blank))
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getFilters().then(setFilters).catch(() => setFilters(null))
  }, [])

  // Keep the form in sync when the detail page loads a new property.
  useEffect(() => {
    if (!defaults) return
    setForm(fromProperty(defaults))
    setResult(null)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults?._id])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      setResult(await predictPrice(form))
    } catch (err) {
      setError(err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setForm(blank)
    setResult(null)
    setError(null)
  }

  const districtOptions = Array.from(
    new Set([...(filters?.districts || []), form.District].filter(Boolean)),
  )
  const typeOptions = Array.from(
    new Set([...(filters?.types || []), form.Type].filter(Boolean)),
  )
  const gradeOptions = Array.from(
    new Set([...(filters?.grades || []), form.Grade].filter(Boolean)),
  )

  return (
    <section className="lt-panel">
      <h2 className="lt-panel__title">Price estimator</h2>
      <p className="lt-panel__lede">
        Random Forest against the Decision Tree baseline, trained on 2,130 properties.
      </p>

      <form onSubmit={submit}>
        <div className="lt-field">
          <label className="lt-field__label" htmlFor="pe-type">Property type *</label>
          <select
            id="pe-type"
            className="lt-select"
            required
            value={form.Type}
            onChange={(e) => set('Type', e.target.value)}
          >
            <option value="">Select type…</option>
            {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="row g-3">
          <div className="col-6">
            <div className="lt-field">
              <label className="lt-field__label" htmlFor="pe-grade">Grade</label>
              <select
                id="pe-grade"
                className="lt-select"
                value={form.Grade}
                onChange={(e) => set('Grade', e.target.value)}
              >
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>{g === '-' ? 'None' : g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-6">
            <div className="lt-field">
              <label className="lt-field__label" htmlFor="pe-rooms">Rooms</label>
              <input
                id="pe-rooms"
                type="number"
                min="1"
                max="500"
                className="lt-input"
                value={form.Rooms}
                onChange={(e) => set('Rooms', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="lt-field">
          <label className="lt-field__label" htmlFor="pe-district">District</label>
          <select
            id="pe-district"
            className="lt-select"
            value={form.District}
            onChange={(e) => set('District', e.target.value)}
          >
            <option value="">Select district…</option>
            {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="lt-field">
          <span className="lt-field__label">Meal plan</span>
          <div className="lt-segment" role="group" aria-label="Meal plan">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                className={`lt-segment__btn ${form['Meal Plan (BB/HB/FB)'] === m ? 'is-active' : ''}`}
                aria-pressed={form['Meal Plan (BB/HB/FB)'] === m}
                onClick={() => set('Meal Plan (BB/HB/FB)', m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="lt-btn lt-btn--teal flex-grow-1" disabled={loading}>
            {loading ? 'Estimating…' : 'Estimate price'}
          </button>
          <button
            type="button"
            className="lt-btn lt-btn--ghost"
            onClick={reset}
            aria-label="Reset form"
            title="Reset"
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </form>

      {error && (
        <div className="lt-note" role="alert" style={{ marginTop: '1rem' }}>
          <FiAlertTriangle size={16} className="lt-note__icon" />
          <div>{error.message}</div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1.15rem', paddingTop: '1.15rem', borderTop: '1px solid var(--lt-line)' }}>
          <div className="d-flex justify-content-between align-items-end mb-2 gap-2">
            <div>
              <span className="lt-eyebrow">Recommended rate</span>
              <p
                className="lt-serif"
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  color: 'var(--lt-teal)',
                  margin: '0.2rem 0 0',
                  lineHeight: 1.1,
                }}
              >
                {formatLKR(result.recommended)}
              </p>
            </div>
            <span className="lt-chip lt-chip--teal">LKR / night</span>
          </div>

          <table className="lt-compare">
            <tbody>
              <tr>
                <td className="lt-compare__key">Random Forest</td>
                <td className="lt-compare__val lt-compare__val--teal">
                  {formatLKR(result.random_forest)}
                </td>
              </tr>
              <tr>
                <td className="lt-compare__key">Decision Tree (baseline)</td>
                <td className="lt-compare__val">{formatLKR(result.decision_tree)}</td>
              </tr>
              {result.rate_card && (
                <tr>
                  <td className="lt-compare__key">Published rate card</td>
                  <td className="lt-compare__val">{formatLKR(result.rate_card.double)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <details style={{ marginTop: '0.85rem' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontSize: '0.82rem',
                color: 'var(--lt-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <FiTrendingUp size={14} /> Why the two models differ
            </summary>
            <p style={{ fontSize: '0.82rem', color: 'var(--lt-muted)', marginTop: '0.6rem', marginBottom: 0, lineHeight: 1.6 }}>
              The Decision Tree is a single deep tree — exact on training data, brittle on unseen
              combinations. The Random Forest averages 200 trees, so it smooths those edge cases.
              That gap is exactly what the baseline comparison is for.
            </p>
          </details>
        </div>
      )}
    </section>
  )
}
