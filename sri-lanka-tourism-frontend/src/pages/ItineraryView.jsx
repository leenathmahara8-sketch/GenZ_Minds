import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FiArrowLeft, FiMapPin, FiCalendar, FiDollarSign, FiHome, FiRepeat,
  FiClock, FiAlertTriangle, FiLayers, FiCoffee, FiCompass, FiSun,
  FiTarget, FiSunset,
} from 'react-icons/fi'
import api from '../services/api'
import LocationMedia from '../components/LocationMedia'

/** Raw interest ids from the wizard, for the fallback sample plan. */
const INTEREST_LABELS = {
  beaches: 'Beaches', wildlife: 'Wildlife safaris', culture: 'Culture & history',
  adventure: 'Adventure', nature: 'Nature & hikes', food: 'Food & cuisine',
  tea: 'Tea & hill country', nightlife: 'Nightlife',
}

/** Activity category -> icon for the day rows. */
const CATEGORY_ICONS = {
  Transport: FiCompass,
  Boat: FiCompass,
  Accommodation: FiHome,
  Food: FiCoffee,
  Tea: FiCoffee,
  Wildlife: FiTarget,
  Culture: FiLayers,
  Sightseeing: FiMapPin,
  Nature: FiSun,
  Relax: FiSunset,
  Adventure: FiCompass,
}

/** Alternating bar colours so the breakdown reads as separate categories. */
const COST_FILLS = ['', 'lt-cost__fill--amber', 'lt-cost__fill--sand', 'lt-cost__fill--deep']

const fallbackTrip = {
  _id: 'sample-trip',
  title: 'Highlights of Sri Lanka',
  duration: 3,
  interests: ['culture', 'beaches', 'nature'],
  route: 'Colombo → Kandy → Galle',
  itinerary: [
    {
      day: 1,
      district: 'Colombo',
      title: 'Arrival and the Cultural Triangle',
      activities: [
        { time: '09:00', name: 'Arrive in Colombo', description: 'Airport pick up and a scenic drive north towards Sigiriya.', category: 'Transport' },
        { time: '14:00', name: 'Sigiriya Rock Fortress', description: 'Climb the Lion Rock for sunset views over the jungle.', category: 'Sightseeing' },
        { time: '19:00', name: 'Village dinner', description: 'Traditional rice and curry served in a family home.', category: 'Food' },
      ],
    },
    {
      day: 2,
      district: 'Kandy',
      title: 'Kandy and the hills',
      activities: [
        { time: '08:30', name: 'Dambulla Cave Temples', description: 'Golden Buddha statues inside a vast rock cave complex.', category: 'Culture' },
        { time: '13:00', name: 'Drive to Kandy', description: 'Wind through spice gardens and paddy fields.', category: 'Transport' },
        { time: '17:00', name: 'Temple of the Tooth', description: 'Evening puja ceremony beside the sacred relic.', category: 'Culture' },
      ],
    },
    {
      day: 3,
      district: 'Galle',
      title: 'Beaches of the south',
      activities: [
        { time: '09:00', name: 'Scenic train to Ella', description: 'One of the most beautiful railway rides in the world.', category: 'Transport' },
        { time: '15:00', name: 'Nine Arch Bridge', description: 'Short walk through tea country to the iconic viaduct.', category: 'Sightseeing' },
        { time: '18:30', name: 'Sunset on the beach', description: 'Unwind on the golden sands of Mirissa.', category: 'Relax' },
      ],
    },
  ],
  budget: {
    total: 45000,
    breakdown: [
      { label: 'Accommodation', value: 18000 },
      { label: 'Transport', value: 12000 },
      { label: 'Food', value: 8000 },
      { label: 'Activities', value: 7000 },
    ],
  },
}

