import { useEffect, useRef } from 'react'

function StatCounter({ target }) {
  const ref = useRef(null)
  const animated = useRef(false)
  const elRef = useRef(null)

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
          const current = Math.floor(eased * target)
          if (elRef.current) elRef.current.textContent = current.toLocaleString() + '+'
          if (progress < 1) requestAnimationFrame(update)
        }
        requestAnimationFrame(update)
      }
    }, { threshold: 0.5 })
    if (elRef.current) observer.observe(elRef.current)
    return () => observer.disconnect()
  }, [target])

  return <div ref={elRef} className="stat-number">0</div>
}

export default function StatsSection() {
  return (
    <section className="stats-section section-pad">
      <div className="container">
        <div className="stats-grid">
          <div className="stat-item reveal"><StatCounter target={150} /><div className="stat-label">Partner Restaurants</div></div>
          <div className="stat-item reveal reveal-delay-1"><StatCounter target={85} /><div className="stat-label">Event Venues</div></div>
          <div className="stat-item reveal reveal-delay-2"><StatCounter target={50000} /><div className="stat-label">Happy Guests Served</div></div>
          <div className="stat-item reveal reveal-delay-3"><StatCounter target={12000} /><div className="stat-label">Events Hosted</div></div>
        </div>
      </div>
    </section>
  )
}
