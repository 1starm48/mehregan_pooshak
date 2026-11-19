import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, imageUrl } from '../lib/supabase'
import { toman } from '../lib/format'
import Loading from '../components/Loading.jsx'

export default function Home() {
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState([])
  const [cat, setCat] = useState(null)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []))
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setProducts(data || []); setErr(error?.message || '') })
  }, [])

  if (!products) return <Loading />
  const list = products.filter((p) =>
    (!cat || p.category_id === cat) && p.name.includes(q.trim()))

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <input className="input !w-64" placeholder="جستجوی محصول..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={cat === null ? 'btn' : 'btn-light'} onClick={() => setCat(null)}>همه</button>
        {categories.map((c) => (
          <button key={c.id} className={cat === c.id ? 'btn' : 'btn-light'} onClick={() => setCat(c.id)}>{c.name}</button>
        ))}
      </div>
      {err && <p className="text-red-600 text-sm" dir="ltr">{err}</p>}
      {list.length === 0 && <p className="text-stone-500">محصولی یافت نشد.</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {list.map((p) => (
          <Link key={p.id} to={`/product/${p.id}`} className="card !p-0 overflow-hidden hover:shadow-md transition">
            <div className="aspect-square bg-stone-100">
              {p.images[0] && <img src={imageUrl(p.images[0])} alt={p.name} className="h-full w-full object-cover" />}
            </div>
            <div className="p-3">
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-sm mt-1 text-rose-700">
                {p.stock > 0 ? toman(p.price) : <span className="text-stone-400">ناموجود</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
