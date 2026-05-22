import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from './ToastContext'
import { dataService, setUseMockData } from '../lib/dataService'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()
const SESSION_KEY = 'aisha_session'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(data) {
  if (data) localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  else localStorage.removeItem(SESSION_KEY)
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

  const login = useCallback(async (email, password) => {
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
  }, [addToast, updateAuth, navigate])

  const register = useCallback(async (firstName, lastName, email, password) => {
    if (dataService.isConfigured()) {
      try {
        const { user: u } = await dataService.signUp(email, password, { first_name: firstName, last_name: lastName, role: 'customer' })
        if (u) {
          setUseMockData(false)
          updateAuth(u, 'customer')
          addToast(`Account created for ${firstName} ${lastName}! Welcome to Aisha.`, 'success')
          navigate('/')
          return
        }
      } catch (e) {
        addToast(`Registration failed: ${e.message}`, 'error')
        return
      }
    }
    const mockUser = { id: `demo-${Date.now()}`, firstName, lastName, email, user_metadata: { role: 'admin' }, app_metadata: {} }
    setUseMockData(true)
    updateAuth(mockUser, 'admin')
    addToast(`Account created for ${firstName} ${lastName}! Welcome to Aisha. (demo mode)`, 'success')
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
