import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { initializePayment } from '../../lib/paystack'
import { sanitizeText } from '../../lib/sanitize'

export default function Navbar({ onOpenAuth }) {
  const { theme, toggleTheme } = useTheme()
  const { count, items, removeFromCart, getTotal, submitOrder, submitting } = useCart()
  const { isAuthenticated, user, logout } = useAuth()
  const { addToast } = useToast()
  
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [orderType, setOrderType] = useState('Delivery')
  
  const [checkoutStep, setCheckoutStep] = useState('cart') // 'cart' | 'checkout'
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash') // 'cash' | 'paystack'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : ''
    // Reset checkout step when cart closes
    if (!cartOpen) {
      setCheckoutStep('cart')
    }
    return () => { document.body.style.overflow = '' }
  }, [cartOpen])

  useEffect(() => {
    if (!accountOpen) return
    const close = () => setAccountOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [accountOpen])

  const scrollTo = (id) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      setCartOpen(false)
      onOpenAuth()
      addToast('Please sign in to complete your checkout', 'info')
      return
    }
    setCheckoutStep('checkout')
  }

  const handlePlaceOrder = async () => {
    const safeAddress = sanitizeText(deliveryAddress)
    const safeOrderType = sanitizeText(orderType)

    if (safeOrderType === 'Delivery' && !safeAddress) {
      addToast('Please enter a delivery address', 'error')
      return
    }

    if (paymentMethod === 'paystack') {
      const timeoutId = setTimeout(() => {
        addToast('Payment timed out. Please try again.', 'error')
      }, 120000)

      initializePayment({
        email: user?.email || 'customer@aishaevents.com',
        amount: getTotal(),
        metadata: {
          custom_fields: [
            {
              display_name: 'Order Type',
              variable_name: 'order_type',
              value: orderType
            },
            {
              display_name: 'Delivery Address',
              variable_name: 'delivery_address',
              value: safeAddress
            }
          ]
        },
        onSuccess: async (response) => {
          clearTimeout(timeoutId)
          const order = await submitOrder(safeOrderType, safeAddress, {
            method: 'paystack',
            reference: response.reference,
            status: 'completed'
          })
          if (order) {
            setCartOpen(false)
            setCheckoutStep('cart')
            setDeliveryAddress('')
          }
        },
        onCancel: (msg) => {
          clearTimeout(timeoutId)
          addToast(msg || 'Payment cancelled', 'info')
        }
      })
    } else {
      const order = await submitOrder(safeOrderType, safeAddress, {
        method: 'cash',
        reference: '',
        status: 'pending'
      })
      if (order) {
        setCartOpen(false)
        setCheckoutStep('cart')
        setDeliveryAddress('')
      }
    }
  }

  return (
    <>
      <nav className={`nav glass${scrolled ? ' scrolled' : ''}`} id="mainNav" role="navigation" aria-label="Main navigation">
        <a href="#" className="nav-logo">
          <span className="logo-icon">AE</span>
          Aisha Events
        </a>
        <div className="nav-links">
          <a href="#restaurants" onClick={(e) => { e.preventDefault(); scrollTo('restaurants') }}>Restaurants</a>
          <a href="#venues" onClick={(e) => { e.preventDefault(); scrollTo('venues') }}>Venues</a>
          <a href="#meals" onClick={(e) => { e.preventDefault(); scrollTo('meals') }}>Order Food</a>
          <a href="#events" onClick={(e) => { e.preventDefault(); scrollTo('events') }}>Events</a>
          <a href="#vip" onClick={(e) => { e.preventDefault(); scrollTo('vip') }}>VIP</a>
        </div>
        <div className="nav-actions">
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <i className={`fas fa-${theme === 'dark' ? 'moon' : 'sun'}`}></i>
          </button>
          <button type="button" className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Shopping cart">
            <i className="fas fa-shopping-bag"></i>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
          {isAuthenticated ? (
            <div className="account-dropdown" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="btn btn-gold" style={{ padding: '10px 22px', fontSize: '0.82rem' }} onClick={() => setAccountOpen(!accountOpen)}>
                Account <i className="fas fa-chevron-down" style={{ marginLeft: '6px', fontSize: '0.65rem' }}></i>
              </button>
              {accountOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-user">{user?.email}</div>
                  <button type="button" className="dropdown-item" onClick={() => { logout(); setAccountOpen(false) }}>
                    <i className="fas fa-sign-out-alt"></i> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="btn btn-gold" style={{ padding: '10px 22px', fontSize: '0.82rem' }} onClick={onOpenAuth}>
              Sign In
            </button>
          )}
          <button type="button" className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`} id="mobileMenu" role="dialog" aria-label="Mobile navigation" onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false) }}>
        <div className="mobile-menu-header">
          <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollTo('hero') }}>
            <span className="logo-icon">AE</span>
            Aisha Events
          </a>
          <button type="button" className="close-menu" onClick={() => setMobileOpen(false)} aria-label="Close menu"><i className="fas fa-times"></i></button>
        </div>
        <div className="mobile-menu-links" onClick={(e) => e.stopPropagation()}>
          <a href="#restaurants" onClick={(e) => { e.preventDefault(); scrollTo('restaurants') }}>Restaurants</a>
          <a href="#venues" onClick={(e) => { e.preventDefault(); scrollTo('venues') }}>Venues</a>
          <a href="#meals" onClick={(e) => { e.preventDefault(); scrollTo('meals') }}>Order Food</a>
          <a href="#events" onClick={(e) => { e.preventDefault(); scrollTo('events') }}>Events</a>
          <a href="#vip" onClick={(e) => { e.preventDefault(); scrollTo('vip') }}>VIP</a>
        </div>
        <div className="mobile-menu-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <i className={`fas fa-${theme === 'dark' ? 'moon' : 'sun'}`}></i>
          </button>
          <button type="button" className="cart-btn" onClick={() => { setMobileOpen(false); setCartOpen(true) }} aria-label="Shopping cart">
            <i className="fas fa-shopping-bag"></i>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
          {isAuthenticated ? (
            <button type="button" className="btn btn-gold mobile-auth-btn" onClick={() => { setMobileOpen(false); logout() }}>
              <i className="fas fa-sign-out-alt" style={{ marginRight: '6px' }}></i> Sign Out
            </button>
          ) : (
            <button type="button" className="btn btn-gold mobile-auth-btn" onClick={() => { setMobileOpen(false); onOpenAuth() }}>
              Sign In
            </button>
          )}
        </div>
      </div>

      <div className={`cart-overlay${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)}>
        <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cart-modal-header">
            <h3>Your Cart ({count})</h3>
            <button type="button" className="close-menu" onClick={() => setCartOpen(false)} aria-label="Close cart"><i className="fas fa-times"></i></button>
          </div>
          {items.length === 0 ? (
            <div className="cart-empty">
              <i className="fas fa-shopping-bag" style={{ fontSize: '2.5rem', color: 'var(--gray-500)', marginBottom: '12px' }}></i>
              <p>Your cart is empty</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Add some meals to get started!</p>
            </div>
          ) : checkoutStep === 'cart' ? (
            <>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">GH₵{item.price?.toLocaleString()}</div>
                    </div>
                    <button type="button" className="cart-item-remove" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <span>Total</span>
                <span className="cart-total-amount">GH₵{getTotal().toLocaleString()}</span>
              </div>
              <div className="cart-checkout">
                <div className="cart-order-type">
                  <label>Order Type:</label>
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    <option>Delivery</option>
                    <option>Pickup</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={handleProceedToCheckout}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Proceed to Checkout <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 4px' }}>
              <div className="glass" style={{ padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--gold)', fontSize: '0.95rem' }}>Order Summary</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                      <span>{item.name}</span>
                      <span>GH₵{item.price?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--gold)' }}>GH₵{getTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="cart-order-type" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Order Delivery Mode:</label>
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--gray-200)', fontSize: '0.85rem' }}>
                  <option>Delivery</option>
                  <option>Pickup</option>
                </select>
              </div>

              {orderType === 'Delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 500 }}>Delivery Address <span style={{ color: 'var(--red)' }}>*</span></label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full address details (street name, house/building number, city/location)..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: 'var(--gray-200)',
                      fontFamily: 'inherit',
                      fontSize: '0.85rem',
                      resize: 'none',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 500 }}>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--gray-200)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="cash">{orderType === 'Delivery' ? 'Pay on Delivery (Cash/Momo)' : 'Pay on Pickup'}</option>
                  <option value="paystack">Pay Online (Paystack)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCheckoutStep('cart')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <i className="fas fa-arrow-left"></i> Back
                </button>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {submitting ? (
                    <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                  ) : paymentMethod === 'paystack' ? (
                    <><i className="fas fa-credit-card"></i> Pay & Order</>
                  ) : (
                    <><i className="fas fa-check"></i> Place Order</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
