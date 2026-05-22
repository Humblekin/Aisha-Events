import { useState, useEffect, useRef } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { dataService } from '../../lib/useData'
import { initializePayment } from '../../lib/paystack'
import { sanitizeText, validateEmail, validatePhone } from '../../lib/sanitize'

const VIP_PACKAGES = [
  { id: 'gold', label: 'Gold', price: 500, color: '#C8A456', desc: 'Premium seating, welcome drink, dedicated server' },
  { id: 'platinum', label: 'Platinum', price: 1000, color: '#E5E4E2', desc: 'Gold + private lounge, champagne, custom menu' },
  { id: 'diamond', label: 'Diamond', price: 2000, color: '#B9F2FF', desc: 'Platinum + personal chef, limousine service, premium decor' },
  { id: 'royal', label: 'Royal', price: 5000, color: '#8A2BE2', desc: 'Diamond + exclusive hall, live entertainment, full concierge' }
]

const OCCASIONS = ['Birthday', 'Anniversary', 'Corporate Event', 'Date Night', 'Family Gathering', 'Private Party', 'Proposal', 'Other']

export default function VIPReservation({ onOpenAuth }) {
  const { addToast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [selectedPackage, setSelectedPackage] = useState('gold')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: 2,
    occasion: '',
    special_requests: '',
    concierge: false,
    name: '',
    phone: '',
    email: ''
  })
  const pendingVip = useRef(null)

  useEffect(() => {
    if (isAuthenticated && pendingVip.current) {
      const data = pendingVip.current
      pendingVip.current = null
      setFormData(data)
      proceedVipPayment(data)
    }
  }, [isAuthenticated])

  const today = new Date().toISOString().split('T')[0]

  const vipPkg = VIP_PACKAGES.find(p => p.id === selectedPackage) || VIP_PACKAGES[0]

  const calcTotal = (concierge) => vipPkg.price + (concierge ? 300 : 0)

  const updateForm = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const doVipBooking = async (data, paymentRef) => {
    setLoading(true)
    try {
      await dataService.addBooking({
        booking_type: 'vip',
        service_name: `VIP ${vipPkg.label} Package`,
        booking_date: data.date,
        booking_time: data.time,
        guests: data.guests,
        user_id: user?.id,
        guest_name: data.name || user?.email || 'VIP Guest',
        vip_package: vipPkg.label,
        vip_occasion: data.occasion,
        vip_concierge: data.concierge,
        special_requests: data.special_requests,
        payment_reference: paymentRef || '',
        amount: calcTotal(data.concierge),
        status: paymentRef ? 'confirmed' : 'pending'
      })
      addToast(`VIP ${vipPkg.label} reservation confirmed! Welcome to Aisha VIP.`, 'success')
      setFormData({ date: '', time: '', guests: 2, occasion: '', special_requests: '', concierge: false, name: '', phone: '', email: '' })
    } catch (err) {
      addToast(`VIP booking failed: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const proceedVipPayment = (data) => {
    setLoading(true)
    const amount = calcTotal(data.concierge)
    const email = data.email || user?.email || 'guest@example.com'

    initializePayment({
      email,
      amount,
      metadata: {
        booking_type: 'vip',
        service_name: `VIP ${vipPkg.label} Package`,
        guests: data.guests,
        booking_date: data.date,
        booking_time: data.time,
        vip_package: vipPkg.label,
        vip_occasion: data.occasion
      },
      onSuccess: async (response) => {
        await doVipBooking(data, response.reference)
      },
      onCancel: () => {
        setLoading(false)
        addToast('Payment cancelled. Your VIP reservation was not confirmed.', 'info')
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.date || !formData.time || !formData.guests || !formData.occasion) {
      addToast('Please fill in all required fields', 'error')
      return
    }

    if (formData.email && !validateEmail(formData.email)) {
      addToast('Please enter a valid email address', 'error')
      return
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      addToast('Please enter a valid phone number', 'error')
      return
    }

    const bookingPayload = {
      date: sanitizeText(formData.date),
      time: sanitizeText(formData.time),
      guests: parseInt(String(formData.guests)) || 1,
      occasion: sanitizeText(formData.occasion),
      special_requests: sanitizeText(formData.special_requests || ''),
      concierge: formData.concierge,
      name: sanitizeText(formData.name || ''),
      phone: sanitizeText(formData.phone || ''),
      email: sanitizeText(formData.email || '')
    }

    if (!isAuthenticated) {
      pendingVip.current = bookingPayload
      onOpenAuth()
      return
    }

    proceedVipPayment(bookingPayload)
  }

  return (
    <section className="vip-section section-pad" id="vip">
      <div className="container">
        <div className="vip-badge">
          <i className="fas fa-crown"></i> VIP Experience
        </div>
        <div className="section-header">
          <div>
            <span className="section-label">Exclusive Access</span>
            <h2 className="section-title">
              The <span className="highlight">VIP</span> Treatment
            </h2>
            <p className="section-subtitle">
              Elevate your experience with our premium packages. Private lounges, personal chefs, 
              dedicated concierge service, and unforgettable memories.
            </p>
          </div>
        </div>

        {/* VIP Packages */}
        <div className="vip-packages">
          {VIP_PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className={`vip-package${selectedPackage === pkg.id ? ' selected' : ''}`}
              onClick={() => setSelectedPackage(pkg.id)}
              style={selectedPackage === pkg.id ? { borderColor: pkg.color, boxShadow: `0 0 30px ${pkg.color}22` } : {}}
            >
              <div className="vip-pkg-icon" style={{ background: `${pkg.color}22`, color: pkg.color }}>
                <i className={`fas fa-${pkg.id === 'gold' ? 'star' : pkg.id === 'platinum' ? 'gem' : pkg.id === 'diamond' ? 'diamond' : 'crown'}`}></i>
              </div>
              <h4 className="vip-pkg-name">{pkg.label}</h4>
              <p className="vip-pkg-desc">{pkg.desc}</p>
              {selectedPackage === pkg.id && <div className="vip-pkg-check"><i className="fas fa-check"></i></div>}
            </div>
          ))}
        </div>

        {/* VIP Booking Form */}
        <div className="vip-form-wrapper glass">
          <div className="vip-form-header">
            <div>
              <h3><i className="fas fa-crown"></i> {vipPkg.label} Package</h3>
              <p>Complete your VIP reservation details</p>
            </div>

          </div>

          <form onSubmit={handleSubmit}>
            <div className="vip-form-grid">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={e => updateForm('date', e.target.value)} min={today} required />
              </div>
              <div className="form-group">
                <label>Time</label>
                <select value={formData.time} onChange={e => updateForm('time', e.target.value)} required>
                  <option value="">Select time</option>
                  <option>10:00 AM</option>
                  <option>12:00 PM</option>
                  <option>2:00 PM</option>
                  <option>4:00 PM</option>
                  <option>6:00 PM</option>
                  <option>7:00 PM</option>
                  <option>8:00 PM</option>
                  <option>9:00 PM</option>
                  <option>10:00 PM</option>
                </select>
              </div>
              <div className="form-group">
                <label>Guests</label>
                <select value={formData.guests} onChange={e => updateForm('guests', parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7,8,9,10,15,20].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Occasion</label>
                <select value={formData.occasion} onChange={e => updateForm('occasion', e.target.value)}>
                  <option value="">Select occasion</option>
                  {OCCASIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Guest Name</label>
                <input type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={formData.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+233 XX XXX XXXX" />
              </div>
            </div>

            <div className="form-group vip-textarea">
              <label>Special Requests</label>
              <textarea
                value={formData.special_requests}
                onChange={e => updateForm('special_requests', e.target.value)}
                placeholder="Dietary preferences, decor requests, entertainment needs..."
                rows={3}
              />
            </div>

            <div className="vip-concierge">
              <label className="vip-concierge-toggle">
                <input type="checkbox" checked={formData.concierge} onChange={e => updateForm('concierge', e.target.checked)} />
                <span className="vip-toggle-track">
                  <span className="vip-toggle-thumb"></span>
                </span>
                <span><i className="fas fa-concierge-bell"></i> Add Dedicated Concierge Service <small>(+GH₵300)</small></span>
              </label>
            </div>

            <div className="vip-form-footer">
              <p className="vip-form-note">
                <i className="fas fa-shield-alt"></i> A reservation fee is required to confirm your VIP booking.
              </p>
              <button type="submit" className="btn btn-gold" disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-crown"></i> Confirm VIP Reservation</>}
              </button>
            </div>
          </form>
        </div>

        {/* VIP Amenities */}
        <div className="vip-amenities">
          <h3>What's Included</h3>
          <div className="vip-amenities-grid">
            <div className="vip-amenity">
              <i className="fas fa-parking"></i>
              <h4>Valet Parking</h4>
              <p>Complimentary valet service for all VIP guests</p>
            </div>
            <div className="vip-amenity">
              <i className="fas fa-champagne-glasses"></i>
              <h4>Premium Drinks</h4>
              <p>Complimentary champagne and premium bar access</p>
            </div>
            <div className="vip-amenity">
              <i className="fas fa-utensils"></i>
              <h4>Custom Menu</h4>
              <p>Personalized menu crafted by our executive chef</p>
            </div>
            <div className="vip-amenity">
              <i className="fas fa-music"></i>
              <h4>Live Entertainment</h4>
              <p>Curated live music or DJ based on your preference</p>
            </div>
            <div className="vip-amenity">
              <i className="fas fa-camera"></i>
              <h4>Photo Package</h4>
              <p>Professional photography to capture your moments</p>
            </div>
            <div className="vip-amenity">
              <i className="fas fa-car-side"></i>
              <h4>Limo Service</h4>
              <p>Luxury transportation to and from the venue</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
