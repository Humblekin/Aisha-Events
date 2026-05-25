import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { dataService } from '../../lib/useData'

export default function ContactModal({ isOpen, onClose }) {
  const { addToast } = useToast()
  const [sending, setSending] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const name = form.contactName.value.trim()
    const email = form.contactEmail.value.trim()
    const subject = form.contactSubject.value
    const message = form.contactMessage.value.trim()

    if (!name || !email || !subject || !message) {
      addToast('Please fill in all fields', 'error')
      return
    }

    setSending(true)
    try {
      await dataService.addComplaint({
        subject,
        description: `From: ${name} (${email})\n\n${message}`,
        priority: 'medium',
        status: 'open'
      })
      addToast('Message sent! We will get back to you soon.', 'success')
      form.reset()
      onClose()
    } catch {
      addToast('Failed to send message. Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: '480px' }}>
        <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        <h2>Contact Us</h2>
        <p className="modal-subtitle">We would love to hear from you. Send us a message and we'll reply shortly.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="contactName" id="contactName" placeholder="John Doe" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="contactEmail" id="contactEmail" placeholder="john@example.com" required />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <select name="contactSubject" id="contactSubject" required>
              <option value="">Select a topic</option>
              <option value="Event Booking">Event Booking</option>
              <option value="Restaurant Reservation">Restaurant Reservation</option>
              <option value="General Support">General Support</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea name="contactMessage" id="contactMessage" placeholder="How can we help you?" required style={{ width: '100%', padding: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--gray-200)', minHeight: '100px', resize: 'vertical' }}></textarea>
          </div>
          <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }} disabled={sending}>
            {sending ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Send Message'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0', borderTop: '1px solid var(--glass-border)' }}></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--gray-400)' }}>
          <div><i className="fas fa-map-marker-alt" style={{ width: '24px', color: 'var(--gold)' }}></i> 123 Luxury Avenue, Tamale, Ghana</div>
          <div><i className="fas fa-phone" style={{ width: '24px', color: 'var(--gold)' }}></i> +233 50 123 4567</div>
          <div><i className="fas fa-envelope" style={{ width: '24px', color: 'var(--gold)' }}></i> contact@aisha.events</div>
        </div>
      </div>
    </div>
  )
}
