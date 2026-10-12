import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import { FiMapPin, FiHeart, FiCalendar, FiDollarSign, FiUsers, FiHome, FiChevronRight, FiChevronLeft, FiCheck } from 'react-icons/fi'

const interestOptions = [
  { id: 'beaches', label: 'Beaches' },
  { id: 'wildlife', label: 'Wildlife safaris' },
  { id: 'culture', label: 'Culture & history' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'nature', label: 'Nature & hikes' },
  { id: 'food', label: 'Food & cuisine' },
  { id: 'tea', label: 'Tea & hill country' },
  { id: 'nightlife', label: 'Nightlife' }
]

const budgetOptions = [
  { id: 'budget', label: 'Budget', hint: 'Hostels, street food, public transport' },
  { id: 'moderate', label: 'Mid-range', hint: 'Comfortable hotels and guided tours' },
  { id: 'luxury', label: 'Luxury', hint: 'Boutique stays and private drivers' }
]

const travelStyles = ['Solo', 'Couple', 'Family', 'Friends']
const accommodationOptions = ['Hostel', 'Hotel', 'Guesthouse', 'Resort', 'No preference']

export default function TripPlanner() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    interests: ['beaches', 'culture'],
    duration: 7,
    budget: 'moderate',
    travelStyle: 'Couple',
    startDate: '',
    groupSize: 2,
    accommodation: 'Hotel',
    notes: ''
  })
  const navigate = useNavigate()

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const toggleInterest = (id) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id]
    }))
  }

  const nextStep = () => {
    if (form.interests.length === 0) {
      toast.error('Pick at least one interest to continue')
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step < 2) {
      nextStep()
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post('/trips/plan', form)
      const data = res.data || {}
      const id = data._id || data.id || data.trip?._id || data.trip?.id || data.itinerary?._id || data.itinerary?.id
      if (!id) {
        throw new Error('The server did not return a trip id')
      }
      toast.success('Your itinerary is ready')
      navigate(`/itinerary/${id}`)
    } catch (err) {
      const payload = err?.response?.data
      const message =
        payload?.message ||
        payload?.error ||
        (err?.code === 'ERR_NETWORK'
          ? 'Cannot reach the API server. Is Flask running on port 5000?'
          : null) ||
        err?.message ||
        'Could not build your itinerary. Please try again.'
      setError(message)
      toast.error(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-5 animate-fade-in">
      <div className="text-center mb-4">
        <h1 className="fw-bold">Plan your Sri Lanka trip</h1>
        <p className="text-muted">Answer a few questions and we will build a day-by-day itinerary</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-9">
          <ul className="list-unstyled d-flex justify-content-center align-items-center gap-3 mb-4">
            <li className={`d-flex align-items-center gap-2 ${step === 1 ? 'fw-bold text-primary' : 'text-muted'}`}>
              <span className={`d-inline-flex align-items-center justify-content-center rounded-circle ${step >= 1 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '32px', height: '32px' }}>
                {step > 1 ? <FiCheck size={16} /> : '1'}
              </span>
              Interests
            </li>
            <li className="text-muted"><FiChevronRight size={18} /></li>
            <li className={`d-flex align-items-center gap-2 ${step === 2 ? 'fw-bold text-primary' : 'text-muted'}`}>
              <span className={`d-inline-flex align-items-center justify-content-center rounded-circle ${step >= 2 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '32px', height: '32px' }}>
                2
              </span>
              Preferences
            </li>
          </ul>

          <form onSubmit={handleSubmit}>
            <div className="card p-4 p-md-5 shadow-sm">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {step === 1 && (
                <div>
                  <h4 className="fw-bold mb-1">
                    <FiHeart size={18} className="me-2 text-primary" />
                    What are you into?
                  </h4>
                  <p className="text-muted small mb-4">Choose one or more interests</p>

                  <div className="row g-2 mb-4">
                    {interestOptions.map((option) => {
                      const selected = form.interests.includes(option.id)
                      return (
                        <div className="col-6 col-md-3" key={option.id}>
                          <button
                            type="button"
                            className={`btn w-100 text-start py-2 px-3 rounded-pill border ${selected ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                            onClick={() => toggleInterest(option.id)}
                          >
                            {selected && <FiCheck size={14} className="me-1" />}
                            {option.label}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label htmlFor="duration" className="form-label fw-semibold">
                        <FiCalendar size={16} className="me-1 text-primary" /> Trip duration
                      </label>
                      <select
                        id="duration"
                        className="form-select"
                        value={form.duration}
                        onChange={(e) => updateField('duration', Number(e.target.value))}
                      >
                        {[3, 5, 7, 10, 14, 21].map((d) => (
                          <option key={d} value={d}>{d} days</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FiDollarSign size={16} className="me-1 text-primary" /> Budget
                      </label>
                      <div className="d-flex flex-column gap-2">
                        {budgetOptions.map((option) => (
                          <label
                            key={option.id}
                            className={`border rounded p-2 d-flex align-items-center gap-2 small cursor-pointer ${form.budget === option.id ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="radio"
                              name="budget"
                              value={option.id}
                              checked={form.budget === option.id}
                              onChange={() => updateField('budget', option.id)}
                            />
                            <span>
                              <span className="fw-semibold d-block">{option.label}</span>
                              <span className="text-muted">{option.hint}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-primary px-4" onClick={nextStep}>
                      Next <FiChevronRight size={16} className="ms-1" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h4 className="fw-bold mb-1">
                    <FiUsers size={18} className="me-2 text-primary" />
                    Travel preferences
                  </h4>
                  <p className="text-muted small mb-4">Tell us a little more about your trip</p>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label htmlFor="travelStyle" className="form-label fw-semibold">Travelling as</label>
                      <select
                        id="travelStyle"
                        className="form-select"
                        value={form.travelStyle}
                        onChange={(e) => updateField('travelStyle', e.target.value)}
                      >
                        {travelStyles.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="groupSize" className="form-label fw-semibold">Group size</label>
                      <input
                        id="groupSize"
                        type="number"
                        min="1"
                        max="30"
                        className="form-control"
                        value={form.groupSize}
                        onChange={(e) => updateField('groupSize', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="startDate" className="form-label fw-semibold">Start date</label>
                      <input
                        id="startDate"
                        type="date"
                        className="form-control"
                        value={form.startDate}
                        onChange={(e) => updateField('startDate', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="accommodation" className="form-label fw-semibold">
                        <FiHome size={15} className="me-1" /> Accommodation
                      </label>
                      <select
                        id="accommodation"
                        className="form-select"
                        value={form.accommodation}
                        onChange={(e) => updateField('accommodation', e.target.value)}
                      >
                        {accommodationOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label htmlFor="notes" className="form-label fw-semibold">Anything else? (optional)</label>
                      <textarea
                        id="notes"
                        className="form-control"
                        rows="3"
                        placeholder="Dietary needs, must-see places, mobility notes..."
                        value={form.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mt-3">
                    <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setStep(1)}>
                      <FiChevronLeft size={16} className="me-1" /> Back
                    </button>
                    <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                          Building itinerary...
                        </>
                      ) : (
                        <>
                          <FiMapPin size={16} className="me-2" />
                          Create itinerary
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>

          <p className="text-center small text-muted mt-3 mb-0">
            Prefer to browse first? <Link to="/destinations">Explore destinations</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
