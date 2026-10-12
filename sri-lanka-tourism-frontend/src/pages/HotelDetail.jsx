import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiArrowLeft, FiMapPin, FiStar, FiCheck, FiExternalLink,
  FiCalendar, FiUsers, FiClock, FiInfo,
} from 'react-icons/fi'
import {
  getHotelDetails,
  getHotelFacilities,
  getHotelDescription,
  getHotelPolicies,
  getRoomList,
  normalizeHotel,
  scoreBadgeClass,
  isBookingConfigured,
  BookingNotConfiguredError,
} from '../services/bookingApi'

/** The detail page needs the search context (dates/guests) to show live prices.
 *  It arrives as query params from the search page; fall back sensibly. */
function useSearchContext(searchParams) {
  return {
    destId: searchParams.get('destId') || '',
    destType: searchParams.get('destType') || 'city',
    checkin: searchParams.get('checkin') || '',
    checkout: searchParams.get('checkout') || '',
    adults: Number(searchParams.get('adults')) || 2,
    children: Number(searchParams.get('children')) || 0,
    rooms: Number(searchParams.get('rooms')) || 1,
    currency: searchParams.get('currency') || 'USD',
  }
}

export default function HotelDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const ctx = useSearchContext(searchParams)

  const [hotel, setHotel] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [description, setDescription] = useState('')
  const [policies, setPolicies] = useState({})
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      // Fail fast with a helpful message rather than letting the per-request
      // .catch() handlers below swallow it and report "Property not found".
      if (!isBookingConfigured()) {
        if (!cancelled) {
          setError(new BookingNotConfiguredError())
          setLoading(false)
        }
        return
      }

      try {
        const [details, facs, desc, pol, roomList] = await Promise.all([
          getHotelDetails(id, ctx).catch(() => null),
          getHotelFacilities(id).catch(() => []),
          getHotelDescription(id).catch(() => ''),
          getHotelPolicies(id).catch(() => ({})),
          ctx.checkin && ctx.checkout
            ? getRoomList(id, ctx).catch(() => [])
            : Promise.resolve([]),
        ])
        if (cancelled) return

        setHotel(details ? normalizeHotel(Array.isArray(details) ? details[0] : details) : null)
        setFacilities(Array.isArray(facs) ? facs : [])
        setDescription(desc)
        setPolicies(pol || {})
        setRooms(Array.isArray(roomList) ? roomList : [])
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ctx.checkin, ctx.checkout, ctx.adults, ctx.currency])

  // Photos arrive either as a top-level array (v2 details) or from /v1/hotels/photos,
  // and entries may be plain URL strings or objects — normalise all of it.
  const rawPhotos = hotel?.raw?.photos ?? hotel?.raw?.data?.photos ?? []
  const photos = rawPhotos
    .map((p) => (typeof p === 'string' ? p : p?.url_original || p?.url || p?.src || p?.image))
    .filter(Boolean)
  if (photos.length === 0 && hotel?.imageUrl) photos.push(hotel.imageUrl)

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted mt-3 mb-0">Loading property…</p>
      </div>
    )
  }

  if (error) {
    const needsKey = error instanceof BookingNotConfiguredError
    return (
      <div className="container py-5">
        <div className={`alert ${needsKey ? 'alert-warning' : 'alert-danger'}`}>
          <h6 className="alert-heading">
            {needsKey ? 'Booking.com API key not configured' : 'Could not load this property'}
          </h6>
          {needsKey ? (
            <>
              <p className="mb-2">
                Subscribe to the Booking.com API on RapidAPI, then add your key to{' '}
                <code>sri-lanka-tourism-frontend/.env</code>:
              </p>
              <pre className="bg-dark text-light p-2 rounded small mb-2">
{`VITE_RAPIDAPI_KEY=your_key_here
VITE_RAPIDAPI_HOST=booking-com.p.rapidapi.com`}
              </pre>
              <small className="text-muted d-block mb-2">Restart the dev server after saving.</small>
            </>
          ) : (
            <p className="mb-3">{error.message}</p>
          )}
          <Link to="/hotels" className={`btn btn-outline-${needsKey ? 'warning' : 'danger'} btn-sm mt-2`}>
            Back to search
          </Link>
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="container py-5 text-center">
        <h5>Property not found</h5>
        <Link to="/hotels" className="btn btn-primary mt-2">Back to search</Link>
      </div>
    )
  }

  const backSearch = new URLSearchParams({
    q: searchParams.get('q') || '',
    destId: ctx.destId,
    destType: ctx.destType,
    checkin: ctx.checkin,
    checkout: ctx.checkout,
    adults: String(ctx.adults),
    children: String(ctx.children),
    rooms: String(ctx.rooms),
    currency: ctx.currency,
  }).toString()

  const facilityNames = facilities
    .map((f) => (typeof f === 'string' ? f : f.facility_name || f.name))
    .filter(Boolean)

  return (
    <div className="pb-5 animate-fade-in">
      <div className="container py-3">
        <Link to={`/hotels?${backSearch}`} className="btn btn-link ps-0 text-decoration-none">
          <FiArrowLeft className="me-1" /> Back to results
        </Link>
      </div>

      <div className="container">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h3 className="mb-1">{hotel.name}</h3>
            <div className="text-muted d-flex flex-wrap align-items-center gap-2">
              {hotel.stars && (
                <span className="text-warning d-inline-flex align-items-center">
                  {Array.from({ length: Number(hotel.stars) || 0 }).map((_, i) => (
                    <FiStar key={i} size={14} fill="currentColor" />
                  ))}
                </span>
              )}
              {hotel.address && <span><FiMapPin className="me-1" />{hotel.address}</span>}
            </div>
          </div>
          <div className="text-end">
            {hotel.reviewScore && (
              <span className={`badge fs-6 ${scoreBadgeClass(hotel.reviewScore)}`}>
                {Number(hotel.reviewScore).toFixed(1)} {hotel.reviewWord && `· ${hotel.reviewWord}`}
              </span>
            )}
            {hotel.reviewCount != null && (
              <div className="text-muted small mt-1">{hotel.reviewCount} reviews</div>
            )}
          </div>
        </div>

        {/* Gallery */}
        {photos.length > 0 && (
          <div className="mb-4">
            <div className="rounded overflow-hidden mb-2" style={{ height: 420 }}>
              <img
                src={photos[activePhoto]}
                alt={hotel.name}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
            </div>
            {photos.length > 1 && (
              <div className="d-flex gap-2 overflow-auto pb-1">
                {photos.slice(0, 12).map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt={`${hotel.name} ${i + 1}`}
                    onClick={() => setActivePhoto(i)}
                    className="rounded flex-shrink-0"
                    style={{
                      width: 110, height: 75, objectFit: 'cover', cursor: 'pointer',
                      outline: i === activePhoto ? '3px solid #0d6efd' : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="row g-4">
          {/* Left column */}
          <div className="col-12 col-lg-8">
            {description && (
              <section className="card p-4 mb-4">
                <h5 className="mb-3">About this property</h5>
                <div
                  className="text-muted"
                  style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}
                >
                  {description.length > 1400 ? `${description.slice(0, 1400)}…` : description}
                </div>
              </section>
            )}

            {facilityNames.length > 0 && (
              <section className="card p-4 mb-4">
                <h5 className="mb-3">What this place offers</h5>
                <div className="row row-cols-1 row-cols-sm-2 g-2">
                  {facilityNames.map((f) => (
                    <div className="col" key={f}>
                      <span className="d-flex align-items-center text-muted">
                        <FiCheck className="text-success me-2 flex-shrink-0" /> {f}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {rooms.length > 0 && (
              <section className="card p-4 mb-4">
                <h5 className="mb-3">Available rooms</h5>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th className="text-end">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((r, i) => {
                        const name = r.room_name || r.name || r.room_description?.[0]?.name || `Room ${i + 1}`
                        const price = r.product_price?.amount ?? r.price ?? r.net_amount
                        const cur = r.product_price?.currency || r.currency || ctx.currency
                        return (
                          <tr key={i}>
                            <td>
                              <div className="fw-semibold">{name}</div>
                              {r.free_cancellation === 1 && (
                                <span className="badge bg-success mt-1">Free cancellation</span>
                              )}
                            </td>
                            <td className="text-end fw-bold">
                              {price != null ? `${cur} ${Math.round(Number(price))}` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {Object.keys(policies).length > 0 && (
              <section className="card p-4">
                <h5 className="mb-3">House rules</h5>
                <div className="row g-3">
                  {policies.checkin && (
                    <div className="col-sm-6">
                      <div className="text-muted small"><FiClock className="me-1" />Check-in</div>
                      <div className="fw-semibold">
                        {typeof policies.checkin === 'object'
                          ? `${policies.checkin.from || ''} – ${policies.checkin.until || ''}`
                          : String(policies.checkin)}
                      </div>
                    </div>
                  )}
                  {policies.checkout && (
                    <div className="col-sm-6">
                      <div className="text-muted small"><FiClock className="me-1" />Check-out</div>
                      <div className="fw-semibold">
                        {typeof policies.checkout === 'object'
                          ? String(policies.checkout.from || policies.checkout.until || '')
                          : String(policies.checkout)}
                      </div>
                    </div>
                  )}
                  {policies.cancellation && (
                    <div className="col-12">
                      <div className="text-muted small"><FiInfo className="me-1" />Cancellation</div>
                      <div>{String(policies.cancellation)}</div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Booking panel */}
          <div className="col-12 col-lg-4">
            <div className="card p-4 position-sticky" style={{ top: '5rem' }}>
              <div className="d-flex justify-content-between align-items-end mb-3">
                {hotel.price != null ? (
                  <div>
                    <div className="fs-4 fw-bold text-primary">
                      {hotel.currency} {Math.round(hotel.price)}
                    </div>
                    <div className="text-muted small">total for your stay</div>
                  </div>
                ) : (
                  <div className="text-muted">Price on request</div>
                )}
                {hotel.isFreeCancellable && <span className="badge bg-success">Free cancellation</span>}
              </div>

              <div className="border rounded p-3 mb-3 small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted"><FiCalendar className="me-1" />Check-in</span>
                  <span className="fw-semibold">{ctx.checkin || '—'}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted"><FiCalendar className="me-1" />Check-out</span>
                  <span className="fw-semibold">{ctx.checkout || '—'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted"><FiUsers className="me-1" />Guests</span>
                  <span className="fw-semibold">
                    {ctx.adults} adult{ctx.adults !== 1 ? 's' : ''}
                    {ctx.children > 0 && `, ${ctx.children} kid${ctx.children !== 1 ? 's' : ''}`}
                    {' · '}{ctx.rooms} room{ctx.rooms !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {hotel.bookingUrl ? (
                <a
                  href={hotel.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-warning fw-semibold w-100"
                  onClick={() => toast('Opening Booking.com to complete your reservation', { icon: 'ℹ️' })}
                >
                  Continue on Booking.com <FiExternalLink className="ms-1" />
                </a>
              ) : (
                <button className="btn btn-warning fw-semibold w-100" disabled>Unavailable</button>
              )}

              <small className="text-muted d-block mt-2 text-center">
                You&apos;ll finish on Booking.com — they handle payment securely.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
