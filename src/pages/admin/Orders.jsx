import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { toman, num, date, STATUS } from '../../lib/format'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(null)

  const load = () =>
    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))
  useEffect(() => { load() }, [])

  const update = async (id, patch) => {
    await supabase.from('orders').update(patch).eq('id', id)
    load()
  }

  const shown = orders.filter((o) => !filter || o.status === filter)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">سفارش‌ها</h1>
        <select className="input !w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {shown.map((o) => (
          <div key={o.id} className="card text-sm">
            <div className="flex flex-wrap items-center gap-3 cursor-pointer" onClick={() => setOpen(open === o.id ? null : o.id)}>
              <b>#{num(o.id)}</b>
              <span>{o.full_name}</span>
              <span>{toman(o.total)}</span>
              <span className="text-stone-500">{date(o.created_at)}</span>
              <span className="mr-auto rounded bg-stone-100 px-2 py-0.5">{STATUS[o.status]}</span>
            </div>
            {open === o.id && (
              <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
                <ul className="list-disc pr-5">
                  {o.order_items.map((i) => (
                    <li key={i.id}>{i.name}{i.size && ` (${i.size})`} × {num(i.quantity)} — {toman(i.price)}</li>
                  ))}
                </ul>
                <div>
                  <div>گیرنده: {o.full_name} — {o.phone}</div>
                  <div>نشانی: {o.province}، {o.city}، {o.address}</div>
                  <div>کد پستی: {o.postal_code}</div>
                  {o.ref_id && <div>کد پیگیری زرین‌پال: {o.ref_id}</div>}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select className="input !w-48" value={o.status} onChange={(e) => update(o.id, { status: e.target.value })}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input className="input !w-56" placeholder="کد رهگیری پست" defaultValue={o.tracking_code || ''}
                    onBlur={(e) => e.target.value !== (o.tracking_code || '') && update(o.id, { tracking_code: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        ))}
        {shown.length === 0 && <p className="text-stone-500">سفارشی وجود ندارد.</p>}
      </div>
    </div>
  )
}
