import { useEffect } from 'react'

export default function Modal({ id, isOpen, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  return (
    <div className={`mo${isOpen ? ' open' : ''}`} id={id} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="md" role="dialog" aria-label={title}>
        <button className="mx" onClick={onClose} aria-label="Close"><i className="fas fa-times"></i></button>
        {title && <h3>{title}</h3>}
        {subtitle && <p className="ms">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
