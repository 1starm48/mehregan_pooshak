// ZarinPal redirects the customer here after payment. Verifies it and redirects to the site.
// Deploy with --no-verify-jwt (the browser arrives here without a token).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const u = new URL(req.url)
  const orderId = u.searchParams.get('order_id')
  const authority = u.searchParams.get('Authority')
  const status = u.searchParams.get('Status')
  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
  const back = (ok: boolean, ref = '') =>
    new Response(null, {
      status: 302,
      headers: { Location: `${site}/#/payment/result?order=${orderId}&status=${ok ? 'success' : 'failed'}&ref=${ref}` },
    })

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single()
    if (!order || order.authority !== authority) return back(false)
    if (order.status !== 'pending') return back(order.status !== 'cancelled', order.ref_id ?? '')
    if (status !== 'OK') return back(false)

    const sandbox = Deno.env.get('ZARINPAL_SANDBOX') === 'true'
    const host = sandbox ? 'sandbox.zarinpal.com' : 'payment.zarinpal.com'
    const res = await fetch(`https://${host}/pg/v4/payment/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: Deno.env.get('ZARINPAL_MERCHANT_ID'),
        amount: order.total * 10,
        authority,
      }),
    })
    const out = await res.json()
    const code = out?.data?.code
    if (code === 100 || code === 101) {
      const ref = String(out.data.ref_id)
      await admin.rpc('mark_order_paid', { p_order_id: order.id, p_ref_id: ref })
      return back(true, ref)
    }
    return back(false)
  } catch (_e) {
    return back(false)
  }
})
