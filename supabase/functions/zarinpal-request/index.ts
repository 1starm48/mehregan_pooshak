// Creates a ZarinPal payment for an order and returns the redirect URL.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'unauthorized' }, 401)

    const { order_id } = await req.json()
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order } = await admin.from('orders').select('*')
      .eq('id', order_id).eq('user_id', user.id).eq('status', 'pending').single()
    if (!order) return json({ error: 'order not found' }, 404)

    const sandbox = Deno.env.get('ZARINPAL_SANDBOX') === 'true'
    const host = sandbox ? 'sandbox.zarinpal.com' : 'payment.zarinpal.com'
    const res = await fetch(`https://${host}/pg/v4/payment/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: Deno.env.get('ZARINPAL_MERCHANT_ID'),
        amount: order.total * 10, // Toman -> Rial
        callback_url: `${url}/functions/v1/zarinpal-verify?order_id=${order.id}`,
        description: `سفارش شماره ${order.id}`,
        metadata: { mobile: order.phone },
      }),
    })
    const out = await res.json()
    if (out?.data?.code !== 100) return json({ error: 'zarinpal error', details: out }, 502)

    await admin.from('orders').update({ authority: out.data.authority }).eq('id', order.id)
    return json({ url: `https://${host}/pg/StartPay/${out.data.authority}` })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
