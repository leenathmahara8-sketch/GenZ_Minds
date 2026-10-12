import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { FiChevronLeft, FiCalendar, FiMapPin, FiTrash2, FiClock, FiDollarSign } from 'react-icons/fi'

const fallbackTrip = {
  _id: 'sample-trip',
  title: 'Highlights of Sri Lanka',
  status: 'planned',
  itinerary: [
    {
      day: 1,
      title: 'Arrival and the Cultural Triangle',
      activities: [
        { time: '09:00', name: 'Arrive in Colombo', category: 'Transport' },
        { time: '14:00', name: 'Sigiriya Rock Fortress', category: 'Sightseeing' }
      ]
    },
    {
      day: 2,
      title: 'Kandy and the hills',
      activities: [
        { time: '08:30', name: 'Dambulla Cave Temples', category: 'Culture' },
        { time: '17:00', name: 'Temple of the Tooth', category: 'Culture' }
      ]
    },
    {
      day: 3,
      title: 'Beaches of the south',
      activities: [
        { time: '15:00', name: 'Nine Arch Bridge', category: 'Sightseeing' },
        { time: '18:30', name: 'Sunset on the beach', category: 'Relax' }
      ]
    }
  ],
  budget: { total: 45000, currency: 'LKR' }
}

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadTrip = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/trips/${id}`)
      setTrip(res.data?.trip || res.data)
    } catch {
      setError('Could not load this trip from the server. Showing sample information.')
      setTrip(fallbackTrip)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTrip()
  }, [loadTrip])

  const handleDelete = async () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/trips/${id}`)
      toast.success('Trip deleted')
      navigate('/my-trips')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete this trip')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading trip...</span>
        </div>
      </div>
    )
  }

  const days = Array.isArray(trip?.itinerary) && trip.itinerary.length
    ? trip.itinerary
    : Array.isArray(trip?.days) && trip.days.length
      ? trip.days
      : []

  const budget = trip?.budget || {}
  const totalBudget = Number(budget.total ?? budget.totalBudget) || 0
  const totalActivities = days.reduce((sum, d) => sum + (Array.isArray(d.activities) ? d.activities.length : 0), 0)

  return (
    <div className="container py-5 animate-fade-in">
      <Link to="/my-trips" className="btn btn-sm btn-outline-secondary mb-3">
        <FiChevronLeft size={16} className="me-1" /> Back to my trips
      </Link>

      <div className="card p-4 p-md-5 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={`badge ${trip?.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                {trip?.status || 'planned'}
              </span>
              <span className="badge bg-light text-dark">{totalActivities} activities</span>
            </div>
            <h1 className="h3 fw-bold mb-2">{trip?.title || trip?.name || 'Sri Lanka itinerary'}</h1>
            <div className="d-flex flex-wrap gap-3 text-muted small">
              <span>
                <FiCalendar size={14} className="me-1" />
                {trip?.startDate ? new Date(trip.startDate).toLocaleDateString() : 'Flexible dates'}
              </span>
              <span>
                <FiMapPin size={14} className="me-1" />
                {days.length} day{days.length === 1 ? '' : 's'}
              </span>
              {totalBudget > 0 && (
                <span>
                  <FiDollarSign size={14} className="me-1" />
                  {(budget.currency || 'LKR')} {totalBudget.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 size={16} className="me-2" />
                Delete trip
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <h4 className="fw-bold mb-3">Itinerary summary</h4>
      {days.length === 0 ? (
        <div className="alert alert-info">
          This trip does not have any days planned yet.{' '}
          <Link to="/plan-trip">Create a new itinerary</Link>
        </div>
      ) : (
        days.map((day, dayIndex) => {
          const activities = Array.isArray(day.activities) ? day.activities : []
          return (
            <div className="itinerary-day" key={day._id || day.day || dayIndex}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge bg-primary">Day {day.day || dayIndex + 1}</span>
                <h5 className="fw-bold mb-0">{day.title || day.name || 'Exploring Sri Lanka'}</h5>
              </div>
              {activities.length === 0 ? (
                <p className="text-muted small mb-0">No activities planned for this day.</p>
              ) : (
                activities.map((activity, actIndex) => (
                  <div className="itinerary-activity d-flex justify-content-between align-items-start gap-2" key={activity._id || actIndex}>
                    <div>
                      <h6 className="fw-semibold mb-1">
                        {activity.name || activity.title || activity.activity || 'Activity'}
                      </h6>
                      {activity.description && (
                        <p className="text-muted small mb-0">{activity.description}</p>
                      )}
                    </div>
                    <div className="text-end flex-shrink-0">
                      {activity.category && (
                        <span className="badge bg-secondary badge-activity">{activity.category}</span>
                      )}
                      {(activity.time || activity.startTime) && (
                        <div className="text-muted small mt-1">
                          <FiClock size={12} className="me-1" />
                          {activity.time || activity.startTime}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
