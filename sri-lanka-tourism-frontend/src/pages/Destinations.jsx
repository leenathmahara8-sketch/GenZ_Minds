import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { FiMapPin, FiSearch, FiFilter, FiCompass } from 'react-icons/fi'

const fallbackDestinations = [
  {
    _id: 'sigiriya',
    name: 'Sigiriya',
    location: 'Central Province',
    category: 'Cultural',
    image: 'https://picsum.photos/seed/sigiriya/800/600',
    description: 'Climb the ancient rock fortress and admire 5th-century frescoes, the mirror wall and symmetrical water gardens.'
  },
  {
    _id: 'kandy',
    name: 'Kandy',
    location: 'Central Province',
    category: 'Cultural',
    image: 'https://picsum.photos/seed/kandy/800/600',
    description: 'The last royal capital, home to the sacred Temple of the Tooth Relic and the colourful Esala Perahera.'
  },
  {
    _id: 'ella',
    name: 'Ella',
    location: 'Uva Province',
    category: 'Nature',
    image: 'https://picsum.photos/seed/ella/800/600',
    description: 'A tiny hill-country town surrounded by tea plantations, waterfalls and scenic railway views.'
  },
  {
    _id: 'galle',
    name: 'Galle',
    location: 'Southern Province',
    category: 'Coastal',
    image: 'https://picsum.photos/seed/galle/800/600',
    description: 'Wander the cobblestone streets of a UNESCO-listed Dutch fort and watch the sun set over the ocean.'
  },
  {
    _id: 'yala',
    name: 'Yala National Park',
    location: 'Southern Province',
    category: 'Wildlife',
    image: 'https://picsum.photos/seed/yala/800/600',
    description: 'Safari country at its best, home to leopards, elephants, sloth bears and painted storks.'
  },
  {
    _id: 'nuwara-eliya',
    name: 'Nuwara Eliya',
    location: 'Central Province',
    category: 'Nature',
    image: 'https://picsum.photos/seed/nuwaraeliya/800/600',
    description: 'Little England in the hills, wrapped in emerald tea estates, misty forests and colonial architecture.'
  },
  {
    _id: 'mirissa',
    name: 'Mirissa',
    location: 'Southern Province',
    category: 'Coastal',
    image: 'https://picsum.photos/seed/mirissa/800/600',
    description: 'A crescent of golden sand where you can watch dolphins at sunrise and whales offshore.'
  },
  {
    _id: 'anuradhapura',
    name: 'Anuradhapura',
    location: 'North Central Province',
    category: 'Cultural',
    image: 'https://picsum.photos/seed/anuradhapura/800/600',
    description: 'Sacred city of towering stupas, ancient monasteries and the oldest planted tree in the world.'
  },
  {
    _id: 'udawalawe',
    name: 'Udawalawe National Park',
    location: 'Sabaragamuwa Province',
    category: 'Wildlife',
    image: 'https://picsum.photos/seed/udawalawe/800/600',
    description: 'Open grasslands and a huge reservoir that attract large herds of elephants all year round.'
  }
]

const truncate = (text, max) => {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}

const imageFor = (d) =>
  d.image ||
  (Array.isArray(d.images) && d.images[0]) ||
  d.imageUrl ||
  'https://picsum.photos/seed/' + encodeURIComponent(d.name || d._id || 'srilanka') + '/800/600'

export default function Destinations() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await api.get('/destinations')
        const data = Array.isArray(res.data) ? res.data : (res.data?.destinations || res.data?.data || [])
        if (!active) return
        if (data.length > 0) {
          setDestinations(data)
        } else {
          setDestinations(fallbackDestinations)
        }
      } catch {
        if (!active) return
        setError('Could not reach the server. Showing sample destinations.')
        setDestinations(fallbackDestinations)
        setUsingFallback(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const categories = useMemo(() => {
    const values = destinations.map((d) => d.category).filter(Boolean)
    return ['All', ...Array.from(new Set(values))]
  }, [destinations])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return destinations.filter((d) => {
      const matchesCategory = category === 'All' || (d.category || '').toLowerCase() === category.toLowerCase()
      if (!matchesCategory) return false
      if (!term) return true
      const haystack = [d.name, d.location, d.description, d.category].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(term)
    })
  }, [destinations, search, category])

  return (
    <div className="container py-5 animate-fade-in">
      <div className="text-center mb-4">
        <h1 className="fw-bold">Explore Sri Lanka</h1>
        <p className="text-muted">Beaches, ancient cities, wildlife parks and misty hill country</p>
      </div>

      <div className="row g-3 mb-4 align-items-end">
        <div className="col-md-8">
          <label htmlFor="destinationSearch" className="form-label small text-muted">
            <FiSearch size={14} className="me-1" /> Search
          </label>
          <input
            id="destinationSearch"
            type="search"
            className="form-control"
            placeholder="Search by name, region or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="categoryFilter" className="form-label small text-muted">
            <FiFilter size={14} className="me-1" /> Category
          </label>
          <select
            id="categoryFilter"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="d-flex flex-column align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading destinations...</span>
          </div>
          <span className="text-muted small mt-3">Loading destinations...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center p-5">
          <div className="card-body">
            <FiCompass size={40} className="text-muted mb-3" />
            <h5 className="fw-semibold">No destinations found</h5>
            <p className="text-muted mb-3">
              Nothing matches &quot;{search}&quot; in {category === 'All' ? 'any category' : category}.
            </p>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => { setSearch(''); setCategory('All') }}
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted small mb-3">
            {filtered.length} destination{filtered.length === 1 ? '' : 's'} found
            {usingFallback ? ' (sample data)' : ''}
          </p>
          <div className="row g-4">
            {filtered.map((d) => {
              const id = d._id || d.id || d.slug
              return (
                <div className="col-sm-6 col-lg-4" key={id || d.name}>
                  <Link to={`/destinations/${id}`} className="text-decoration-none text-dark">
                    <div className="card destination-card">
                      <div className="overflow-hidden" style={{ height: '200px' }}>
                        <img src={imageFor(d)} className="card-img-top h-100 w-100 object-fit-cover" alt={d.name} />
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <h5 className="card-title mb-0 fw-semibold">{d.name}</h5>
                          {d.category && <span className="badge bg-primary text-uppercase">{d.category}</span>}
                        </div>
                        <p className="text-muted small mb-2 d-flex align-items-center">
                          <FiMapPin size={14} className="me-1 flex-shrink-0" />
                          {d.location || 'Sri Lanka'}
                        </p>
                        <p className="card-text text-muted small mb-2">{truncate(d.description, 110)}</p>
                        <span className="small text-primary fw-semibold">View details &rarr;</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
