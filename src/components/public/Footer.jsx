import logo from '../../assets/Aisha images/logo.jpeg'
import { useToast } from '../../context/ToastContext'

export default function Footer() {
  const { addToast } = useToast()

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const comingSoon = (e) => {
    e.preventDefault()
    addToast('This feature will be available shortly.', 'info')
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logo} alt="Aisha Events" className="logo-icon" style={{ width: '32px', height: '32px' }} />
              Aisha Events Centre
            </div>
            <p>Premier hospitality platform for luxury dining, event venues, and culinary experiences across Africa and beyond.</p>
            <div className="footer-socials">
              <a href="#" aria-label="Instagram" onClick={comingSoon}><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="Twitter" onClick={comingSoon}><i className="fab fa-x-twitter"></i></a>
              <a href="#" aria-label="Facebook" onClick={comingSoon}><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="TikTok" onClick={comingSoon}><i className="fab fa-tiktok"></i></a>
              <a href="#" aria-label="LinkedIn" onClick={comingSoon}><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#restaurants" onClick={(e) => { e.preventDefault(); scrollTo('restaurants') }}>Restaurants</a></li>
              <li><a href="#venues" onClick={(e) => { e.preventDefault(); scrollTo('venues') }}>Event Venues</a></li>
              <li><a href="#meals" onClick={(e) => { e.preventDefault(); scrollTo('meals') }}>Order Food</a></li>
              <li><a href="#events" onClick={(e) => { e.preventDefault(); scrollTo('events') }}>Events</a></li>
              <li><a href="#" onClick={comingSoon}>Gift Cards</a></li>
              <li><a href="#" onClick={comingSoon}>Loyalty Rewards</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#" onClick={comingSoon}>About Us</a></li>
              <li><a href="#" onClick={comingSoon}>Careers</a></li>
              <li><a href="#" onClick={comingSoon}>Press</a></li>
              <li><a href="#" onClick={comingSoon}>Blog</a></li>
              <li><a href="#" onClick={comingSoon}>Partners</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('openContactModal')) }}>Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#" onClick={comingSoon}>Help Center</a></li>
              <li><a href="#" onClick={comingSoon}>Privacy Policy</a></li>
              <li><a href="#" onClick={comingSoon}>Terms of Service</a></li>
              <li><a href="#" onClick={comingSoon}>Cookie Policy</a></li>
              <li><a href="#" onClick={comingSoon}>Accessibility</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{new Date().getFullYear()} Aisha Events Centre. All rights reserved.</span>
          <span>Crafted with elegance in Tamale, Ghana</span>
          <span>Website by <strong>HumbleDev Tech</strong></span>
        </div>
      </div>
    </footer>
  )
}
