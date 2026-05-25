import { useRef, useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { useData, dataService } from '../../lib/useData'

export default function TrendingMeals() {
  const scrollRef = useRef(null)
  const { addToCart } = useCart()
  const { addToast } = useToast()
  const [showGrid, setShowGrid] = useState(false)
  const { data: meals } = useData(dataService.fetchMeals)

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction * 302, behavior: 'smooth' })
    }
  }

  const handleAdd = (meal) => {
    addToCart(meal.name, meal.price)
    addToast(`${meal.name} added to cart`, 'success')
  }

  return (
    <section className="section-pad" id="meals">
      <div className="container">
        <div className="section-header reveal">
          <div>
            <span className="section-label">Trending Now</span>
            <h2 className="section-title">Order Delicious Meals</h2>
            <p className="section-subtitle">From kitchen to your doorstep — explore our trending dishes and satisfy your cravings.</p>
          </div>
          {meals.length > 0 && (
            <button className="view-all" onClick={() => setShowGrid(!showGrid)} style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--gold)'}}>
              {showGrid ? 'Scroll view' : 'Full menu'} <i className={`fas fa-${showGrid ? 'exchange-alt' : 'arrow-right'}`}></i>
            </button>
          )}
        </div>
        <div className={`meals-scroll-wrapper reveal ${showGrid ? 'grid-mode' : ''}`}>
          <div className={showGrid ? 'meals-grid' : 'meals-scroll'} ref={scrollRef}>
            {meals.map(m => (
              <article key={m.id} className="meal-card glass" tabIndex="0">
                <div className="meal-img">
                  <img src={m.img?.startsWith('http') ? m.img : `https://picsum.photos/seed/${m.img}/400/300.jpg`} alt={m.name} loading="lazy" />
                  <button className="meal-add-btn" onClick={() => handleAdd(m)} aria-label={`Add ${m.name} to cart`}>
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div className="meal-body">
                  <h4 className="meal-name">{m.name}</h4>
                  <p className="meal-desc">{m.desc}</p>
                  <div className="meal-footer">
                    <span className="meal-price">GH₵{m.price}</span>
                    <span className="meal-time"><i className="far fa-clock"></i> {m.time}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!showGrid && (
            <div className="scroll-controls">
              <button className="scroll-btn glass" onClick={() => scroll(-1)} aria-label="Scroll left"><i className="fas fa-chevron-left"></i></button>
              <button className="scroll-btn glass" onClick={() => scroll(1)} aria-label="Scroll right"><i className="fas fa-chevron-right"></i></button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
