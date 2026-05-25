import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useData, dataService } from '../../lib/useData'

export default function EventsSection() {
  const { addToast } = useToast()
  const [showAll, setShowAll] = useState(false)
  const { data: events } = useData(dataService.fetchEvents)
  const displayedEvents = showAll ? events : events.slice(0, 4)

  return (
    <section className="section-pad venues-section" id="events">
      <div className="container">
        <div className="section-header reveal">
          <div>
            <span className="section-label">Upcoming</span>
            <h2 className="section-title">Events & Experiences</h2>
            <p className="section-subtitle">Discover curated events, live music nights, wine tastings, and exclusive culinary experiences.</p>
          </div>
          {events.length > 4 && (
            <button className="view-all" onClick={() => setShowAll(!showAll)} style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--gold)'}}>
              {showAll ? 'View less' : 'All events'} <i className={`fas fa-arrow-${showAll ? 'up' : 'right'}`}></i>
            </button>
          )}
        </div>
        <div className="events-grid">
          {displayedEvents.map((e, i) => (
            <article key={e.id} className={`event-card glass reveal reveal-delay-${i % 4}`} tabIndex="0">
              <div className="event-img">
                <img src={e.img?.startsWith('http') ? e.img : `https://picsum.photos/seed/${e.img}/600/400.jpg`} alt={e.name} loading="lazy" />
                <div className="event-date">
                  <div className="day">{e.date.day}</div>
                  <div className="month">{e.date.month}</div>
                </div>
              </div>
              <div className="event-body">
                <h3 className="event-name">{e.name}</h3>
                <div className="event-meta">
                  <span><i className="far fa-clock"></i> {e.time}</span>
                  <span><i className="fas fa-map-marker-alt"></i> {e.location}</span>
                </div>
                <div className="event-footer">
                  <span className="event-price">GH₵{e.price}</span>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span className="spots"><i className="fas fa-fire"></i> {e.spots}</span>
                    <button className="btn btn-outline" style={{padding: '6px 12px', fontSize: '0.75rem'}} onClick={(e) => { e.stopPropagation(); addToast('Event booking coming soon!', 'info') }}>Book</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
