import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../lib/cart.jsx'
import { imageUrl } from '../lib/supabase'
import { toman, num } from '../lib/format'

export default function Cart() {
  const { items, setQty, remove, total } = useCart()
  const nav = useNavigate()
  if (items.length === 0)
    return <div className="text-center py-10">سبد خرید خالی است. <Link to="/" className="text-rose-700">ادامه خرید</Link></div>
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">سبد خرید</h1>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.product_id + i.size} className="card flex items-center gap-3">
            <div className="h-16 w-16 bg-stone-100 rounded overflow-hidden shrink-0">
              {i.image && <img src={imageUrl(i.image)} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <div>{i.name}</div>
              {i.size && <div className="text-xs text-stone-500">سایز: {i.size}</div>}
              <div className="text-sm text-rose-700">{toman(i.price)}</div>
            </div>
            <div className="flex items-center gap-1">
              <button className="btn-light !px-2" onClick={() => setQty(i, i.quantity - 1)}>−</button>
              <span className="w-6 text-center">{num(i.quantity)}</span>
              <button className="btn-light !px-2" onClick={() => setQty(i, i.quantity + 1)}>+</button>
            </div>
            <button className="text-red-600 text-sm cursor-pointer" onClick={() => remove(i)}>حذف</button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6">
        <div className="font-bold">جمع کل: {toman(total)}</div>
        <button className="btn" onClick={() => nav('/checkout')}>ادامه و ثبت سفارش</button>
      </div>
    </div>
  )
}
