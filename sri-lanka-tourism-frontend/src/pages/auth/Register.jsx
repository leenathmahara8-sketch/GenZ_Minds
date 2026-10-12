import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { FiUser, FiMail, FiLock, FiUserPlus, FiCompass } from 'react-icons/fi'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      toast.success('Account created successfully')
      navigate('/')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-11 col-sm-9 col-md-7 col-lg-5 col-xl-4">
            <div className="card auth-card shadow animate-fade-in">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-3" style={{ width: '56px', height: '56px' }}>
                    <FiCompass size={28} />
                  </div>
                  <h3 className="fw-bold mb-1">Create your account</h3>
                  <p className="text-muted small mb-0">Save trips, build itineraries and track your travels</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="regName"
                      placeholder="Full name"
                      value={form.name}
                      onChange={updateField('name')}
                      autoComplete="name"
                    />
                    <label htmlFor="regName">
                      <FiUser size={14} className="me-1" /> Full name
                    </label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="regEmail"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={updateField('email')}
                      autoComplete="email"
                    />
                    <label htmlFor="regEmail">
                      <FiMail size={14} className="me-1" /> Email address
                    </label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="regPassword"
                      placeholder="Password"
                      value={form.password}
                      onChange={updateField('password')}
                      autoComplete="new-password"
                    />
                    <label htmlFor="regPassword">
                      <FiLock size={14} className="me-1" /> Password
                    </label>
                  </div>

                  <div className="form-floating mb-4">
                    <input
                      type="password"
                      className="form-control"
                      id="regConfirmPassword"
                      placeholder="Confirm password"
                      value={form.confirmPassword}
                      onChange={updateField('confirmPassword')}
                      autoComplete="new-password"
                    />
                    <label htmlFor="regConfirmPassword">
                      <FiLock size={14} className="me-1" /> Confirm password
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <FiUserPlus size={16} className="me-2" />
                        Sign up
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center small text-muted mt-4 mb-0">
                  Already have an account? <Link to="/login">Log in</Link>
                </p>
                <p className="text-center small mb-0 mt-2">
                  <Link to="/">Back to home</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
