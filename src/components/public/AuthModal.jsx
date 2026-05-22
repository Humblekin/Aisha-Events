import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    const email = e.target.authEmail.value
    const password = e.target.authPassword.value
    if (!email || !password) return
    setLoading(true)
    await login(email, password)
    setLoading(false)
    onClose()
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const first = e.target.regFirst.value
    const last = e.target.regLast.value
    const email = e.target.regEmail.value
    const password = e.target.regPassword.value
    if (!first || !last || !email || !password) return
    if (password.length < 8) return
    setLoading(true)
    await register(first, last, email, password)
    setLoading(false)
    onClose()
  }

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-label="Authentication">
        <button className="modal-close" onClick={onClose} aria-label="Close"><i className="fas fa-times"></i></button>

        {isLogin ? (
          <div id="loginForm">
            <h2>Welcome Back</h2>
            <p className="modal-subtitle">Sign in to manage your reservations and orders</p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="authEmail">Email Address</label>
                <input type="email" id="authEmail" name="authEmail" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="authPassword">Password</label>
                <input type="password" id="authPassword" name="authPassword" placeholder="Enter your password" required />
              </div>
              <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="modal-switch">Don't have an account? <a onClick={() => setIsLogin(false)}>Create one</a></div>
          </div>
        ) : (
          <div id="registerForm">
            <h2>Create Account</h2>
            <p className="modal-subtitle">Join Aisha Events for exclusive dining and event access</p>
            <form onSubmit={handleRegister}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="regFirst">First Name</label>
                  <input type="text" id="regFirst" name="regFirst" placeholder="First name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="regLast">Last Name</label>
                  <input type="text" id="regLast" name="regLast" placeholder="Last name" required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="regEmail">Email Address</label>
                <input type="email" id="regEmail" name="regEmail" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="regPassword">Password</label>
                <input type="password" id="regPassword" name="regPassword" placeholder="Min 8 characters" required />
              </div>
              <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            <div className="modal-switch">Already have an account? <a onClick={() => setIsLogin(true)}>Sign in</a></div>
          </div>
        )}
      </div>
    </div>
  )
}
