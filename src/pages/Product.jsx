import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, imageUrl } from '../lib/supabase'
import { useCart } from '../lib/cart.jsx'
import { toman, num } from '../lib/format'
import Loading from '../components/Loading.jsx'

export default function Product() {
  const { id } = useParams()
  const nav = useNavigate()
  const { add } = useCart()
  const [p, setP] = useState(undefined)
  const [img, setImg] = useState(0)
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => setP(data || null))
  }, [id])

  if (p === undefined) return <Loading />
  if (p === null) return <p>محصول پیدا نشد.</p>

  const needSize = p.sizes.length > 0 && !size
  const addToCart = () => {
    add({ product_id: p.id, name: p.name, price: p.price, image: p.images[0] || null, size, quantity: qty, stock: p.stock })
    setAdded(true)
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden">
          {p.images[img] && <img src={imageUrl(p.images[img])} alt={p.name} className="h-full w-full object-cover" />}
        </div>
        <div className="flex gap-2 mt-2">
          {p.images.map((im, i) => (
            <img key={im} src={imageUrl(im)} onClick={() => setImg(i)} alt=""
              className={`h-16 w-16 object-cover rounded cursor-pointer border-2 ${i === img ? 'border-rose-600' : 'border-transparent'}`} />
          ))}
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{p.name}</h1>
        <div className="text-xl text-rose-700 my-3">{toman(p.price)}</div>
        <p className="whitespace-pre-line text-stone-600 mb-4">{p.description}</p>
        {p.sizes.length > 0 && (
          <div className="mb-4">
            <div className="mb-1 text-sm">سایز:</div>
            <div className="flex gap-2 flex-wrap">
              {p.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={size === s ? 'btn !px-3' : 'btn-light !px-3'}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {p.stock > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">تعداد:</span>
              <button className="btn-light !px-3" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="w-8 text-center">{num(qty)}</span>
              <button className="btn-light !px-3" onClick={() => setQty(Math.min(p.stock, qty + 1))}>+</button>
              <span className="text-xs text-stone-500">({num(p.stock)} عدد موجود)</span>
            </div>
            <button className="btn" disabled={needSize} onClick={addToCart}>
              {needSize ? 'ابتدا سایز را انتخاب کنید' : 'افزودن به سبد خرید'}
            </button>
            {added && <button className="btn-light mr-2" onClick={() => nav('/cart')}>مشاهده سبد خرید</button>}
          </>
        ) : <div className="text-stone-500">این محصول ناموجود است.</div>}
      </div>
    </div>
  )
}
