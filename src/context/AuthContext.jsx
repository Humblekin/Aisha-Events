import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from './ToastContext'
import { dataService, setUseMockData } from '../lib/dataService'
import { supabase } from '../lib/supabase'
import { validateEmail } from '../lib/sanitize'
import { getSession } from '../lib/supabase'

const AuthContext = createContext()
const SESSION_KEY = 'aisha_session'
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 900000

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.expires && Date.now() > parsed.expires) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function saveSession(data) {
  if (data) {
    const session = { ...data, expires: Date.now() + 86400000 }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = loadSession()
    return s?.user || null
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!loadSession())
  const [isAdmin, setIsAdmin] = useState(() => {
    const s = loadSession()
    if (!s?.user) return false
    if (s.user.id?.startsWith('demo-')) return true
    if (s.role) return s.role === 'admin'
    return false
  })

  const navigate = useNavigate()
  const { addToast } = useToast()

  useEffect(() => {
    if (!user) return
    if (user.id?.startsWith('demo-')) return
    getSession().then(session => {
      if (!session) {
        updateAuth(null)
        addToast('Session expired. Please log in again.', 'info')
      }
    })
  }, [])

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    if (user.id?.startsWith('demo-')) {
      setIsAdmin(true)
      setUseMockData(true)
      return
    }
    supabase.from('profiles').select('role').eq('id', user.id).single()
      .then(({ data, error }) => {
        const role = !error && data ? data.role : null
        setIsAdmin(role === 'admin')
      })
  }, [user])

  const updateAuth = useCallback((u, role) => {
    if (u) {
      setUser(u)
      setIsAuthenticated(true)
      setIsAdmin(role === 'admin')
      saveSession({ user: u, role })
    } else {
      setUser(null)
      setIsAuthenticated(false)
      setIsAdmin(false)
      saveSession(null)
    }
  }, [])

  const loginAttempts = useRef({})

  const checkRateLimit = useCallback((identifier) => {
    const now = Date.now()
    const record = loginAttempts.current[identifier]
    if (record) {
      if (record.count >= MAX_LOGIN_ATTEMPTS && now - record.firstAttempt < LOCKOUT_DURATION) {
        const remaining = Math.ceil((LOCKOUT_DURATION - (now - record.firstAttempt)) / 60000)
        throw new Error(`Too many login attempts. Please try again in ${remaining} minute(s).`)
      }
      if (now - record.firstAttempt >= LOCKOUT_DURATION) {
        loginAttempts.current[identifier] = { count: 1, firstAttempt: now }
      } else {
        loginAttempts.current[identifier].count++
      }
    } else {
      loginAttempts.current[identifier] = { count: 1, firstAttempt: now }
    }
  }, [])

  const login = useCallback(async (email, password) => {
    if (!email || !password) {
      addToast('Email and password are required', 'error')
      return
    }
    if (!validateEmail(email)) {
      addToast('Please enter a valid email address', 'error')
      return
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error')
      return
    }
    try {
      checkRateLimit(email.toLowerCase())
    } catch (e) {
      addToast(e.message, 'error')
      return
    }
    if (dataService.isConfigured()) {
      try {
        const { user: u } = await dataService.signIn(email, password)
        if (u) {
          setUseMockData(false)
          let userIsAdmin = false
          try {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', u.id).single()
            userIsAdmin = profile?.role === 'admin'
          } catch {}
          updateAuth(u, userIsAdmin ? 'admin' : 'customer')
          addToast(`Welcome back! Signed in as ${email}`, 'success')
          navigate(userIsAdmin ? '/admin' : '/')
          return
        }
      } catch (e) {
        addToast(`Login failed: ${e.message}`, 'error')
        return
      }
    }
    const mockUser = { id: `demo-${Date.now()}`, email, user_metadata: { role: 'admin' }, app_metadata: {} }
    setUseMockData(true)
    updateAuth(mockUser, 'admin')
    addToast(`Welcome back! Signed in as ${email} (demo mode)`, 'success')
    navigate('/admin')
  }, [addToast, updateAuth, navigate, checkRateLimit])

  const register = useCallback(async (firstName, lastName, email, password) => {
    if (!firstName || !lastName || !email || !password) {
      addToast('All fields are required', 'error')
      return
    }
    if (!validateEmail(email)) {
      addToast('Please enter a valid email address', 'error')
      return
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error')
      return
    }
    const safeFirst = firstName.replace(/[<>&"'/]/g, '').trim()
    const safeLast = lastName.replace(/[<>&"'/]/g, '').trim()
    const safeEmail = email.trim().toLowerCase()
    if (dataService.isConfigured()) {
      try {
        const { user: u } = await dataService.signUp(safeEmail, password, { first_name: safeFirst, last_name: safeLast, role: 'customer' })
        if (u) {
          setUseMockData(false)
          updateAuth(u, 'customer')
          addToast(`Account created for ${safeFirst} ${safeLast}! Welcome to Aisha.`, 'success')
          navigate('/')
          return
        }
      } catch (e) {
        addToast(`Registration failed: ${e.message}`, 'error')
        return
      }
    }
    const mockUser = { id: `demo-${Date.now()}`, firstName: safeFirst, lastName: safeLast, email: safeEmail, user_metadata: { role: 'admin' }, app_metadata: {} }
    setUseMockData(true)
    updateAuth(mockUser, 'admin')
    addToast(`Account created for ${safeFirst} ${safeLast}! Welcome to Aisha. (demo mode)`, 'success')
    navigate('/admin')
  }, [addToast, updateAuth, navigate])

  const logout = useCallback(async () => {
    if (dataService.isConfigured()) {
      try { await dataService.signOut() } catch { /* ignore */ }
    }
    setUseMockData(false)
    updateAuth(null)
    addToast('Logged out successfully', 'info')
  }, [addToast, updateAuth])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
