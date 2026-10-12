import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Destinations from './pages/Destinations'
import DestinationDetail from './pages/DestinationDetail'
import Hotels from './pages/Hotels'
import HotelDetail from './pages/HotelDetail'
import Accommodation from './pages/Accommodation'
import AccommodationDetail from './pages/AccommodationDetail'
import TripPlanner from './pages/TripPlanner'
import ItineraryView from './pages/ItineraryView'
import Profile from './pages/user/Profile'
import SavedTrips from './pages/user/SavedTrips'
import TripDetail from './pages/user/TripDetail'
import AdminDashboard from './pages/admin/Dashboard'
import AdminDestinations from './pages/admin/Destinations'
import AdminUsers from './pages/admin/Users'
import AdminAnalytics from './pages/admin/Analytics'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/:id" element={<DestinationDetail />} />
        <Route path="hotels" element={<Hotels />} />
        <Route path="hotels/:id" element={<HotelDetail />} />
        <Route path="accommodation" element={<Accommodation />} />
        <Route path="accommodation/:id" element={<AccommodationDetail />} />
        <Route path="plan-trip" element={<TripPlanner />} />
        <Route path="itinerary/:id" element={<ItineraryView />} />
        
        <Route path="login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="profile" element={<Profile />} />
          <Route path="my-trips" element={<SavedTrips />} />
          <Route path="my-trips/:id" element={<TripDetail />} />
        </Route>
        
        <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/destinations" element={<AdminDestinations />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/analytics" element={<AdminAnalytics />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App