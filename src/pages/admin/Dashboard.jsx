import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { toman, num } from '../../lib/format'
import Loading from '../../components/Loading.jsx'

export default function Dashboard() {
  const [d, setD] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('status,total'),
      supabase.from('products').select('id,name,stock').lte('stock', 3).eq('is_active', true),
      supabase.from('products').select('id', { count: 'exact', head: true }),
    ]).then(([o, low, pc]) => {
      const orders = o.data || []
      const paid = orders.filter((x) => !['pending', 'cancelled'].includes(x.status))
      setD({
        revenue: paid.reduce((s, x) => s + x.total, 0),
        paidCount: paid.length,
        toShip: orders.filter((x) => ['paid', 'processing'].includes(x.status)).length,
        products: pc.count || 0,
        low: low.data || [],
      })
    })
  }, [])

  if (!d) return <Loading />
  const stat = (label, value) => (
    <div className="card"><div className="text-sm text-stone-500">{label}</div><div className="text-xl font-bold mt-1">{value}</div></div>
  )
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">داشبورد</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stat('مجموع فروش', toman(d.revenue))}
        {stat('سفارش‌های پرداخت‌شده', num(d.paidCount))}
        {stat('سفارش‌های در انتظار ارسال', num(d.toShip))}
        {stat('تعداد محصولات', num(d.products))}
      </div>
      <div className="card">
        <div className="font-bold mb-2">کم‌موجودی‌ها</div>
        {d.low.length === 0 && <p className="text-sm text-stone-500">موردی وجود ندارد.</p>}
        <ul className="text-sm space-y-1">
          {d.low.map((p) => <li key={p.id}>{p.name} — موجودی: {num(p.stock)}</li>)}
        </ul>
      </div>
    </div>
  )
}
