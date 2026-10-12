import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { FiMapPin, FiCompass, FiCamera, FiSun, FiArrowRight, FiHeart } from 'react-icons/fi'

const fallbackDestinations = [
  {
    _id: 'sigiriya',
    name: 'Sigiriya',
    location: 'Central Province',
    category: 'Cultural',
    image: 'https://picsum.photos/seed/sigiriya/800/600',
    description: 'Climb the ancient rock fortress rising 200 metres above the jungle and admire 5th-century frescoes, the mirror wall and symmetrical water gardens.'
  },
  {
    _id: 'kandy',
    name: 'Kandy',
    location: 'Central Province',
    category: 'Cultural',
    image: 'https://picsum.photos/seed/kandy/800/600',
    description: 'The last royal capital, home to the sacred Temple of the Tooth Relic and the colourful Esala Perahera procession.'
  },
  {
    _id: 'ella',
    name: 'Ella',
    location: 'Uva Province',
    category: 'Nature',
    image: 'https://picsum.photos/seed/ella/800/600',
    description: 'A tiny hill-country town surrounded by tea plantations, waterfalls and some of the most scenic railway views on the island.'
  },
  {
    _id: 'galle',
    name: 'Galle',
    location: 'Southern Province',
    category: 'Coastal',
    image: 'https://picsum.photos/seed/galle/800/600',
    description: 'Wander the cobblestone streets of a UNESCO-listed Dutch fort, then watch the sun set over the Indian Ocean ramparts.'
  },
  {
    _id: 'yala',
    name: 'Yala National Park',
    location: 'Southern Province',
    category: 'Wildlife',
    image: 'https://picsum.photos/seed/yala/800/600',
    description: 'Safari country at its best, with one of the highest densities of leopards in the world plus elephants, sloth bears and painted storks.'
  },
  {
    _id: 'nuwara-eliya',
    name: 'Nuwara Eliya',
    location: 'Central Province',
    category: 'Nature',
    image: 'https://picsum.photos/seed/nuwaraeliya/800/600',
    description: 'Known as Little England, this cool misty town is wrapped in emerald tea estates, forests and colonial-era architecture.'
  }
]

const features = [
  { icon: FiCompass, title: 'Smart Itineraries', text: 'Tell us what you love and get a day-by-day plan built around your interests.' },
  { icon: FiCamera, title: 'Iconic Destinations', text: 'From rock forts to golden beaches, explore the places that make Sri Lanka famous.' },
  { icon: FiSun, title: 'Any Season', text: 'Monsoon-aware suggestions keep your trip on track all year round.' },
  { icon: FiHeart, title: 'Local Flavours', text: 'Tea trails, street food and wildlife safaris curated by people who live here.' }
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

export default function Home() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await api.get('/destinations?featured=true')
        const data = Array.isArray(res.data) ? res.data : (res.data?.destinations || res.data?.data || [])
        if (active) setDestinations(data)
      } catch {
        if (active) setError('Showing sample destinations while we reconnect to the server.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const featured = destinations.length > 0 ? destinations : fallbackDestinations

  return (
    <div className="animate-fade-in">
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="lt-hero__chip">AI-Powered Travel Planning</span>
              <h1 className="lt-hero__title">
                Discover Sri Lanka,
                <br />
                <em>your way.</em>
              </h1>
            </div>

            <div className="col-lg-6">
              <img
                src="https://picsum.photos/seed/srilanka-hero/800/500"
                alt="Sri Lanka hill-country railway"
                className="lt-hero__img"
              />

              <p className="lt-hero__lede">
                Tell us your budget, interests and travel dates. Our AI crafts a complete
                personalised itinerary — destinations, hotels, restaurants and routes —
                in seconds.
              </p>

              <div className="lt-hero__stats">
                <div>
                  <div className="lt-hero__stat-value">50+</div>
                  <div className="lt-hero__stat-label">Destinations</div>
                </div>
                <div>
                  <div className="lt-hero__stat-value">10K+</div>
                  <div className="lt-hero__stat-label">Trips Planned</div>
                </div>
                <div>
                  <div className="lt-hero__stat-value">4.8★</div>
                  <div className="lt-hero__stat-label">User Rating</div>
                </div>
              </div>

              <div className="d-flex flex-wrap align-items-center gap-4 mt-4">
                <Link to="/plan-trip" className="lt-btn lt-btn--amber">
                  Plan My Trip <FiArrowRight size={17} />
                </Link>
                <Link to="/destinations" className="lt-link">
                  Browse Destinations <FiArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold">Why plan with us</h2>
          <p className="text-muted">Everything you need for the perfect island holiday</p>
        </div>
        <div className="row g-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div className="col-sm-6 col-lg-3" key={title}>
              <div className="card h-100 text-center p-3">
                <div className="card-body">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-3" style={{ width: '56px', height: '56px' }}>
                    <Icon size={26} />
                  </div>
                  <h5 className="card-title fw-semibold">{title}</h5>
                  <p className="card-text text-muted small mb-0">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">Featured destinations</h2>
            <p className="text-muted mb-0">Hand-picked places to start your Sri Lankan adventure</p>
          </div>
          <Link to="/destinations" className="btn btn-outline-primary">
            View all <FiArrowRight size={16} className="ms-1" />
          </Link>
        </div>

        {error && (
          <div className="alert alert-warning py-2 small" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading destinations...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {featured.map((d) => {
              const id = d._id || d.id || d.slug
              return (
                <div className="col-md-6 col-lg-4" key={id || d.name}>
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
                        <p className="card-text text-muted small mb-0">{truncate(d.description, 110)}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="bg-white border-top">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h2 className="fw-bold mb-2">Ready to map out your adventure?</h2>
              <p className="text-muted mb-0">
                Pick your interests, choose a budget and we will build a day-by-day itinerary with places to stay.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/plan-trip" className="btn btn-primary btn-lg px-4 me-2">
                Start planning
              </Link>
              <Link to="/hotels" className="btn btn-outline-secondary btn-lg">
                Hotels
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
