import logo from '../../assets/Aisha images/logo.jpeg'

export default function Footer() {
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
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-x-twitter"></i></a>
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="TikTok"><i className="fab fa-tiktok"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#restaurants" onClick={(e) => { e.preventDefault(); scrollTo('restaurants') }}>Restaurants</a></li>
              <li><a href="#venues" onClick={(e) => { e.preventDefault(); scrollTo('venues') }}>Event Venues</a></li>
              <li><a href="#meals" onClick={(e) => { e.preventDefault(); scrollTo('meals') }}>Order Food</a></li>
              <li><a href="#events" onClick={(e) => { e.preventDefault(); scrollTo('events') }}>Events</a></li>
              <li><a href="#">Gift Cards</a></li>
              <li><a href="#">Loyalty Rewards</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Partners</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
              <li><a href="#">Accessibility</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>2026 Aisha Events Centre. All rights reserved.</span>
          <span>Crafted with elegance in Tamale, Ghana</span>
        </div>
      </div>
    </footer>
  )
}