const getBudgetEntries = (trip) => {
  const budget = trip?.budget || trip?.budgetBreakdown || trip?.estimatedBudget
  if (!budget) return { entries: [], total: 0, currency: 'LKR' }

  const rows = Array.isArray(budget.breakdown) && budget.breakdown.length
    ? budget.breakdown
    : Array.isArray(budget.items) && budget.items.length
      ? budget.items
      : null

  if (rows) {
    return {
      entries: rows.map((b) => ({
        label: b.label || b.name,
        value: Number(b.value ?? b.amount) || 0,
      })),
      total: Number(budget.total ?? budget.totalBudget) ||
        rows.reduce((s, b) => s + (Number(b.value ?? b.amount) || 0), 0),
      currency: budget.currency || 'LKR',
    }
  }

  const entries = Object.entries(budget)
    .filter(([k, v]) => typeof v === 'number' && !['total', 'totalBudget', 'currency'].includes(k))
    .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))

  return {
    entries,
    total: Number(budget.total ?? budget.totalBudget) || entries.reduce((s, e) => s + e.value, 0),
    currency: budget.currency || 'LKR',
  }
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

export default function ItineraryView() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setUsingFallback(false)

    api.get(`/trips/${id}`)
      .then((res) => { if (active) setTrip(res.data?.trip || res.data) })
      .catch(() => {
        // Generated trips live in memory on the API process; if it restarted
        // the id is gone, so fall back to a sample rather than a blank page.
        if (!active) return
        setTrip(fallbackTrip)
        setUsingFallback(true)
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <div className="lt-loading">
        <div className="lt-loading__spinner" role="status" aria-label="Loading itinerary" />
        <span>Building your itinerary…</span>
      </div>
    )
  }

  const days = Array.isArray(trip?.itinerary) && trip.itinerary.length
    ? trip.itinerary
    : Array.isArray(trip?.days) && trip.days.length
      ? trip.days
      : []

  const { entries, total, currency } = getBudgetEntries(trip)
  const districts = trip?.districts?.length
    ? trip.districts
    : [...new Set(days.map((d) => d.district).filter(Boolean))]
  const nights = trip?.nights ?? Math.max(days.length - 1, 0)
  const booked = days.filter((d) => d.stay).length
  const coverage = days.length ? Math.round((booked / days.length) * 100) : 0
  const interestLabels = trip?.interestLabels ||
    (Array.isArray(trip?.interests) ? trip.interests.map((i) => INTEREST_LABELS[i] || i) : [])

  // The last day has no stay of its own; reuse the previous district's
  // coordinates so its header still shows where you are.
  const dayCoords = days.map((d, i) => {
    if (d.stay && d.stay.latitude && d.stay.longitude) {
      return { lat: d.stay.latitude, lon: d.stay.longitude }
    }
    for (let j = i - 1; j >= 0; j--) {
      const s = days[j]?.stay
      if (s && s.latitude && s.longitude) return { lat: s.latitude, lon: s.longitude }
    }
    return null
  })

  const label = currency || 'LKR'
  const fmt = (v) => `${label} ${Math.round(v).toLocaleString()}`

  return (
    <div className="animate-fade-in">
      {/* ---------------- Teal hero band ---------------- */}
      <header className="lt-band">
        <div className="container">
          <Link to="/plan-trip" className="lt-band__back">
            <FiArrowLeft size={14} /> Plan another trip
          </Link>

          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
            <div>
              <span className="lt-eyebrow lt-eyebrow--light">Suggested itinerary</span>
              <h1 className="lt-band__title">{trip?.title || 'Your Sri Lanka itinerary'}</h1>
              <p className="lt-band__sub d-flex align-items-start gap-2">
                <FiMapPin size={16} className="mt-1 flex-shrink-0" />
                <span>
                  {trip?.route || districts.join(' → ')}
                  {interestLabels.length > 0 && (
                    <span className="d-block" style={{ color: '#e29a34', fontWeight: 700 }}>
                      {interestLabels.join(' · ')}
                    </span>
                  )}
                </span>
              </p>
            </div>

            <div className="lt-band__actions">
              <span className="lt-badge lt-badge--teal">
                <FiCalendar size={13} /> {days.length} days
              </span>
              {trip?.budgetType && <span className="lt-badge lt-badge--teal">{trip.budgetType} budget</span>}
              <Link to="/plan-trip" className="lt-btn lt-btn--on-teal lt-btn--sm">
                <FiRepeat size={14} /> Replan
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- Cream body ---------------- */}
      <div className="container lt-section">
        {usingFallback && (
          <div className="lt-note" role="alert" style={{ marginBottom: '1.5rem' }}>
            <FiAlertTriangle size={16} className="lt-note__icon" />
            <div>
              <strong>This plan could not be reloaded from the server.</strong>
              <div>Itineraries are held in memory, so a server restart clears them. The sample below shows the format — build a fresh one from the planner.</div>
            </div>
          </div>
        )}

        {days.length === 0 ? (
          <div className="lt-empty">
            <FiCalendar size={52} className="lt-empty__icon" />
            <h3 className="lt-empty__title">This trip has no days yet</h3>
            <p>Try planning a new trip.</p>
            <Link to="/plan-trip" className="lt-btn lt-btn--teal">Plan a trip</Link>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="lt-stats">
              <Stat icon={FiCalendar} value={`${days.length}`} label="Days" />
              <Stat icon={FiMapPin} value={`${districts.length}`} label="Districts visited" />
              <Stat icon={FiDollarSign} value={total ? fmt(total) : '—'} label="Estimated total" />
              <Stat
                icon={FiHome}
                value={nights ? fmt(total / nights) : '—'}
                label={`Per night · ${nights} night${nights === 1 ? '' : 's'}`}
              />
            </div>

            <div className="row g-4">
              {/* ============ Left: day by day ============ */}
              <div className="col-lg-8">
                <div className="d-flex align-items-baseline justify-content-between flex-wrap gap-2 mb-3">
                  <h2 className="lt-section-title">Day-by-day plan</h2>
                  <span className="lt-filters__count">{days.length} days · {booked} nights booked</span>
                </div>

                {days.map((day, dayIndex) => {
                  const activities = Array.isArray(day.activities) ? day.activities : []
                  const coords = dayCoords[dayIndex]
                  return (
                    <article className="lt-day" key={day._id || day.day || dayIndex}>
                      <div className="lt-day__media">
                        {coords && (
                          <LocationMedia
                            lat={coords.lat}
                            lon={coords.lon}
                            zoom={11}
                            aspect={21 / 9}
                            alt={`Map of ${day.district || 'Sri Lanka'}`}
                            fallbackLabel={day.district || 'SL'}
                          />
                        )}
                        <div className="lt-day__scrim" />
                        <div className="lt-day__overlay">
                          <span className="lt-day__num">
                            <FiCalendar size={13} /> Day {day.day || dayIndex + 1}
                          </span>
                          <div>
                            <div className="lt-day__district">{day.district || 'Sri Lanka'}</div>
                            <h3 className="lt-day__title">
                              {day.title || day.name || 'Exploring Sri Lanka'}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="lt-day__body">
                        <div className="lt-day__label">Activities</div>
                        {activities.length === 0 ? (
                          <p className="lt-day__empty">No activities planned for this day.</p>
                        ) : (
                          <ul className="lt-acts">
                            {activities.map((activity, actIndex) => {
                              const Icon = CATEGORY_ICONS[activity.category] || FiLayers
                              const name = activity.name || activity.title || activity.activity || 'Activity'
                              const description = activity.description || activity.details || ''
                              const time = activity.time || activity.startTime
                              const category = activity.category || activity.type
                              const isStay = category === 'Accommodation'
                              return (
                                <li className={`lt-act ${isStay ? 'lt-act--stay' : ''}`} key={activity._id || actIndex}>
                                  <span className="lt-act__time">
                                    {time ? <><FiClock size={11} /> {time}</> : <FiLayers size={12} />}
                                  </span>
                                  <span className="lt-act__icon"><Icon size={14} /></span>
                                  <span className="lt-act__text">
                                    <span className="lt-act__name">{name}</span>
                                    {description && <span className="lt-act__desc">{description}</span>}
                                  </span>
                                  {category && <span className="lt-act__cat">{category}</span>}
                                </li>
                              )
                            })}
                          </ul>
                        )}

                        {day.stay && (
                          <Link to={day.stay.link || `/accommodation/${day.stay.id}`} className="lt-day__stay">
                            <span className="lt-day__stay-main">
                              <FiHome size={15} />
                              <span>
                                <strong>{day.stay.name}</strong>
                                <span className="lt-day__stay-meta">
                                  {day.stay.type} · {day.stay.grade ? `${day.stay.grade} · ` : ''}
                                  {day.stay.meal_plan} · {day.stay.rooms} rooms
                                </span>
                              </span>
                            </span>
                            <span className="lt-day__stay-price">
                              {fmt(day.stay.double)}
                              <span>/ night, double</span>
                            </span>
                          </Link>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* ============ Right: breakdown ============ */}
              <div className="col-lg-4">
                <section className="lt-panel">
                  <h2 className="lt-panel__title">
                    <FiDollarSign size={18} style={{ color: 'var(--lt-amber)' }} className="me-2" />
                    Cost breakdown
                  </h2>
                  <p className="lt-panel__lede">
                    {trip?.groupSize ? `${trip.groupSize} traveller${trip.groupSize === 1 ? '' : 's'}` : 'Party estimate'} · {nights} night{nights === 1 ? '' : 's'}
                  </p>

                  {entries.length === 0 ? (
                    <p className="lt-filters__count mb-0">Budget details are not available for this trip.</p>
                  ) : (
                    <>
                      {entries.map((entry, i) => {
                        const pct = total ? Math.round((entry.value / total) * 100) : 0
                        const Icon = [FiHome, FiCoffee, FiCompass, FiLayers][i] || FiLayers
                        return (
                          <div className="lt-cost" key={entry.label}>
                            <div className="lt-cost__row">
                              <span className="lt-cost__label"><Icon size={14} /> {entry.label}</span>
                              <span className="lt-cost__val">{fmt(entry.value)}</span>
                            </div>
                            <div className="lt-cost__bar">
                              <div
                                className={`lt-cost__fill ${COST_FILLS[i % COST_FILLS.length]}`}
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                            <div className="lt-cost__pct">{pct}% of total</div>
                          </div>
                        )
                      })}
                      <div className="lt-cost__total">
                        <span>Total</span>
                        <span>{fmt(total || entries.reduce((s, e) => s + e.value, 0))}</span>
                      </div>
                    </>
                  )}
                </section>

                <section className="lt-panel">
                  <h2 className="lt-panel__title">Your destinations</h2>
                  <div className="lt-chips">
                    {districts.map((d) => (
                      <Link key={d} to={`/accommodation?district=${encodeURIComponent(d)}`} className="lt-chip">
                        <FiMapPin size={12} /> {d}
                      </Link>
                    ))}
                  </div>
                </section>

                {/* Reference's score card, restated as plan coverage from the dataset */}
                <section className="lt-score">
                  <div className="lt-score__eyebrow">Stays from the dataset</div>
                  <div className="lt-score__row">
                    <span className="lt-score__value">{coverage}%</span>
                    <span className="lt-score__suffix">of nights booked</span>
                  </div>
                  <div className="lt-score__bar" role="progressbar" aria-valuenow={coverage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="lt-score__fill" style={{ width: `${coverage}%` }} />
                  </div>
                  <p className="lt-score__text">
                    {booked} of {days.length} days overnight in a property chosen from the{' '}
                    <strong>2,130 listed accommodations</strong>, matched to your budget band,
                    party size and preferred {trip?.accommodation?.toLowerCase() || 'type'}.
                  </p>
                </section>

                <div className="lt-note">
                  <FiAlertTriangle size={16} className="lt-note__icon" />
                  <div>
                    <strong>Estimates.</strong> Stay rates are the dataset&apos;s published
                    double-occupancy prices; food, transport and activity figures are
                    planning allowances for your budget band, not quotations.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
