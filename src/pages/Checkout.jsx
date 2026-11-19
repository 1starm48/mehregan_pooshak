import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { useCart } from '../lib/cart.jsx'
import { toman } from '../lib/format'

export default function Checkout() {
  const { user, profile, loading } = useAuth()
  const { items, total, clear } = useCart()
  const [f, setF] = useState({ full_name: '', phone: '', province: '', city: '', address: '', postal_code: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (profile) setF((x) => ({ ...x, full_name: x.full_name || profile.full_name || '', phone: x.phone || profile.phone || '' }))
  }, [profile])

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: '/checkout' }} />
  if (items.length === 0) return <Navigate to="/cart" />

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const { data: order, error } = await supabase.rpc('create_order', {
        p_items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, size: i.size })),
        p_shipping: f,
      })
      if (error) throw error
      const { data, error: e2 } = await supabase.functions.invoke('zarinpal-request', { body: { order_id: order.order_id } })
      if (e2 || !data?.url) throw e2 || new Error('خطا در اتصال به درگاه پرداخت')
      clear()
      window.location.href = data.url
    } catch (e) {
      setErr(e.message?.includes('insufficient stock') ? 'موجودی یکی از کالاها کافی نیست.' : e.message || 'خطا')
      setBusy(false)
    }
  }

  const field = (k, label, extra = {}) => (
    <label className="block text-sm">{label}
      <input className="input mt-1" required value={f[k]} onChange={set(k)} {...extra} />
    </label>
  )

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto space-y-3">
      <h1 className="text-xl font-bold">اطلاعات ارسال</h1>
      {field('full_name', 'نام و نام خانوادگی گیرنده')}
      {field('phone', 'شماره موبایل', { dir: 'ltr', pattern: '09[0-9]{9}', title: 'مثال: 09123456789' })}
      <div className="grid grid-cols-2 gap-3">
        {field('province', 'استان')}
        {field('city', 'شهر')}
      </div>
      {field('address', 'آدرس کامل')}
      {field('postal_code', 'کد پستی', { dir: 'ltr', pattern: '[0-9]{10}', title: 'کد پستی ۱۰ رقمی' })}
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="flex items-center justify-between pt-2">
        <div className="font-bold">مبلغ قابل پرداخت: {toman(total)}</div>
        <button className="btn" disabled={busy}>{busy ? 'در حال انتقال...' : 'پرداخت آنلاین (زرین‌پال)'}</button>
      </div>
    </form>
  )
}
