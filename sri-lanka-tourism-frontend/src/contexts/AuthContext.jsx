import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
        setIsAdmin(response.data.role === 'admin')
      } catch {
        // Token invalid or server unreachable — treat as signed out.
        localStorage.removeItem('token')
        setUser(null)
        setIsAdmin(false)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.data.token)
    setUser(response.data.user)
    setIsAdmin(response.data.user.role === 'admin')
    return response.data
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    localStorage.setItem('token', response.data.token)
    setUser(response.data.user)
    setIsAdmin(response.data.user.role === 'admin')
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAdmin(false)
  }

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile', data)
    setUser(response.data)
    return response.data
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      login,
      register,
      logout,
      updateProfile,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}