const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

export function initializePayment({ email, amount, metadata, onSuccess, onCancel }) {
  if (!PAYSTACK_PUBLIC_KEY) {
    console.warn('Paystack public key not configured')
    onCancel?.('Paystack public key not configured. Set VITE_PAYSTACK_PUBLIC_KEY in your environment.')
    return
  }

  if (typeof window.PaystackPop === 'undefined') {
    onCancel?.('Paystack script not loaded. Check your internet connection or ad blocker.')
    return
  }

  try {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: amount * 100,
      currency: 'GHS',
      metadata,
      callback(response) {
        onSuccess?.(response)
      },
      onClose() {
        onCancel?.()
      }
    })

    handler.openIframe()
  } catch (err) {
    console.error('Paystack initialization failed:', err)
    onCancel?.(err.message || 'Payment initialization failed')
  }
}

export async function verifyTransaction(reference) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ reference })
      }
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Paystack verification failed:', error)
    throw error
  }
}
