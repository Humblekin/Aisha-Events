import { useState, useEffect } from 'react'
import { testimonials } from '../../data/mockData'
import testiImg1 from '../../assets/Aisha images/image 1.jpeg'
import testiImg2 from '../../assets/Aisha images/image 2.jpeg'
import testiImg3 from '../../assets/Aisha images/WhatsApp Image 2026-05-12 at 9.19.55 AM.jpeg'

const testiImages = [testiImg1, testiImg2, testiImg3]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="section-pad" id="testimonials">
      <div className="container">
        <div style={{ textAlign: 'center' }} className="reveal">
          <span className="section-label">What People Say</span>
          <h2 className="section-title">Guest Experiences</h2>
        </div>
        <div className="testimonials-wrapper reveal">
          <div className="testimonials-track" style={{ transform: `translateX(-${current * 100}%)` }}>
            {testimonials.map((t, idx) => (
              <div key={t.id} className="testimonial-card">
                <div className="testimonial-img">
                  <img src={testiImages[idx]} alt={t.name} loading="lazy" />
                </div>
                <div className="testimonial-content">
                  <div className="quote-icon">"</div>
                  <p className="quote-text">{t.text}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      <img src={testiImages[idx]} alt={t.name} />
                    </div>
                    <div className="author-info">
                      <div className="author-name">{t.name}</div>
                      <div className="author-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="testi-controls">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`testi-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
