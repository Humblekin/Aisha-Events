import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/public/Navbar'
import { sanitizeText } from '../lib/sanitize'
import Hero from '../components/public/Hero'
import FeaturedRestaurants from '../components/public/FeaturedRestaurants'
import PremiumVenues from '../components/public/PremiumVenues'
import TrendingMeals from '../components/public/TrendingMeals'
import EventsSection from '../components/public/EventsSection'
import StatsSection from '../components/public/StatsSection'
import Testimonials from '../components/public/Testimonials'
import VIPReservation from '../components/public/VIPReservation'
import CTASection from '../components/public/CTASection'
import Newsletter from '../components/public/Newsletter'
import Footer from '../components/public/Footer'
import AuthModal from '../components/public/AuthModal'
import '../styles/public.css'

export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const requireAuth = sanitizeText(searchParams.get('require') || '')
    if (requireAuth === 'auth') {
      setAuthOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          // Optional: unobserve once visible to improve performance
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

    const observeElements = () => {
      const elements = document.querySelectorAll('.reveal:not(.visible)')
      elements.forEach(el => observer.observe(el))
    }

    // Initial observation
    observeElements()

    // Watch DOM changes to handle asynchronously loaded sections (Supabase)
    const mutationObserver = new MutationObserver(() => {
      observeElements()
    })
    
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return (
    <>
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      <div className="ambient-orb orb-3"></div>

      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      <Hero onOpenAuth={() => setAuthOpen(true)} />
      <FeaturedRestaurants />
      <PremiumVenues />
      <TrendingMeals />
      <VIPReservation onOpenAuth={() => setAuthOpen(true)} />
      <EventsSection />
      <StatsSection />
      <Testimonials />
      <CTASection onOpenAuth={() => setAuthOpen(true)} />
      <Newsletter />
      <Footer />

      <button
        className={`back-to-top glass${showBackToTop ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <i className="fas fa-chevron-up"></i>
      </button>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
