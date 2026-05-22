import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

serve(async (req) => {
  try {
    const { reference } = await req.json()
    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')

    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Paystack key not configured' }), { status: 500 })
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
