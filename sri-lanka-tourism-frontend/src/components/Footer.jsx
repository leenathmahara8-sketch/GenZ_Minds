import { Link } from 'react-router-dom'
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { label: 'Destinations', path: '/destinations' },
      { label: 'Trip Planner', path: '/plan-trip' },
      { label: 'My Trips', path: '/my-trips' },
      { label: 'Travel Guide', path: '/guide' },
    ],
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Blog', path: '/blog' },
      { label: 'Press', path: '/press' },
    ],
    support: [
      { label: 'Help Center', path: '/help' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'FAQs', path: '/faq' },
      { label: 'Privacy Policy', path: '/privacy' },
    ],
    legal: [
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'Data Policy', path: '/data' },
    ],
  }

  const socialLinks = [
    { icon: FiFacebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: FiTwitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: FiInstagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: FiYoutube, href: 'https://youtube.com', label: 'YouTube' },
  ]

  return (
    <footer className="footer bg-dark text-light py-5 mt-auto">
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4 col-md-6">
            <Link to="/" className="d-flex align-items-center text-decoration-none text-light mb-3">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="white" opacity="0.2"/>
                <path d="M16 6L22 12V20L16 26L10 20V12L16 6Z" fill="white"/>
                <circle cx="16" cy="16" r="4" fill="#0d6efd"/>
              </svg>
              <span className="fw-bold fs-5 ms-2">Smart Tourism</span>
            </Link>
            <p className="text-secondary small mb-3">
              Your AI-powered personalized travel planning companion for exploring the beautiful island of Sri Lanka.
              Discover hidden gems, plan perfect itineraries, and create unforgettable memories.
            </p>
            <div className="d-flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-secondary hover-text-primary transition-colors" aria-label={label}>
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div className="col-lg-2 col-md-6">
            <h6 className="fw-bold mb-3">Discover</h6>
            <ul className="list-unstyled">
              {footerLinks.product.map(({ label, path }) => (
                <li key={label} className="mb-2">
                  <Link to={path} className="text-secondary text-decoration-none small hover-text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-2 col-md-6">
            <h6 className="fw-bold mb-3">Company</h6>
            <ul className="list-unstyled">
              {footerLinks.company.map(({ label, path }) => (
                <li key={label} className="mb-2">
                  <Link to={path} className="text-secondary text-decoration-none small hover-text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-2 col-md-6">
            <h6 className="fw-bold mb-3">Support</h6>
            <ul className="list-unstyled">
              {footerLinks.support.map(({ label, path }) => (
                <li key={label} className="mb-2">
                  <Link to={path} className="text-secondary text-decoration-none small hover-text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-2 col-md-6">
            <h6 className="fw-bold mb-3">Legal</h6>
            <ul className="list-unstyled">
              {footerLinks.legal.map(({ label, path }) => (
                <li key={label} className="mb-2">
                  <Link to={path} className="text-secondary text-decoration-none small hover-text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold mb-3">Contact Us</h6>
            <ul className="list-unstyled text-secondary small">
              <li className="d-flex align-items-start gap-2 mb-2">
                <FiMapPin size={16} className="mt-1 text-primary" />
                <span>Colombo, Sri Lanka</span>
              </li>
              <li className="d-flex align-items-center gap-2 mb-2">
                <FiPhone size={16} className="text-primary" />
                <span>+94 11 234 5678</span>
              </li>
              <li className="d-flex align-items-center gap-2 mb-2">
                <FiMail size={16} className="text-primary" />
                <span>info@smarttourism.lk</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-secondary mb-4" />

        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
            <p className="text-secondary small mb-0">
              &copy; {currentYear} Sri Lanka Smart Tourism & AI Trip Planner. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="text-secondary small mb-0">
              Developed with <span className="text-danger">♥</span> for Sri Lankan Tourism
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}