import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { FiHome, FiMapPin, FiUsers, FiBarChart2, FiLogOut, FiSettings } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
  const { logout, user } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: FiHome },
    { path: '/admin/destinations', label: 'Destinations', icon: FiMapPin },
    { path: '/admin/users', label: 'Users', icon: FiUsers },
    { path: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid px-4">
          <span className="navbar-brand fw-bold d-flex align-items-center gap-2">
            <FiSettings size={24} />
            Admin Panel
          </span>
          <div className="d-flex align-items-center gap-3 ms-auto">
            <span className="text-light small d-none d-md-block">
              Welcome, {user?.name}
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              <FiLogOut size={16} className="me-1" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          <aside className="col-12 col-md-3 col-lg-2 px-0">
            <div className="d-flex flex-column min-vh-100 bg-white border-end">
              <nav className="nav flex-column px-3 py-4">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded mb-1 ${isActive(path) ? 'bg-primary text-white' : 'text-dark'}`}
                    style={{ backgroundColor: isActive(path) ? '#0d6efd' : 'transparent' }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          <main className="col-12 col-md-9 col-lg-10 px-4 py-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}