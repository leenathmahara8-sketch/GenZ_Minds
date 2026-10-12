import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { FiMap, FiCalendar, FiArrowRight, FiCompass, FiMapPin } from 'react-icons/fi'

export default function SavedTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await api.get('/trips')
        const data = Array.isArray(res.data) ? res.data : (res.data?.trips || res.data?.data || [])
        if (active) setTrips(data)
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Could not load your trips right now. Please try again later.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const formatDate = (value) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
  }

  return (
    <div className="container py-5 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">My trips</h1>
          <p className="text-muted mb-0">Every itinerary you have planned, saved in one place</p>
        </div>
        <Link to="/plan-trip" className="btn btn-primary">
          <FiMap size={16} className="me-2" />
          Plan a new trip
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="d-flex flex-column align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading trips...</span>
          </div>
          <span className="text-muted small mt-3">Loading your trips...</span>
        </div>
      ) : trips.length === 0 ? (
        <div className="card text-center p-5">
          <div className="card-body">
            <FiCompass size={44} className="text-muted mb-3" />
            <h4 className="fw-bold mb-2">No trips yet</h4>
            <p className="text-muted mb-4">
              You have not saved any itineraries. Answer a few questions and we will build
              a day-by-day plan for your Sri Lanka adventure.
            </p>
            <Link to="/plan-trip" className="btn btn-primary fw-semibold px-4">
              Start planning <FiArrowRight size={16} className="ms-1" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {trips.map((trip) => {
            const id = trip._id || trip.id
            const days = Array.isArray(trip.itinerary) ? trip.itinerary : (Array.isArray(trip.days) ? trip.days : [])
            return (
              <div className="col-md-6 col-lg-4" key={id}>
                <div className="card h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <h5 className="card-title fw-semibold mb-0">
                        {trip.title || trip.name || 'Sri Lanka itinerary'}
                      </h5>
                      <span className={`badge ${trip.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                        {trip.status || 'planned'}
                      </span>
                    </div>

                    <p className="text-muted small mb-2 d-flex align-items-center">
                      <FiCalendar size={14} className="me-1" />
                      {formatDate(trip.startDate) || 'Dates flexible'}
                      {trip.endDate ? ` — ${formatDate(trip.endDate)}` : ''}
                    </p>

                    <p className="text-muted small mb-3 d-flex align-items-center">
                      <FiMapPin size={14} className="me-1" />
                      {days.length > 0
                        ? `${days.length} day${days.length === 1 ? '' : 's'} planned`
                        : `${trip.duration || 'Multi'} day trip`}
                      {Array.isArray(trip.interests) && trip.interests.length > 0
                        ? ` · ${trip.interests.slice(0, 3).join(', ')}`
                        : ''}
                    </p>

                    <p className="card-text text-muted small flex-grow-1">
                      {trip.summary || trip.description || 'A personalised itinerary built around your interests.'}
                    </p>

                    <Link to={`/my-trips/${id}`} className="btn btn-outline-primary btn-sm mt-2 align-self-start">
                      View itinerary <FiArrowRight size={14} className="ms-1" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
