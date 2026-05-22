import { useData, dataService } from '../../lib/useData'

export default function EventsSection() {
  const { data: events } = useData(dataService.fetchEvents)
  return (
    <section className="section-pad venues-section" id="events">
      <div className="container">
        <div className="section-header reveal">
          <div>
            <span className="section-label">Upcoming</span>
            <h2 className="section-title">Events & Experiences</h2>
            <p className="section-subtitle">Discover curated events, live music nights, wine tastings, and exclusive culinary experiences.</p>
          </div>
          <a href="#" className="view-all">All events <i className="fas fa-arrow-right"></i></a>
        </div>
        <div className="events-grid">
          {events.slice(0, 4).map((e, i) => (
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
                  <span className="spots"><i className="fas fa-fire"></i> {e.spots}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
