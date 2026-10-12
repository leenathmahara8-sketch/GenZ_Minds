import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  FiMenu, FiX, FiUser, FiLogIn, FiLogOut, FiSettings, FiChevronDown, FiCompass,
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

/**
 * Sticky page chrome: dark utility strip + teal navigation bar.
 *
 * Bootstrap's JS bundle is not part of this app, so the mobile menu and the
 * account dropdown are driven purely by React toggling the `show` class rather
 * than by data-bs-toggle attributes (which previously did nothing).
 */
export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/destinations', label: 'Destinations' },
    { path: '/hotels', label: 'Hotels' },
    { path: '/accommodation', label: 'Stay' },
    { path: '/plan-trip', label: 'Plan Trip' },
  ]

  const isActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  // Close everything whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
  }

  return (
    <div className="lt-chrome">
      <div className="lt-topbar">
        <Link to="/accommodation" className="lt-topbar__link">
          Sri Lanka Tourism Database
          <FiChevronDown size={13} />
        </Link>
      </div>

      <nav className="lt-nav" aria-label="Main navigation">
        <div className="container">
          <Link to="/" className="lt-brand">
            <span className="lt-brand__mark" aria-hidden="true">
              <FiCompass size={17} />
            </span>
            <span className="lt-brand__text">
              Smart <em>Tourism</em>
            </span>
          </Link>

          <button
            className="lt-burger"
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          <div className={`lt-collapse ${mobileOpen ? 'show' : ''}`}>
            <ul className="lt-nav__links">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`lt-nav__link ${isActive(link.path) ? 'is-active' : ''}`}
                    aria-current={isActive(link.path) ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="lt-nav__actions">
              {user ? (
                <div className="lt-usermenu">
                  <button
                    className="lt-usermenu__btn"
                    type="button"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <FiUser size={16} />
                    <span className="d-none d-md-inline">{user.name}</span>
                    <FiChevronDown size={14} />
                  </button>

                  <div className={`lt-usermenu__menu ${menuOpen ? 'show' : ''}`}>
                    <Link to="/profile" className="lt-usermenu__item">
                      <FiUser size={16} /> Profile
                    </Link>
                    <Link to="/my-trips" className="lt-usermenu__item">
                      <FiSettings size={16} /> My Trips
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="lt-usermenu__item">
                        <FiSettings size={16} /> Admin Dashboard
                      </Link>
                    )}
                    <hr className="lt-usermenu__divider" />
                    <button
                      type="button"
                      className="lt-usermenu__item lt-usermenu__item--danger"
                      onClick={handleLogout}
                    >
                      <FiLogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="lt-nav__signin">
                    <FiLogIn size={15} className="me-1" />
                    Sign In
                  </Link>
                  <Link to="/register" className="lt-btn lt-btn--amber lt-btn--sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
