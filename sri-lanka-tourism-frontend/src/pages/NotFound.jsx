import { Link, useLocation } from 'react-router-dom'
import { FiCompass, FiHome, FiMapPin } from 'react-icons/fi'

export default function NotFound() {
  const location = useLocation()

  return (
    <div className="container py-5 animate-fade-in">
      <div className="row justify-content-center">
        <div className="col-lg-7 text-center">
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-4" style={{ width: '84px', height: '84px' }}>
            <FiCompass size={40} />
          </div>
          <h1 className="display-1 fw-bold text-primary mb-0">404</h1>
          <h2 className="h3 fw-bold mb-3">This road does not exist</h2>
          <p className="text-muted mb-1">
            The page you were looking for could not be found at
          </p>
          <p className="mb-4">
            <code className="bg-light border rounded px-2 py-1">{location.pathname}</code>
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link to="/" className="btn btn-primary fw-semibold px-4">
              <FiHome size={16} className="me-2" />
              Back to home
            </Link>
            <Link to="/destinations" className="btn btn-outline-primary px-4">
              <FiMapPin size={16} className="me-2" />
              Browse destinations
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
