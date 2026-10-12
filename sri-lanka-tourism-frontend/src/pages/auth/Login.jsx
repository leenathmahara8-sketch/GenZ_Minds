import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { FiMail, FiLock, FiLogIn, FiCompass } from 'react-icons/fi'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter your email and password')
      return
    }
    setSubmitting(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed. Please check your credentials.')
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
                  <h3 className="fw-bold mb-1">Welcome back</h3>
                  <p className="text-muted small mb-0">Log in to continue planning your Sri Lanka trip</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="loginEmail"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <label htmlFor="loginEmail">
                      <FiMail size={14} className="me-1" /> Email address
                    </label>
                  </div>

                  <div className="form-floating mb-4">
                    <input
                      type="password"
                      className="form-control"
                      id="loginPassword"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <label htmlFor="loginPassword">
                      <FiLock size={14} className="me-1" /> Password
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <FiLogIn size={16} className="me-2" />
                        Log in
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center small text-muted mt-4 mb-0">
                  New to Smart Tourism? <Link to="/register">Create an account</Link>
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
