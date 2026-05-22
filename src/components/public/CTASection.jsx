export default function CTASection({ onOpenAuth }) {
  return (
    <section className="section-pad cta-section">
      <div className="container">
        <div className="cta-inner reveal">
          <span className="section-label">Start Your Journey</span>
          <h2 className="section-title">Ready to Host Your Next Event?</h2>
          <p className="section-subtitle">Whether it's an intimate dinner or a grand celebration, Aisha Events Centre brings your vision to life with elegance and precision.</p>
          <div className="cta-actions">
            <button className="btn btn-gold" onClick={onOpenAuth}><i className="fas fa-rocket"></i> Get Started Free</button>
            <a href="#venues" className="btn btn-outline"><i className="fas fa-search"></i> Explore Venues</a>
          </div>
        </div>
      </div>
    </section>
  )
}
