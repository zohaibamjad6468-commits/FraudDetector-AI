/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import api from '../services/api'

const STORAGE_KEY = 'fg_auth_session'

const AuthContext = createContext(null)

function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession)

  // Listen for global auth expiration events from interceptor
  useEffect(() => {
    const handleExpired = () => setSession(null)
    window.addEventListener('fg_auth_expired', handleExpired)
    return () => window.removeEventListener('fg_auth_expired', handleExpired)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login: async ({ email, password, remember }) => {
        try {
          const res = await api.post('/auth/login', { email, password })
          if (res.data && res.data.data) {
            const { accessToken, refreshToken, user } = res.data.data
            const nextSession = { 
              accessToken, 
              refreshToken, 
              email: user.email, 
              role: user.role, 
              name: user.name || user.email 
            }
            setSession(nextSession)
            if (remember) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
            } else {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession)) // Always persist token for Axios interceptor, but could use sessionStorage for non-remember
            }
            return { ok: true, role: user.role }
          }
        } catch (error) {
          if (!error.response) {
            return {
              ok: false,
              message: 'Cannot reach the backend API. Check that Flask is running and CORS is configured.',
            }
          }

          return { 
            ok: false, 
            message: error.response?.data?.message || 'Invalid email or password.' 
          }
        }
      },
      logout: async () => {
        try {
          await api.post('/auth/logout', { 
            refreshToken: session?.refreshToken 
          })
        } catch (e) {
          console.error("Logout failed", e)
        } finally {
          setSession(null)
          localStorage.removeItem(STORAGE_KEY)
        }
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
