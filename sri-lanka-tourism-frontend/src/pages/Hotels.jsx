import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiSearch, FiMapPin, FiCalendar, FiUsers, FiStar, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import {
  searchLocations,
  searchHotels,
  normalizeHotel,
  scoreBadgeClass,
  isBookingConfigured,
  BookingNotConfiguredError,
} from '../services/bookingApi'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'LKR', 'AUD', 'INR']
const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'price', label: 'Price (low to high)' },
  { value: 'review_score', label: 'Guest rating' },
  { value: 'class_descending', label: 'Star rating' },
  { value: 'distance', label: 'Distance from centre' },
]

/** Defaults: check in tomorrow, check out 3 days later. */
function defaultDates() {
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const checkin = new Date()
  checkin.setDate(checkin.getDate() + 1)
  const checkout = new Date(checkin)
  checkout.setDate(checkout.getDate() + 3)
  return { checkin: fmt(checkin), checkout: fmt(checkout) }
}

export default function Hotels() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Search form state, seeded from the URL so a refresh (or back button) keeps results.
  const [destination, setDestination] = useState(searchParams.get('q') || '')
  const [destId, setDestId] = useState(searchParams.get('destId') || '')
  const [destType, setDestType] = useState(searchParams.get('destType') || 'city')
  const dates = useMemo(defaultDates, [])
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || dates.checkin)
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || dates.checkout)
  const [adults, setAdults] = useState(Number(searchParams.get('adults')) || 2)
  const [children, setChildren] = useState(Number(searchParams.get('children')) || 0)
  const [rooms, setRooms] = useState(Number(searchParams.get('rooms')) || 1)
  const [currency, setCurrency] = useState(searchParams.get('currency') || 'USD')
  const [orderBy, setOrderBy] = useState('popularity')

  // Location autocomplete
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [picking, setPicking] = useState(false)
  const debounceRef = useRef(null)
  const boxRef = useRef(null)

  // Results
  const [hotels, setHotels] = useState([])
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const configured = isBookingConfigured()

  /* ---------------- destination autocomplete ---------------- */
  useEffect(() => {
    if (picking) {
      setPicking(false)
      return
    }
    const term = destination.trim()
    if (term.length < 2) {
      setSuggestions([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(term)
        setSuggestions(results.slice(0, 8))
        setShowSuggestions(true)
      } catch {
        // Autocomplete is non-critical — never block the form on it.
        setSuggestions([])
      }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [destination, picking])

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const pickDestination = (loc) => {
    setPicking(true)
    setDestination(loc.label || loc.name)
    setDestId(loc.dest_id)
    setDestType(loc.dest_type || 'city')
    setShowSuggestions(false)
  }

  /* ---------------- search ---------------- */
  const runSearch = async (pageToUse = 0) => {
    if (!configured) {
      setError(new BookingNotConfiguredError())
      return
    }
    if (!destId) {
      toast.error('Pick a destination from the suggestions first')
      return
    }
    if (new Date(checkout) <= new Date(checkin)) {
      toast.error('Check-out must be after check-in')
      return
    }

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const { results, total } = await searchHotels({
        destId,
        destType,
        checkin,
        checkout,
        adults,
        children,
        childrenAges: Array.from({ length: children }, () => '8').join(','),
        rooms,
        currency,
        orderBy,
        page: pageToUse,
      })
      const normalised = results.map(normalizeHotel)
      setHotels(normalised)
      setTotalCount(total)
      setPage(pageToUse)

      setSearchParams({
        q: destination,
        destId,
        destType,
        checkin,
        checkout,
        adults: String(adults),
        children: String(children),
        rooms: String(rooms),
        currency,
      })
    } catch (err) {
      setHotels([])
      setTotalCount(null)
      setError(err)
      if (!(err instanceof BookingNotConfiguredError)) toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    runSearch(0)
  }

  const hasResults = hotels.length > 0
  const canPrev = page > 0 && hasResults
  // Prefer the API's own count; fall back to "a full-looking page means more may exist".
  const canNext = hasResults
    ? totalCount !== null
      ? (page + 1) * hotels.length < totalCount
      : hotels.length >= 20
    : false
  const pastEnd = searched && !hasResults && page > 0

  const nights = useMemo(() => {
    const diff = new Date(checkout) - new Date(checkin)
    return diff > 0 ? Math.round(diff / 86400000) : 0
  }, [checkin, checkout])

  return (
    <div className="pb-5">
      {/* Search bar */}
      <div className="bg-primary text-white py-4 mb-4">
        <div className="container">
          <h4 className="mb-3 d-flex align-items-center gap-2">
            <FiMapPin /> Find stays in Sri Lanka
          </h4>
          <form onSubmit={onSubmit} className="row g-2 align-items-end">
            <div className="col-12 col-md-4 position-relative" ref={boxRef}>
              <label className="form-label small mb-1 text-white-50">Destination</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><FiMapPin /></span>
                <input
                  className="form-control"
                  placeholder="Kandy, Ella, Sigiriya…"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value)
                    // typing invalidates the previously picked dest id
                    setDestId('')
                  }}
                  onFocus={() => suggestions.length && setShowSuggestions(true)}
                  autoComplete="off"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <ul className="list-group position-absolute w-100 shadow-lg" style={{ zIndex: 1050, top: '100%' }}>
                  {suggestions.map((s) => (
                    <li key={`${s.dest_id}-${s.dest_type}`}>
                      <button
                        type="button"
                        className="list-group-item list-group-item-action"
                        onClick={() => pickDestination(s)}
                      >
                        <FiMapPin className="text-primary me-2" />
                        {s.label || s.name}
                        <span className="text-muted small ms-2">({s.dest_type})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label small mb-1 text-white-50">Check-in</label>
              <input type="date" className="form-control" value={checkin} min={dates.checkin}
                onChange={(e) => setCheckin(e.target.value)} required />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small mb-1 text-white-50">Check-out</label>
              <input type="date" className="form-control" value={checkout} min={checkin}
                onChange={(e) => setCheckout(e.target.value)} required />
            </div>
            <div className="col-4 col-md-1">
              <label className="form-label small mb-1 text-white-50">Adults</label>
              <input type="number" className="form-control" min="1" max="16" value={adults}
                onChange={(e) => setAdults(Number(e.target.value))} />
            </div>
            <div className="col-4 col-md-1">
              <label className="form-label small mb-1 text-white-50">Kids</label>
              <input type="number" className="form-control" min="0" max="10" value={children}
                onChange={(e) => setChildren(Number(e.target.value))} />
            </div>
            <div className="col-4 col-md-1">
              <label className="form-label small mb-1 text-white-50">Rooms</label>
              <input type="number" className="form-control" min="1" max="8" value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))} />
            </div>
            <div className="col-12 col-md-1">
              <button className="btn btn-warning fw-semibold w-100" type="submit" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : <FiSearch />}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container">
        {/* Setup help when there's no key yet */}
        {!configured && (
          <div className="alert alert-warning animate-fade-in">
            <h6 className="alert-heading">Booking.com API key not configured</h6>
            <p className="mb-2">
              Subscribe to the Booking.com API on RapidAPI, then add your key to{' '}
              <code>sri-lanka-tourism-frontend/.env</code>:
            </p>
            <pre className="bg-dark text-light p-2 rounded small mb-2">
{`VITE_RAPIDAPI_KEY=your_key_here
VITE_RAPIDAPI_HOST=booking-com.p.rapidapi.com`}
            </pre>
            <small className="text-muted">Restart the dev server after saving.</small>
          </div>
        )}

        {error && !(error instanceof BookingNotConfiguredError) && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>{error.message}</span>
            <button className="btn btn-outline-danger btn-sm" onClick={() => runSearch(page)}>Retry</button>
          </div>
        )}

        {/* Toolbar */}
        {(searched || hasResults) && (
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div className="text-muted small">
              {hasResults ? (
                <>
                  <FiUsers className="me-1" />
                  {adults} adult{adults !== 1 ? 's' : ''}, {children} kid{children !== 1 ? 's' : ''} ·{' '}
                  <FiCalendar className="me-1" />
                  {nights} night{nights !== 1 ? 's' : ''} · {destination}
                </>
              ) : (
                'No stays found — try different dates or destination.'
              )}
            </div>
            <div className="d-flex gap-2 align-items-center">
              <select className="form-select form-select-sm w-auto" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select className="form-select form-select-sm w-auto" value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button className="btn btn-sm btn-outline-primary" onClick={() => runSearch(page)} disabled={loading}>
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading hotels…</span>
            </div>
            <p className="text-muted mt-3 mb-0">Searching live availability…</p>
          </div>
        )}

        {/* Idle state */}
        {!loading && !searched && configured && (
          <div className="text-center py-5 text-muted animate-fade-in">
            <FiSearch size={48} className="mb-3 opacity-50" />
            <h5>Search for hotels across Sri Lanka</h5>
            <p className="mb-0">Live prices and availability, powered by Booking.com</p>
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <>
            <div className="row g-3">
              {hotels.map((h) => (
                <div className="col-12 col-md-6 col-xl-4" key={h.id}>
                  <div className="card destination-card h-100">
                    <div className="position-relative" style={{ height: 190, overflow: 'hidden' }}>
                      {h.imageUrl ? (
                        <img
                          src={h.imageUrl}
                          alt={h.name}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted">
                          <FiMapPin size={32} />
                        </div>
                      )}
                      {h.reviewScore && (
                        <span className={`badge position-absolute top-0 start-0 m-2 ${scoreBadgeClass(h.reviewScore)}`}>
                          {Number(h.reviewScore).toFixed(1)} {h.reviewWord && `· ${h.reviewWord}`}
                        </span>
                      )}
                      {h.isFreeCancellable && (
                        <span className="badge bg-success position-absolute top-0 end-0 m-2">Free cancellation</span>
                      )}
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title mb-1">{h.name}</h6>
                      <div className="text-muted small mb-2">
                        {h.stars && (
                          <span className="me-2">
                            {Array.from({ length: Number(h.stars) || 0 }).map((_, i) => (
                              <FiStar key={i} size={12} className="text-warning" fill="currentColor" />
                            ))}
                          </span>
                        )}
                        {h.city}
                      </div>
                      {h.address && <div className="text-muted small mb-2 text-truncate">{h.address}</div>}
                      <div className="mt-auto d-flex justify-content-between align-items-end pt-2 border-top">
                        <div>
                          {h.distanceToCentre != null && (
                            <div className="text-muted small">{h.distanceToCentre} km from centre</div>
                          )}
                          <div className="text-muted small">
                            {h.reviewCount != null ? `${h.reviewCount} reviews` : 'New to Booking.com'}
                          </div>
                        </div>
                        <div className="text-end">
                          {h.price != null && (
                            <>
                              <div className="fs-5 fw-bold text-primary">{h.currency} {Math.round(h.price)}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>total, {nights || 1} nights</div>
                            </>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/hotels/${h.id}?${new URLSearchParams({
                          destId, destType, checkin, checkout,
                          adults: String(adults), children: String(children),
                          rooms: String(rooms), currency,
                        }).toString()}`}
                        className="btn btn-primary btn-sm mt-2 w-100"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button className="btn btn-outline-primary btn-sm" disabled={!canPrev || loading}
                onClick={() => runSearch(page - 1)}>
                <FiArrowLeft className="me-1" /> Previous
              </button>
              <span className="text-muted small">Page {page + 1}</span>
              <button className="btn btn-outline-primary btn-sm" disabled={!canNext || loading}
                onClick={() => runSearch(page + 1)}>
                Next <FiArrowRight className="ms-1" />
              </button>
            </div>
          </>
        )}

        {/* No results after an actual search */}
        {!loading && searched && !hasResults && !error && (
          <div className="text-center py-5 text-muted">
            <h6>{pastEnd ? "That's every result" : 'No availability for these dates'}</h6>
            <p className="mb-0">
              {pastEnd
                ? 'You have reached the end of the list.'
                : 'Try widening your dates or searching a nearby city.'}
            </p>
            {pastEnd && (
              <button className="btn btn-outline-primary btn-sm mt-2" onClick={() => runSearch(0)}>
                Back to first page
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
