/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { api, setToken } from '../api/client'

// Real auth against the Spring Boot API. The JWT is persisted in localStorage
// and restored (and validated via /auth/me) on app load.

const TOKEN_KEY = 'milestone.token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Only "loading" if there's a saved token to validate; otherwise resolve now.
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY))

  // Restore a saved session on startup.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (!saved) return
    setToken(saved)
    let alive = true
    api('/auth/me')
      .then((u) => alive && setUser(u))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  async function authenticate(path, body) {
    try {
      const { token, user } = await api(path, { method: 'POST', body })
      localStorage.setItem(TOKEN_KEY, token)
      setToken(token)
      setUser(user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }

  const register = (body) => authenticate('/auth/register', body)
  const login = (body) => authenticate('/auth/login', body)

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
