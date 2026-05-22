import { useState, useEffect, useRef } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { dataService } from '../../lib/useData'
import { initializePayment } from '../../lib/paystack'
import { sanitizeText } from '../../lib/sanitize'
import heroVideo from '../../assets/Aisha images/aish video.mp4'
import heroImg1 from '../../assets/Aisha images/image 1.jpeg'
import heroImg2 from '../../assets/Aisha images/image 2.jpeg'

const BOOKING_DEPOSIT = 20

const slides = [heroImg1, heroImg2]

function AnimatedCounter({ target, suffix }) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const animated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true
        const duration = 2000
        const startTime = performance.now()
        function update(currentTime) {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(Math.floor(eased * target))
          if (progress < 1) requestAnimationFrame(update)
        }
        requestAnimationFrame(update)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <div ref={ref} className="hero-stat-num">{value.toLocaleString()}{suffix}</div>
}

export default function Hero({ onOpenAuth }) {
  const { addToast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const pendingBooking = useRef(null)

  useEffect(() => {
    if (videoLoaded) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [videoLoaded])

  useEffect(() => {
    if (isAuthenticated && pendingBooking.current) {
      const data = pendingBooking.current
      pendingBooking.current = null
      proceedToPayment(data)
    }
  }, [isAuthenticated])

  const doBooking = async (data, paymentRef) => {
    setBookingLoading(true)
    try {
      await dataService.addBooking({
        ...data,
        user_id: user?.id,
        guest_name: user?.email || 'Guest',
        payment_reference: paymentRef || '',
        amount: BOOKING_DEPOSIT * (data.guests || 1),
        status: paymentRef ? 'confirmed' : 'pending'
      })
      addToast(`Table reserved for ${data.guests} on ${data.booking_date} at ${data.booking_time}`, 'success')
      const form = document.getElementById('bookingForm')
      form?.reset()
    } catch (err) {
      addToast(`Booking failed: ${err.message}`, 'error')
    } finally {
      setBookingLoading(false)
    }
  }

  const proceedToPayment = (data) => {
    setBookingLoading(true)
    const totalAmount = BOOKING_DEPOSIT * (data.guests || 1)

    const timeoutId = setTimeout(() => {
      setBookingLoading(false)
      addToast('Payment timed out. Please try again.', 'error')
    }, 120000)

    initializePayment({
      email: user?.email || 'guest@example.com',
      amount: totalAmount,
      metadata: {
        booking_type: data.booking_type,
        service_name: data.service_name,
        guests: data.guests,
        booking_date: data.booking_date,
        booking_time: data.booking_time
      },
      onSuccess: async (response) => {
        clearTimeout(timeoutId)
        await doBooking(data, response.reference)
      },
      onCancel: (msg) => {
        clearTimeout(timeoutId)
        setBookingLoading(false)
        addToast(msg || 'Payment cancelled. Your booking was not confirmed.', 'info')
      }
    })
  }

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setMuted(videoRef.current.muted)
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    const form = e.target
    const date = sanitizeText(form.bookDate.value)
    const time = sanitizeText(form.bookTime.value)
    const guests = sanitizeText(form.bookGuests.value)
    const type = sanitizeText(form.bookType.value)

    if (!date || !time || !guests) {
      addToast('Please fill in all booking details', 'error')
      return
    }

    const guestCount = parseInt(guests) || 1

    if (!isAuthenticated) {
      pendingBooking.current = {
        booking_type: 'restaurant',
        service_name: 'Restaurant Booking',
        booking_date: date,
        booking_time: time,
        guests: guestCount,
        special_requests: type !== 'Indoor' ? `Preferred seating: ${type}` : ''
      }
      onOpenAuth()
      return
    }

    proceedToPayment({
      booking_type: 'restaurant',
      service_name: 'Restaurant Booking',
      booking_date: date,
      booking_time: time,
      guests: guestCount,
      special_requests: type !== 'Indoor' ? `Preferred seating: ${type}` : ''
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className={`hero-slide${videoLoaded ? ' active' : ''}`}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`hero-slide${!videoLoaded && i === currentSlide ? ' active' : ''}`}
            style={{ backgroundImage: `url(${slide})` }}
          />
        ))}
      </div>
      <div className="container hero-content">
        <div className="hero-text">
          <div className="hero-badge glass">
            <span className="dot"></span>
            Now Open for Reservations
          </div>
          <h1 className="hero-title">
            Experience Luxury<br />Dining & <span className="highlight">Memorable Events</span>
          </h1>
          <p className="hero-desc">
            Discover exquisite restaurants, breathtaking venues, and curated culinary experiences — all in one place. Reserve, dine, and celebrate with Aisha.
          </p>
          <div className="hero-actions">
            <a href="#restaurants" className="btn btn-gold"><i className="fas fa-utensils"></i> Explore Restaurants</a>
            <a href="#venues" className="btn btn-outline"><i className="fas fa-building"></i> Find Venues</a>
          </div>
          <div className="hero-stats">
            <div>
              <AnimatedCounter target={150} suffix="+" />
              <div className="hero-stat-label">Restaurants</div>
            </div>
            <div>
              <AnimatedCounter target={85} suffix="+" />
              <div className="hero-stat-label">Event Venues</div>
            </div>
            <div>
              <AnimatedCounter target={50000} suffix="+" />
              <div className="hero-stat-label">Happy Guests</div>
            </div>
          </div>
        </div>
        <div className="hero-booking">
          <div className="booking-card glass">
            <h3>Reserve a Table</h3>
            <p>Book your perfect dining experience</p>
            <form id="bookingForm" onSubmit={handleBooking}>
              <div className="form-group">
                <label htmlFor="bookDate">Date</label>
                <input type="date" id="bookDate" name="bookDate" min={today} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bookTime">Time</label>
                  <select id="bookTime" name="bookTime" required>
                    <option value="">Select time</option>
                    <option>12:00 PM</option>
                    <option>1:00 PM</option>
                    <option>2:00 PM</option>
                    <option>6:00 PM</option>
                    <option>7:00 PM</option>
                    <option>8:00 PM</option>
                    <option>9:00 PM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="bookGuests">Guests</label>
                  <select id="bookGuests" name="bookGuests" required>
                    <option value="">Select</option>
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                    <option value="5">5 Guests</option>
                    <option value="6">6 Guests</option>
                    <option value="7">7+ Guests</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="bookType">Seating</label>
                <select id="bookType" name="bookType">
                  <option>Indoor</option>
                  <option>Outdoor Terrace</option>
                  <option>VIP Lounge</option>
                  <option>Private Room</option>
                </select>
              </div>
              <p style={{ fontSize: '.75rem', color: 'var(--gray-500)', textAlign: 'center', marginBottom: '8px' }}>A deposit of GH₵{BOOKING_DEPOSIT}/guest is required to confirm</p>
              <button type="submit" className="btn btn-gold" disabled={bookingLoading}>
                {bookingLoading ? <><i className="fas fa-spinner fa-spin"></i> Processing Payment...</> : <><i className="fas fa-calendar-check"></i> Book Now</>}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="hero-indicators">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`hero-indicator${!videoLoaded && currentSlide === i ? ' active' : ''}`}
            onClick={() => setCurrentSlide(i)}
          />
        ))}
      </div>
      {videoLoaded && (
        <button className="hero-sound-toggle glass" onClick={toggleSound} aria-label={muted ? 'Unmute video' : 'Mute video'}>
          <i className={`fas fa-${muted ? 'volume-mute' : 'volume-up'}`}></i>
        </button>
      )}
    </section>
  )
}
