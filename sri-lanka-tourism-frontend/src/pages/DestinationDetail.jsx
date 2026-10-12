import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import { FiMapPin, FiCamera, FiArrowRight, FiStar, FiChevronLeft } from 'react-icons/fi'

const fallbackDestination = {
  _id: 'sigiriya',
  name: 'Sigiriya',
  location: 'Central Province',
  category: 'Cultural',
  image: 'https://picsum.photos/seed/sigiriya/1200/600',
  description:
    'Sigiriya, the Lion Rock, is a UNESCO World Heritage site and one of Sri Lanka most visited landmarks. ' +
    'The ancient rock fortress rises nearly 200 metres out of the jungle and was built by King Kashyapa in the 5th century. ' +
    'Climb the metal stairways to the summit for panoramic views, admire the celestial maidens painted on the mirror wall ' +
    'and stroll through the symmetrical water gardens at the base.',
  attractions: [
    { name: 'The Mirror Wall', description: 'Polished plaster that once reflected the king image, now covered in ancient graffiti.' },
    { name: 'Frescoes of the Maidens', description: 'Colourful 5th-century paintings of celestial women tucked into a rock pocket.' },
    { name: 'Lion Paw Terrace', description: 'The final staircase between two giant lion paws carved into the rock.' },
    { name: 'Water Gardens', description: 'Symmetric pools, fountains and boulder gardens laid out below the rock.' }
  ],
  entryFee: 'USD 30',
  bestTimeToVisit: 'December to April'
}

const imageFor = (d) =>
  d.image ||
  (Array.isArray(d.images) && d.images[0]) ||
  d.imageUrl ||
  'https://picsum.photos/seed/' + encodeURIComponent(d.name || 'srilanka') + '/1200/600'

export default function DestinationDetail() {
  const { id } = useParams()
  const [destination, setDestination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/destinations/${id}`)
        if (!active) return
        setDestination(res.data?.destination || res.data)
      } catch {
        if (!active) return
        setError('Could not load this destination from the server. Showing sample information.')
        setDestination(fallbackDestination)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading destination...</span>
        </div>
      </div>
    )
  }

  const attractions = Array.isArray(destination?.attractions)
    ? destination.attractions
    : Array.isArray(destination?.highlights)
      ? destination.highlights
      : []

  return (
    <div className="animate-fade-in pb-5">
      <div className="position-relative" style={{ maxHeight: '420px', overflow: 'hidden' }}>
        <img
          src={imageFor(destination || fallbackDestination)}
          alt={destination?.name || 'Destination'}
          className="w-100 object-fit-cover"
          style={{ height: '360px' }}
        />
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%)' }} />
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end">
          <div className="container pb-4 text-white">
            <Link to="/destinations" className="btn btn-sm btn-outline-light mb-3">
              <FiChevronLeft size={16} className="me-1" /> All destinations
            </Link>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              {destination?.category && <span className="badge bg-warning text-dark text-uppercase">{destination.category}</span>}
              {destination?.rating && (
                <span className="badge bg-light text-dark">
                  <FiStar size={12} className="me-1" />
                  {destination.rating}
                </span>
              )}
            </div>
            <h1 className="display-6 fw-bold mb-1">{destination?.name}</h1>
            <p className="mb-0 d-flex align-items-center opacity-75">
              <FiMapPin size={16} className="me-1" />
              {destination?.location || 'Sri Lanka'}
            </p>
          </div>
        </div>
      </div>

      <div className="container pt-4">
        {error && (
          <div className="alert alert-warning" role="alert">
            {error}
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card p-4 mb-4">
              <h4 className="fw-bold mb-3">About this place</h4>
              <p className="text-muted mb-0" style={{ lineHeight: '1.7' }}>
                {destination?.description || 'More information about this destination will appear here soon.'}
              </p>
            </div>

            <div className="card p-4">
              <h4 className="fw-bold mb-3">
                <FiCamera size={20} className="me-2 text-primary" />
                Things to see
              </h4>
              {attractions.length === 0 ? (
                <p className="text-muted mb-0">No attraction details available yet.</p>
              ) : (
                <div className="row g-3">
                  {attractions.map((a, index) => {
                    const name = typeof a === 'string' ? a : a.name || a.title
                    const description = typeof a === 'string' ? '' : a.description || a.details
                    return (
                      <div className="col-md-6" key={name || index}>
                        <div className="border rounded p-3 h-100 bg-light">
                          <h6 className="fw-semibold mb-1">{name}</h6>
                          {description && <p className="text-muted small mb-0">{description}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card p-4 mb-4">
              <h5 className="fw-bold mb-3">Good to know</h5>
              <ul className="list-unstyled mb-0">
                <li className="d-flex justify-content-between border-bottom py-2 small">
                  <span className="text-muted">Entry fee</span>
                  <span className="fw-semibold">{destination?.entryFee || destination?.price || 'Check locally'}</span>
                </li>
                <li className="d-flex justify-content-between border-bottom py-2 small">
                  <span className="text-muted">Best time</span>
                  <span className="fw-semibold">{destination?.bestTimeToVisit || 'Year round'}</span>
                </li>
                <li className="d-flex justify-content-between py-2 small">
                  <span className="text-muted">Region</span>
                  <span className="fw-semibold">{destination?.location || 'Sri Lanka'}</span>
                </li>
              </ul>
            </div>

            <div className="card p-4 bg-primary text-white">
              <h5 className="fw-bold mb-2">Add {destination?.name} to your trip</h5>
              <p className="small opacity-75 mb-3">
                Build a day-by-day itinerary that includes this destination and more.
              </p>
              <Link to="/plan-trip" className="btn btn-warning fw-semibold w-100">
                Plan my trip <FiArrowRight size={16} className="ms-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
