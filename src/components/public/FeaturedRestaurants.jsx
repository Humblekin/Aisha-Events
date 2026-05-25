import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useData, dataService } from '../../lib/useData'

export default function FeaturedRestaurants() {
  const { addToast } = useToast()
  const [liked, setLiked] = useState({})
  const [showAll, setShowAll] = useState(false)
  const { data: restaurants } = useData(dataService.fetchRestaurants)

  const activeRestaurants = restaurants.filter(r => r.status === 'active')
  const displayedRestaurants = showAll ? activeRestaurants : activeRestaurants.slice(0, 6)

  const toggleFav = (id, e) => {
    e.stopPropagation()
    setLiked(prev => ({ ...prev, [id]: !prev[id] }))
    addToast(liked[id] ? 'Removed from favorites' : 'Added to favorites', liked[id] ? 'info' : 'success')
  }

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="section-pad" id="restaurants">
      <div className="container">
        <div className="section-header reveal">
          <div>
            <span className="section-label">Curated Selection</span>
            <h2 className="section-title">Featured Restaurants</h2>
            <p className="section-subtitle">Handpicked dining destinations offering world-class cuisine and unforgettable ambience.</p>
          </div>
          {activeRestaurants.length > 6 && (
            <button className="view-all" onClick={() => setShowAll(!showAll)} style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--gold)'}}>
              {showAll ? 'View less' : 'View all'} <i className={`fas fa-arrow-${showAll ? 'up' : 'right'}`}></i>
            </button>
          )}
        </div>
        <div className="restaurants-grid">
          {displayedRestaurants.map((r, i) => (
            <article key={r.id} className={`restaurant-card glass reveal reveal-delay-${i % 4}`} tabIndex="0">
              <div className="card-img">
                <img src={r.img?.startsWith('http') ? r.img : `https://picsum.photos/seed/${r.img}/600/400.jpg`} alt={r.name} loading="lazy" />
                <div className="card-overlay"></div>
                <button className={`card-fav${liked[r.id] ? ' liked' : ''}`} onClick={(e) => toggleFav(r.id, e)} aria-label="Add to favorites">
                  <i className={`${liked[r.id] ? 'fas' : 'far'} fa-heart`}></i>
                </button>
                <div className="card-tags">
                  {r.tags.map(t => <span key={t} className="card-tag">{t}</span>)}
                </div>
              </div>
              <div className="card-body">
                <h3 className="card-name">{r.name}</h3>
                <div className="card-meta">
                  <span className="rating"><i className="fas fa-star"></i> {r.rating}</span>
                  <span><i className="fas fa-map-marker-alt"></i> {r.location}</span>
                  <span>{r.price}</span>
                </div>
                <div className="card-actions">
                  <button className="btn btn-gold" onClick={() => scrollTo('hero')}>Book Table</button>
                  <button className="btn btn-ghost" onClick={() => scrollTo('meals')}>Order Food</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
