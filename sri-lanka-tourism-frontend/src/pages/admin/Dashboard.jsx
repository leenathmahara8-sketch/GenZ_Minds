import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { FiUsers, FiMapPin, FiMap, FiTrendingUp, FiPlusCircle, FiBarChart2 } from 'react-icons/fi'

const fallbackStats = {
  users: 128,
  destinations: 24,
  trips: 86,
  reviews: 214
}

const totalOf = (value) => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') return Number(value.total ?? value.count ?? 0) || 0
  return 0
}

const recentFallback = [
  { _id: 'r1', name: 'Sigiriya', location: 'Central Province' },
  { _id: 'r2', name: 'Ella', location: 'Uva Province' },
  { _id: 'r3', name: 'Galle', location: 'Southern Province' }
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(fallbackStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usingFallback, setUsingFallback] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await api.get('/admin/stats')
        if (active && res.data) {
          setStats(res.data)
          setUsingFallback(false)
        }
      } catch {
        if (active) setError('Live statistics are unavailable. Showing the last known numbers.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const cards = [
    { label: 'Registered users', value: totalOf(stats.users), icon: FiUsers, color: 'primary', link: '/admin/users' },
    { label: 'Destinations', value: totalOf(stats.destinations), icon: FiMapPin, color: 'success', link: '/admin/destinations' },
    { label: 'Trips planned', value: totalOf(stats.trips), icon: FiMap, color: 'warning', link: '/admin/analytics' },
    { label: 'Reviews', value: totalOf(stats.reviews), icon: FiTrendingUp, color: 'info', link: '/admin/analytics' }
  ]

  const recentDestinations = Array.isArray(stats.recentDestinations) && stats.recentDestinations.length
    ? stats.recentDestinations
    : recentFallback

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Dashboard</h1>
          <p className="text-muted mb-0">Overview of the Sri Lanka Smart Tourism platform</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/analytics" className="btn btn-outline-primary">
            <FiBarChart2 size={16} className="me-2" />
            Analytics
          </Link>
          <Link to="/admin/destinations" className="btn btn-primary">
            <FiPlusCircle size={16} className="me-2" />
            New destination
          </Link>
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
            <span className="visually-hidden">Loading statistics...</span>
          </div>
          <span className="text-muted small mt-3">Loading statistics...</span>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {cards.map(({ label, value, icon: Icon, color, link }) => (
              <div className="col-sm-6 col-xl-3" key={label}>
                <Link to={link} className="text-decoration-none">
                  <div className="card h-100">
                    <div className="card-body d-flex align-items-center gap-3">
                      <div className={`d-inline-flex align-items-center justify-content-center rounded bg-${color} bg-opacity-10 text-${color}`} style={{ width: '52px', height: '52px' }}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="fs-3 fw-bold text-dark">
                          {loading ? '—' : value.toLocaleString()}
                        </div>
                        <div className="text-muted small">{label}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
                  <span>Recently added destinations</span>
                  <Link to="/admin/destinations" className="small">Manage</Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDestinations.slice(0, 5).map((d) => (
                        <tr key={d._id || d.name}>
                          <td className="fw-semibold">{d.name}</td>
                          <td className="text-muted">{d.location || 'Sri Lanka'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header bg-white fw-semibold">Quick actions</div>
                <div className="card-body d-grid gap-2">
                  <Link to="/admin/destinations" className="btn btn-outline-primary text-start">
                    <FiMapPin size={16} className="me-2" /> Add or edit destinations
                  </Link>
                  <Link to="/admin/users" className="btn btn-outline-primary text-start">
                    <FiUsers size={16} className="me-2" /> Manage users
                  </Link>
                  <Link to="/admin/analytics" className="btn btn-outline-primary text-start">
                    <FiTrendingUp size={16} className="me-2" /> View platform analytics
                  </Link>
                  <Link to="/plan-trip" className="btn btn-outline-secondary text-start">
                    <FiMap size={16} className="me-2" /> Preview trip planner
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {usingFallback && !error && (
            <p className="text-muted small mt-3 mb-0">Sample figures shown while the API is offline.</p>
          )}
        </>
      )}
    </div>
  )
}
