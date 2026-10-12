import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FiArrowLeft, FiMapPin, FiUsers, FiHome, FiCalendar, FiInfo,
  FiTrendingUp, FiAlertTriangle, FiDollarSign, FiMaximize2,
} from 'react-icons/fi'
import { getAccommodation, formatLKR } from '../services/tourismApi'
import AccommodationMap from '../components/AccommodationMap'
import PriceEstimator from '../components/PriceEstimator'
import LocationMedia from '../components/LocationMedia'

const GRADE_LABELS = {
  ONE: '1 Star', TWO: '2 Star', THREE: '3 Star', FOUR: '4 Star', FIVE: '5 Star',
}

function Def({ icon: Icon, label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="lt-def">
      <span className="lt-def__key">
        <Icon size={15} /> {label}
      </span>
      <span className="lt-def__val">{value}</span>
    </div>
  )
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="lt-stat">
      <span className="lt-stat__icon"><Icon size={17} /></span>
      <p className="lt-stat__value">{value}</p>
      <p className="lt-stat__label">{label}</p>
    </div>
  )
}

export default function AccommodationDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const estimatorRef = useRef(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    getAccommodation(id)
      .then((d) => { if (alive) setItem(d) })
      .catch((e) => { if (alive) setError(e) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="lt-band">
          <div className="container">
            <Link to="/accommodation" className="lt-band__back">
              <FiArrowLeft size={14} /> Back to all properties
            </Link>
            <div className="lt-skeleton" style={{ width: 'min(420px, 70%)', height: 44, borderRadius: 8 }} />
          </div>
        </div>
        <div className="container lt-section">
          <div className="lt-stats">
            {[0, 1, 2, 3].map((i) => (
              <div className="lt-stat" key={i}>
                <div className="lt-skeleton" style={{ width: 34, height: 34, borderRadius: 10, marginBottom: 14 }} />
                <div className="lt-skeleton" style={{ width: '70%', height: 24 }} />
              </div>
            ))}
          </div>
          <div className="text-center text-muted small">Loading property…</div>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="container lt-section">
        <div className="lt-panel" role="alert">
          <h2 className="lt-panel__title">
            <FiAlertTriangle className="text-danger me-2" />
            Could not load this property
          </h2>
          <p className="lt-panel__lede">{error?.message || 'Unknown error'}</p>
          <Link to="/accommodation" className="lt-btn lt-btn--teal">
            Back to all properties
          </Link>
        </div>
      </div>
    )
  }

  const double = item['Price Per Night - Double (LKR)']
  const single = item['Price Per Night - Single (LKR)']
  const triple = item['Price Per Night - Triple (LKR)']
  const meal = item['Meal Plan (BB/HB/FB)'] || 'BB'
  const grade = item.Grade && item.Grade !== '-'
    ? (GRADE_LABELS[item.Grade] || item.Grade)
    : null

  // Agreement between the listed rate and the model's estimate (0–100).
  const estimate = item.predicted_price
  const hasEstimate = typeof estimate === 'number' && estimate > 0
  const agreement = hasEstimate
    ? Math.max(0, Math.min(100, Math.round(100 - (Math.abs(item.price_delta) / estimate) * 100)))
    : null

  const scrollToEstimator = () => {
    estimatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="animate-fade-in">
      {/* ---------------- Teal hero band ---------------- */}
      <header className="lt-band">
        <div className="container">
          <Link to="/accommodation" className="lt-band__back">
            <FiArrowLeft size={14} /> Back to all properties
          </Link>

          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
            <div>
              <span className="lt-eyebrow lt-eyebrow--light">Sri Lanka Tourism Database</span>
              <h1 className="lt-band__title">{item.Name || 'Unnamed property'}</h1>
              <p className="lt-band__sub d-flex align-items-start gap-2">
                <FiMapPin size={16} className="mt-1 flex-shrink-0" />
                <span>
                  {item.Address || 'Address on file'}
                  <span className="d-block" style={{ color: '#e29a34', fontWeight: 700 }}>
                    {item.District} District
                  </span>
                </span>
              </p>
            </div>

            <div className="lt-band__actions">
              <span className="lt-badge lt-badge--teal"><FiHome size={13} /> {item.Type}</span>
              {grade && <span className="lt-badge lt-badge--teal">{grade}</span>}
              <span className="lt-badge lt-badge--amber">{meal}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- Cream body ---------------- */}
      <div className="container lt-section">
        {/* Summary stats */}
        <div className="lt-stats">
          <Stat icon={FiDollarSign} value={formatLKR(double)} label="Per night, double" />
          <Stat icon={FiDollarSign} value={formatLKR(single)} label="Per night, single" />
          <Stat icon={FiUsers} value={`${item.Rooms}`} label={`Room${item.Rooms !== 1 ? 's' : ''} on file`} />
          <Stat
            icon={FiTrendingUp}
            value={hasEstimate ? formatLKR(estimate) : '—'}
            label="Random Forest estimate"
          />
        </div>

        <div className="row g-4">
          {/* ============ Left column ============ */}
          <div className="col-lg-7">
            {/* Rate card */}
            <section className="lt-panel">
              <h2 className="lt-panel__title">Rate card</h2>
              <p className="lt-panel__lede">Published nightly rates in Sri Lankan Rupees.</p>

              <div className="lt-rates">
                {[
                  ['Single', single],
                  ['Double', double],
                  ['Triple', triple],
                ].map(([label, val]) => (
                  <div className="lt-rate" key={label}>
                    <div className="lt-rate__label">{label}</div>
                    <div className="lt-rate__value">{formatLKR(val)}</div>
                    <div className="lt-rate__note">per night</div>
                  </div>
                ))}
              </div>

              <div className="d-flex flex-wrap gap-3 mt-3 small" style={{ color: '#7a6f63' }}>
                <span className="d-flex align-items-center gap-1">
                  <FiCalendar size={14} />
                  {item.price_updated_date ? `Rates updated ${item.price_updated_date}` : 'Update date unknown'}
                </span>
                <span className="d-flex align-items-center gap-1">
                  <FiInfo size={14} />
                  {item.Remarks || 'No remarks'}
                </span>
              </div>
            </section>

            {/* Property details */}
            <section className="lt-panel">
              <h2 className="lt-panel__title">Property details</h2>
              <div>
                <Def icon={FiHome} label="Type" value={item.Type} />
                <Def icon={FiUsers} label="Rooms" value={`${item.Rooms} rooms`} />
                <Def icon={FiMapPin} label="District" value={item.District} />
                <Def icon={FiMapPin} label="Divisional Secretariat" value={item['AGA Division']} />
                <Def icon={FiMapPin} label="Pradeshiya Sabha" value={item['PS/MC/UC']} />
                <Def icon={FiInfo} label="Meal plan" value={meal} />
                <Def icon={FiMaximize2} label="Coordinates" value={`${item.Latitude?.toFixed(5)}, ${item.Longitude?.toFixed(5)}`} />
              </div>
            </section>

            {/* Map */}
            {item.Latitude && item.Longitude && (
              <section className="lt-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <AccommodationMap items={[item]} />
              </section>
            )}

            {/* Similar */}
            {Array.isArray(item.similar) && item.similar.length > 0 && (
              <section className="lt-panel">
                <h2 className="lt-panel__title">Similar in {item.District}</h2>
                <div className="lt-similar">
                  {item.similar.map((s) => (
                    <Link key={s._id} to={`/accommodation/${s._id}`} className="lt-similar__item">
                      <span>
                        <span className="lt-similar__name d-block">{s.Name}</span>
                        <span className="lt-similar__meta">{s.Type} · {s.Rooms} rooms</span>
                      </span>
                      <span className="lt-similar__price">
                        {formatLKR(s['Price Per Night - Double (LKR)'], { compact: true })}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ============ Right column ============ */}
          <div className="col-lg-5">
            {/* Model estimate — reference "AI MATCH SCORE" card */}
            <section className="lt-score">
              <div className="lt-score__eyebrow">Model estimate</div>

              {hasEstimate ? (
                <>
                  <div className="lt-score__row">
                    <span className="lt-score__value">{agreement}%</span>
                    <span className="lt-score__suffix">agreement with the listed rate</span>
                  </div>

                  <div
                    className="lt-score__bar"
                    role="progressbar"
                    aria-valuenow={agreement}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="lt-score__fill" style={{ width: `${agreement}%` }} />
                  </div>

                  <p className="lt-score__text">
                    Random Forest estimates <strong>{formatLKR(estimate)}</strong> per night
                    for this {item.Type.replace(/s$/, '').toLowerCase()}. The listed rate of{' '}
                    <strong>{formatLKR(double)}</strong>{' '}
                    {item.price_delta >= 0 ? 'sits' : 'falls'}{' '}
                    <strong>{formatLKR(Math.abs(item.price_delta))}</strong>{' '}
                    {item.price_delta >= 0 ? 'above' : 'below'} the model.
                  </p>

                  <button
                    type="button"
                    className="lt-btn lt-btn--on-teal lt-btn--sm w-100"
                    style={{ marginTop: '1rem' }}
                    onClick={scrollToEstimator}
                  >
                    Adjust inputs
                  </button>
                </>
              ) : (
                <p className="lt-score__text" style={{ marginTop: '0.6rem' }}>
                  No estimate available for this property.
                </p>
              )}
            </section>

            {/* Live estimator */}
            <div ref={estimatorRef} style={{ marginTop: '1.1rem' }}>
              <PriceEstimator defaults={item} />
            </div>

            {/* Methodology */}
            <div className="lt-note" style={{ marginTop: '1.1rem' }}>
              <FiInfo size={16} className="lt-note__icon" />
              <div>
                <strong>Methodology note.</strong> This dataset&apos;s prices are generated from
                the published rate card (Sheet 2), so the model reproduces that table rather
                than discovering independent pricing signal. Treat the figure above as a
                rate-card consistency check, not an appraisal.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
