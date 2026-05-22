import { useToast } from '../../context/ToastContext'

export default function Newsletter() {
  const { addToast } = useToast()

  const handleSubmit = (e) => {
    e.preventDefault()
    addToast('Welcome to the Aisha family! Check your inbox.', 'success')
    e.target.reset()
  }

  return (
    <section className="newsletter-section section-pad" style={{ padding: '60px 0' }}>
      <div className="container">
        <div className="newsletter-inner reveal">
          <div className="newsletter-text">
            <h3>Stay in the Loop</h3>
            <p>Get exclusive offers, event updates, and dining inspiration delivered to your inbox.</p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input type="email" placeholder="Enter your email address" required />
            <button type="submit" className="btn btn-gold">Subscribe</button>
          </form>
        </div>
      </div>
    </section>
  )
}
