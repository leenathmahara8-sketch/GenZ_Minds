import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { FiUsers, FiSearch, FiTrash2, FiShield } from 'react-icons/fi'

const fallbackUsers = [
  { _id: 'u1', name: 'Amara Perera', email: 'amara@example.com', role: 'admin', createdAt: '2025-11-12T08:30:00Z' },
  { _id: 'u2', name: 'Nimal Silva', email: 'nimal@example.com', role: 'user', createdAt: '2026-01-04T14:05:00Z' },
  { _id: 'u3', name: 'Kasun Fernando', email: 'kasun@example.com', role: 'user', createdAt: '2026-02-18T11:45:00Z' },
  { _id: 'u4', name: 'Ishara Kumara', email: 'ishara@example.com', role: 'user', createdAt: '2026-03-02T09:15:00Z' }
]

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await api.get('/admin/users')
        const data = Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || [])
        if (!active) return
        if (data.length > 0) {
          setUsers(data)
        } else {
          setUsers(fallbackUsers)
          setError('The server returned no users. Showing sample rows.')
        }
      } catch {
        if (!active) return
        setError('Could not reach the API. Showing sample users.')
        setUsers(fallbackUsers)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete "${user.name}"? This cannot be undone.`)) return
    setDeletingId(user._id)
    try {
      await api.delete(`/admin/users/${user._id}`)
      setUsers((prev) => prev.filter((u) => u._id !== user._id))
      toast.success('User deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete this user')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = users.filter((u) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return [u.name, u.email, u.role].filter(Boolean).join(' ').toLowerCase().includes(term)
  })

  const adminCount = users.filter((u) => u.role === 'admin').length

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Users</h1>
          <p className="text-muted mb-0">
            {users.length} account{users.length === 1 ? '' : 's'} · {adminCount} admin{adminCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="position-relative" style={{ maxWidth: '280px', width: '100%' }}>
          <FiSearch size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="search"
            className="form-control ps-5"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="d-flex flex-column align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading users...</span>
            </div>
            <span className="text-muted small mt-3">Loading users...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 px-3">
            <FiUsers size={36} className="text-muted mb-2" />
            <h5 className="fw-semibold mb-1">No users found</h5>
            <p className="text-muted small mb-0">Try a different search term.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th className="d-none d-md-table-cell">Email</th>
                  <th>Role</th>
                  <th className="d-none d-lg-table-cell">Joined</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary fw-semibold" style={{ width: '38px', height: '38px', fontSize: '0.85rem' }}>
                          {initialsOf(user.name)}
                        </span>
                        <span className="fw-semibold">{user.name}</span>
                      </div>
                    </td>
                    <td className="text-muted d-none d-md-table-cell">{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'bg-danger d-inline-flex align-items-center gap-1' : 'bg-secondary'}`}>
                        {user.role === 'admin' && <FiShield size={11} />}
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="text-muted d-none d-lg-table-cell">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user._id}
                      >
                        {deletingId === user._id ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        ) : (
                          <>
                            <FiTrash2 size={15} className="me-1" />
                            Delete
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
