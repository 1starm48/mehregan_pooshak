import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { toman, num, date, STATUS } from '../lib/format'
import Loading from '../components/Loading.jsx'

export default function Orders() {
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))
  }, [user])

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: '/orders' }} />
  if (!orders) return <Loading />
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <h1 className="text-xl font-bold">سفارش‌های من</h1>
      {orders.length === 0 && <p className="text-stone-500">هنوز سفارشی ثبت نکرده‌اید.</p>}
      {orders.map((o) => (
        <div key={o.id} className="card">
          <div className="flex justify-between text-sm">
            <b>سفارش {num(o.id)}</b>
            <span>{STATUS[o.status]}</span>
          </div>
          <div className="text-xs text-stone-500">{date(o.created_at)}</div>
          <ul className="my-2 text-sm list-disc pr-5">
            {o.order_items.map((i) => (
              <li key={i.id}>{i.name}{i.size && ` (${i.size})`} × {num(i.quantity)}</li>
            ))}
          </ul>
          <div className="text-sm">مبلغ: {toman(o.total)}</div>
          {o.tracking_code && <div className="text-sm">کد رهگیری مرسوله: {o.tracking_code}</div>}
        </div>
      ))}
    </div>
  )
}
