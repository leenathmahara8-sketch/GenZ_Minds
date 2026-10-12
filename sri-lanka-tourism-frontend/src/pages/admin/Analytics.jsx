import { useState, useEffect } from 'react'
import api from '../../services/api'
import { FiUsers, FiMapPin, FiMap, FiTrendingUp, FiStar } from 'react-icons/fi'

const fallbackAnalytics = {
  totalUsers: 128,
  totalDestinations: 24,
  totalTrips: 86,
  totalReviews: 214,
  averageRating: 4.6,
  tripsByMonth: [
    { label: 'Oct', value: 12 },
    { label: 'Nov', value: 18 },
    { label: 'Dec', value: 31 },
    { label: 'Jan', value: 27 },
    { label: 'Feb', value: 24 },
    { label: 'Mar', value: 35 }
  ],
  topDestinations: [
    { label: 'Sigiriya', value: 38 },
    { label: 'Ella', value: 32 },
    { label: 'Kandy', value: 27 },
    { label: 'Galle', value: 21 },
    { label: 'Yala', value: 16 }
  ],
  tripsByInterest: [
    { label: 'Culture', value: 34 },
    { label: 'Beaches', value: 29 },
    { label: 'Wildlife', value: 22 },
    { label: 'Nature', value: 18 },
    { label: 'Adventure', value: 11 }
  ]
}

const toNumber = (value) => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') return Number(value.total ?? value.count ?? 0) || 0
  return 0
}

const toSeries = (value, fallback) => {
  if (Array.isArray(value) && value.length) {
    return value.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return {
          label: item.label || item.name || item.month || '—',
          value: Number(item.value ?? item.count ?? 0) || 0
        }
      }
      return { label: String(item), value: 0 }
    })
  }
  return fallback
}

function BarChart({ title, data, color = 'primary' }) {
  const max = data.length ? Math.max(...data.map((d) => d.value), 1) : 1
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="card h-100">
      <div className="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
        <span>{title}</span>
        <span className="text-muted small fw-normal">Total: {total.toLocaleString()}</span>
      </div>
      <div className="card-body">
        {data.length === 0 ? (
          <p className="text-muted small mb-0">No data available yet.</p>
        ) : (
          data.map((item) => {
            const percent = Math.round((item.value / max) * 100)
            return (
              <div className="mb-3" key={item.label}>
                <div className="d-flex justify-content-between align-items-center small mb-1">
                  <span className="text-muted text-truncate me-2">{item.label}</span>
                  <span className="fw-semibold flex-shrink-0">{item.value.toLocaleString()}</span>
                </div>
                <div className="rounded w-100" style={{ height: '14px', backgroundColor: '#e9ecef' }}>
                  <div
                    className={`rounded bg-${color}`}
                    style={{ width: `${percent}%`, height: '14px', transition: 'width 0.4s ease' }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(fallbackAnalytics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await api.get('/admin/analytics')
        if (active && res.data) {
          setAnalytics((prev) => ({ ...prev, ...res.data }))
        }
      } catch {
        if (active) setError('Live analytics are unavailable. Showing sample figures.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const stats = [
    { label: 'Total users', value: toNumber(analytics.totalUsers ?? analytics.users), icon: FiUsers, color: 'primary' },
    { label: 'Destinations', value: toNumber(analytics.totalDestinations ?? analytics.destinations), icon: FiMapPin, color: 'success' },
    { label: 'Trips planned', value: toNumber(analytics.totalTrips ?? analytics.trips), icon: FiMap, color: 'warning' },
    { label: 'Avg. rating', value: toNumber(analytics.averageRating ?? analytics.avgRating), icon: FiStar, color: 'info', suffix: ' / 5' }
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Analytics</h1>
        <p className="text-muted mb-0">How travellers are using the platform</p>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="d-flex flex-column align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading analytics...</span>
          </div>
          <span className="text-muted small mt-3">Loading analytics...</span>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {stats.map(({ label, value, icon: Icon, color, suffix = '' }) => (
              <div className="col-6 col-xl-3" key={label}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className={`d-inline-flex align-items-center justify-content-center rounded bg-${color} bg-opacity-10 text-${color} mb-2`} style={{ width: '44px', height: '44px' }}>
                      <Icon size={20} />
                    </div>
                    <div className="fs-4 fw-bold">
                      {value.toLocaleString()}{suffix}
                    </div>
                    <div className="text-muted small">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <BarChart title="Trips planned by month" data={toSeries(analytics.tripsByMonth, fallbackAnalytics.tripsByMonth)} color="primary" />
            </div>
            <div className="col-lg-6">
              <BarChart title="Most visited destinations" data={toSeries(analytics.topDestinations ?? analytics.popularDestinations, fallbackAnalytics.topDestinations)} color="success" />
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <BarChart title="Trips by interest" data={toSeries(analytics.tripsByInterest ?? analytics.interests, fallbackAnalytics.tripsByInterest)} color="warning" />
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header bg-white fw-semibold">Highlights</div>
                <div className="card-body">
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <span className="text-muted">Busiest month</span>
                    <span className="fw-semibold">
                      {toSeries(analytics.tripsByMonth, fallbackAnalytics.tripsByMonth)
                        .slice()
                        .sort((a, b) => b.value - a.value)[0]?.label || '—'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <span className="text-muted">Top destination</span>
                    <span className="fw-semibold">
                      {toSeries(analytics.topDestinations, fallbackAnalytics.topDestinations)
                        .slice()
                        .sort((a, b) => b.value - a.value)[0]?.label || '—'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <span className="text-muted">Trips per user</span>
                    <span className="fw-semibold">
                      {(() => {
                        const users = toNumber(analytics.totalUsers ?? analytics.users)
                        const trips = toNumber(analytics.totalTrips ?? analytics.trips)
                        return users > 0 ? (trips / users).toFixed(1) : '0.0'
                      })()}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-2">
                    <span className="text-muted">Data source</span>
                    <span className="fw-semibold">
                      {error ? 'Sample data' : 'Live API'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
