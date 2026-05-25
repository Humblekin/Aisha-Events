import { createContext, useContext, useState, useCallback } from 'react'
import { useToast } from './ToastContext'
import { dataService } from '../lib/dataService'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  const addToCart = useCallback((name, price) => {
    const numericPrice = parseFloat(String(price).replace(/,/g, '')) || 0
    setItems(prev => [...prev, { name, price: numericPrice, id: Date.now() }])
    setCount(prev => prev + 1)
  }, [])

  const removeFromCart = useCallback((id) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx === -1) return prev
      const next = [...prev]
      next.splice(idx, 1)
      return next
    })
    setCount(prev => Math.max(0, prev - 1))
  }, [])

  const getTotal = useCallback(() => {
    return items.reduce((sum, i) => sum + (i.price || 0), 0)
  }, [items])

  const submitOrder = useCallback(async (type = 'Delivery', address = '', paymentInfo = { method: 'cash', reference: '', status: 'pending' }) => {
    if (items.length === 0) {
      addToast('Cart is empty', 'error')
      return null
    }
    setSubmitting(true)
    try {
      const totalAmount = getTotal()
      const order = await dataService.addOrder({
        user_id: null,
        customer_name: 'Guest',
        items: items.map(i => ({ name: i.name, price: i.price })),
        total: totalAmount,
        type: type.toLowerCase(),
        delivery_address: address,
        status: 'pending'
      })
      if (order) {
        await dataService.addPayment({
          user_id: null,
          order_id: order.id,
          amount: totalAmount,
          currency: 'GHS',
          method: paymentInfo.method || 'cash',
          reference: paymentInfo.reference || `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: paymentInfo.status || 'pending',
          customer_name: 'Guest',
          service_name: `Food Order (${type})`
        })
        addToast('Order placed successfully!', 'success')
        setItems([])
        setCount(0)
        return order
      } else {
        throw new Error('Failed to create order record')
      }
    } catch (err) {
      addToast(`Order failed: ${err.message}`, 'error')
      return null
    } finally {
      setSubmitting(false)
    }
  }, [items, getTotal, addToast])

  const clearCart = useCallback(() => {
    setItems([])
    setCount(0)
  }, [])

  return (
    <CartContext.Provider value={{ items, count, addToCart, removeFromCart, getTotal, submitOrder, clearCart, submitting }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
