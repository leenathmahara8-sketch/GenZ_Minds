import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiMapPin, FiX } from 'react-icons/fi'

const fallbackDestinations = [
  {
    _id: 'sigiriya',
    name: 'Sigiriya',
    location: 'Central Province',
    category: 'Cultural',
    image: 'https://picsum.photos/seed/sigiriya/400/300',
    description: 'Ancient rock fortress with frescoes and water gardens.',
    featured: true
  },
  {
    _id: 'ella',
    name: 'Ella',
    location: 'Uva Province',
    category: 'Nature',
    image: 'https://picsum.photos/seed/ella/400/300',
    description: 'Hill-country town famous for tea plantations and the Nine Arch Bridge.',
    featured: true
  },
  {
    _id: 'mirissa',
    name: 'Mirissa',
    location: 'Southern Province',
    category: 'Coastal',
    image: 'https://picsum.photos/seed/mirissa/400/300',
    description: 'Golden beach and whale watching hub on the south coast.',
    featured: false
  }
]

const emptyForm = {
  name: '',
  location: '',
  category: 'Cultural',
  image: '',
  description: '',
  featured: false
}

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await api.get('/destinations')
        const data = Array.isArray(res.data) ? res.data : (res.data?.destinations || res.data?.data || [])
        if (!active) return
        if (data.length > 0) {
          setDestinations(data)
        } else {
          setDestinations(fallbackDestinations)
          setError('The server returned no destinations. Showing sample rows.')
        }
      } catch {
        if (!active) return
        setError('Could not reach the API. Showing sample destinations — changes will not be saved.')
        setDestinations(fallbackDestinations)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const updateField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (destination) => {
    setEditing(destination)
    setForm({
      name: destination.name || '',
      location: destination.location || '',
      category: destination.category || 'Cultural',
      image: destination.image || (Array.isArray(destination.images) ? destination.images[0] : '') || '',
      description: destination.description || '',
      featured: Boolean(destination.featured)
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await api.put(`/destinations/${editing._id}`, form)
        const updated = res.data?.destination || res.data || { ...editing, ...form }
        setDestinations((prev) => prev.map((d) => (d._id === editing._id ? { ...d, ...updated } : d)))
        toast.success('Destination updated')
      } else {
        const res = await api.post('/destinations', form)
        const created = res.data?.destination || res.data
        if (created && typeof created === 'object' && !Array.isArray(created)) {
          setDestinations((prev) => [created, ...prev])
        }
        toast.success('Destination created')
      }
      closeModal()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the destination')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (destination) => {
    if (!window.confirm(`Delete "${destination.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/destinations/${destination._id}`)
      setDestinations((prev) => prev.filter((d) => d._id !== destination._id))
      toast.success('Destination deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the destination')
    }
  }

  const filtered = destinations.filter((d) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return [d.name, d.location, d.category].filter(Boolean).join(' ').toLowerCase().includes(term)
  })

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Destinations</h1>
          <p className="text-muted mb-0">Create, edit and remove the places travellers can visit</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <FiPlus size={16} className="me-2" />
          Add destination
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header bg-white">
          <div className="position-relative" style={{ maxWidth: '320px' }}>
            <FiSearch size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="search"
              className="form-control ps-5"
              placeholder="Search destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="d-flex flex-column align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading destinations...</span>
            </div>
            <span className="text-muted small mt-3">Loading destinations...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 px-3">
            <FiMapPin size={36} className="text-muted mb-2" />
            <h5 className="fw-semibold mb-1">No destinations found</h5>
            <p className="text-muted small mb-0">Try a different search or add a new destination.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '70px' }}>Image</th>
                  <th>Name</th>
                  <th className="d-none d-md-table-cell">Location</th>
                  <th className="d-none d-lg-table-cell">Category</th>
                  <th className="text-center">Featured</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d._id || d.name}>
                    <td>
                      <img
                        src={d.image || (Array.isArray(d.images) && d.images[0]) || 'https://picsum.photos/seed/placeholder/80/60'}
                        alt={d.name}
                        className="rounded"
                        style={{ width: '56px', height: '42px', objectFit: 'cover' }}
                      />
                    </td>
                    <td className="fw-semibold">{d.name}</td>
                    <td className="text-muted d-none d-md-table-cell">{d.location || '—'}</td>
                    <td className="d-none d-lg-table-cell">
                      {d.category && <span className="badge bg-primary text-uppercase">{d.category}</span>}
                    </td>
                    <td className="text-center">
                      {d.featured ? (
                        <span className="badge bg-success">Yes</span>
                      ) : (
                        <span className="badge bg-light text-muted border">No</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openEdit(d)}
                        title="Edit"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(d)}
                        title="Delete"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editing ? 'Edit destination' : 'Add destination'}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} aria-label="Close">
                    <FiX size={18} />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="destName" className="form-label">Name *</label>
                        <input
                          id="destName"
                          type="text"
                          className="form-control"
                          value={form.name}
                          onChange={updateField('name')}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="destLocation" className="form-label">Location</label>
                        <input
                          id="destLocation"
                          type="text"
                          className="form-control"
                          placeholder="Central Province"
                          value={form.location}
                          onChange={updateField('location')}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="destCategory" className="form-label">Category</label>
                        <select
                          id="destCategory"
                          className="form-select"
                          value={form.category}
                          onChange={updateField('category')}
                        >
                          {['Cultural', 'Nature', 'Coastal', 'Wildlife', 'Adventure', 'Urban'].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="destImage" className="form-label">Image URL</label>
                        <input
                          id="destImage"
                          type="text"
                          className="form-control"
                          placeholder="https://..."
                          value={form.image}
                          onChange={updateField('image')}
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="destDescription" className="form-label">Description</label>
                        <textarea
                          id="destDescription"
                          className="form-control"
                          rows="4"
                          value={form.description}
                          onChange={updateField('description')}
                        />
                      </div>
                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            id="destFeatured"
                            className="form-check-input"
                            type="checkbox"
                            checked={form.featured}
                            onChange={updateField('featured')}
                          />
                          <label className="form-check-label" htmlFor="destFeatured">
                            Feature on the home page
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                          Saving...
                        </>
                      ) : editing ? (
                        'Save changes'
                      ) : (
                        'Create destination'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
