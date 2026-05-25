import { useState } from 'react'
import { useData, dataService } from '../../lib/useData'

export default function PremiumVenues() {
  const [showAll, setShowAll] = useState(false)
  const { data: venues } = useData(dataService.fetchVenues)
  
  const activeVenues = venues.filter(v => v.status === 'active')
  const displayedVenues = showAll ? activeVenues : activeVenues.slice(0, 4)

  return (
    <section className="section-pad venues-section" id="venues">
      <div className="container">
        <div className="section-header reveal">
          <div>
            <span className="section-label">Stunning Spaces</span>
            <h2 className="section-title">Premium Event Venues</h2>
            <p className="section-subtitle">From intimate gatherings to grand celebrations, find the perfect venue for your occasion.</p>
          </div>
          {activeVenues.length > 4 && (
            <button className="view-all" onClick={() => setShowAll(!showAll)} style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--gold)'}}>
              {showAll ? 'View less' : 'View all'} <i className={`fas fa-arrow-${showAll ? 'up' : 'right'}`}></i>
            </button>
          )}
        </div>
        <div className="venues-grid">
          {displayedVenues.map((v, i) => (
            <article key={v.id} className={`venue-card glass reveal reveal-delay-${i % 4}`} tabIndex="0">
              <div className="venue-img">
                <img src={v.img?.startsWith('http') ? v.img : `https://picsum.photos/seed/${v.img}/800/500.jpg`} alt={v.name} loading="lazy" />
                <div className="venue-overlay"></div>
                <span className="venue-badge">{v.badge}</span>
                <span className="venue-capacity"><i className="fas fa-users"></i> {v.capacity} Guests</span>
                <div className="venue-info">
                  <h3 className="venue-name">{v.name}</h3>
                  <div className="venue-details">
                    <span><i className="fas fa-tag"></i> {v.type}</span>
                    <span><i className="fas fa-star" style={{ color: 'var(--gold)' }}></i> 4.{8 - i}</span>
                  </div>
                  <div className="venue-price">GH₵{v.price} <span>/event</span></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
