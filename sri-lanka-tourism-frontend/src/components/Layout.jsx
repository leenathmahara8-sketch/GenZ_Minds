import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      {/* The header is sticky (in normal flow), so no top padding is needed. */}
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}