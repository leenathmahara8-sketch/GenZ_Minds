import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { FiUser, FiMail, FiPhone, FiSave, FiMapPin, FiLock } from 'react-icons/fi'

export default function Profile() {
  const { user, loading, updateProfile } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', bio: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || ''
      })
    }
  }, [user])

  const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ name: form.name, phone: form.phone, location: form.location, bio: form.bio })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update your profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
      </div>
    )
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="container py-5 animate-fade-in">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold" style={{ width: '72px', height: '72px', fontSize: '1.5rem' }}>
              {initials}
            </div>
            <div>
              <h1 className="h3 fw-bold mb-1">{user?.name}</h1>
              <span className={`badge ${user?.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                {user?.role === 'admin' ? 'Administrator' : 'Traveller'}
              </span>
            </div>
          </div>

          <div className="card p-4 p-md-5 shadow-sm">
            <h4 className="fw-bold mb-1">Profile settings</h4>
            <p className="text-muted small mb-4">Update your personal details and travel contact info</p>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="profileName" className="form-label fw-semibold">
                    <FiUser size={15} className="me-1 text-primary" /> Full name
                  </label>
                  <input
                    id="profileName"
                    type="text"
                    className="form-control"
                    value={form.name}
                    onChange={updateField('name')}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="profileEmail" className="form-label fw-semibold">
                    <FiMail size={15} className="me-1 text-primary" /> Email
                  </label>
                  <input
                    id="profileEmail"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={updateField('email')}
                    disabled
                  />
                  <div className="form-text d-flex align-items-center">
                    <FiLock size={12} className="me-1" /> Email cannot be changed here
                  </div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="profilePhone" className="form-label fw-semibold">
                    <FiPhone size={15} className="me-1 text-primary" /> Phone
                  </label>
                  <input
                    id="profilePhone"
                    type="tel"
                    className="form-control"
                    placeholder="+94 77 123 4567"
                    value={form.phone}
                    onChange={updateField('phone')}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="profileLocation" className="form-label fw-semibold">
                    <FiMapPin size={15} className="me-1 text-primary" /> Home city
                  </label>
                  <input
                    id="profileLocation"
                    type="text"
                    className="form-control"
                    placeholder="Colombo"
                    value={form.location}
                    onChange={updateField('location')}
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="profileBio" className="form-label fw-semibold">About you</label>
                  <textarea
                    id="profileBio"
                    className="form-control"
                    rows="4"
                    placeholder="Tell us about the kind of trips you enjoy..."
                    value={form.bio}
                    onChange={updateField('bio')}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary fw-semibold px-4" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave size={16} className="me-2" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
