import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    try {
      const data = await api.auth.me()
      setUser(data)
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email, password) => {
    const data = await api.auth.login(email, password)
    localStorage.setItem('token', data.access_token)
    const me = await api.auth.me()
    setUser(me)
    return me
  }

  const register = async (payload) => {
    await api.auth.register(payload)
  }

  const logout = async () => {
    try { await api.auth.logout() } catch {}
    localStorage.removeItem('token')
    setUser(null)
  }

  const isAdmin   = user?.role === 'ADMIN'
  const isDoctor  = user?.role === 'DOCTOR'
  const isPatient = user?.role === 'PATIENT'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isDoctor, isPatient }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
