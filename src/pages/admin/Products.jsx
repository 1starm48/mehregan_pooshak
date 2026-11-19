import { useEffect, useState } from 'react'
import { supabase, imageUrl } from '../../lib/supabase'
import { toman, num } from '../../lib/format'

const empty = { name: '', description: '', price: '', stock: '', category_id: '', sizes: '', images: [], is_active: true }

export default function Products() {
  const [list, setList] = useState([])
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(null) // null = closed
  const [editId, setEditId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () => supabase.from('products').select('*').order('created_at', { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => {
    load()
    supabase.from('categories').select('*').order('name').then(({ data }) => setCats(data || []))
  }, [])

  const openNew = () => { setForm(empty); setEditId(null); setErr('') }
  const openEdit = (p) => {
    setForm({ ...p, sizes: p.sizes.join('، '), category_id: p.category_id ?? '' })
    setEditId(p.id); setErr('')
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const upload = async (e) => {
    const files = [...e.target.files]
    setBusy(true)
    const paths = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file)
      if (error) setErr(error.message); else paths.push(path)
    }
    setForm((f) => ({ ...f, images: [...f.images, ...paths] }))
    setBusy(false)
    e.target.value = ''
  }
  const removeImage = (im) => setForm({ ...form, images: form.images.filter((x) => x !== im) })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const row = {
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: form.category_id ? Number(form.category_id) : null,
      sizes: form.sizes.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      images: form.images,
      is_active: form.is_active,
    }
    const { error } = editId
      ? await supabase.from('products').update(row).eq('id', editId)
      : await supabase.from('products').insert(row)
    setBusy(false)
    if (error) return setErr(error.message)
    setForm(null); load()
  }

  const del = async (p) => {
    if (!confirm(`حذف «${p.name}»؟ (برای مخفی کردن بهتر است محصول را غیرفعال کنید)`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  if (form)
    return (
      <form onSubmit={save} className="max-w-2xl space-y-3">
        <h1 className="text-xl font-bold">{editId ? 'ویرایش محصول' : 'محصول جدید'}</h1>
        <input className="input" placeholder="نام محصول" required value={form.name} onChange={set('name')} />
        <textarea className="input" rows={4} placeholder="توضیحات" value={form.description || ''} onChange={set('description')} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="number" min="0" placeholder="قیمت (تومان)" required value={form.price} onChange={set('price')} />
          <input className="input" type="number" min="0" placeholder="موجودی" required value={form.stock} onChange={set('stock')} />
        </div>
        <select className="input" value={form.category_id} onChange={set('category_id')}>
          <option value="">بدون دسته‌بندی</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="input" placeholder="سایزها با کاما جدا شوند (مثلاً S, M, L) — برای شال خالی بگذارید" value={form.sizes} onChange={set('sizes')} />
        <div>
          <input type="file" accept="image/*" multiple onChange={upload} />
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.images.map((im) => (
              <div key={im} className="relative">
                <img src={imageUrl(im)} className="h-20 w-20 object-cover rounded" alt="" />
                <button type="button" onClick={() => removeImage(im)} className="absolute top-0 left-0 bg-red-600 text-white rounded px-1 text-xs cursor-pointer">×</button>
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> فعال (نمایش در فروشگاه)</label>
        {err && <p className="text-red-600 text-sm" dir="ltr">{err}</p>}
        <div className="flex gap-2">
          <button className="btn" disabled={busy}>ذخیره</button>
          <button type="button" className="btn-light" onClick={() => setForm(null)}>انصراف</button>
        </div>
      </form>
    )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">محصولات</h1>
        <button className="btn" onClick={openNew}>+ محصول جدید</button>
      </div>
      <table className="card w-full text-sm">
        <thead><tr className="text-right text-stone-500"><th className="p-2">تصویر</th><th>نام</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th></th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-t border-stone-100">
              <td className="p-2">{p.images[0] && <img src={imageUrl(p.images[0])} className="h-10 w-10 object-cover rounded" alt="" />}</td>
              <td>{p.name}</td>
              <td>{toman(p.price)}</td>
              <td>{num(p.stock)}</td>
              <td>{p.is_active ? 'فعال' : 'غیرفعال'}</td>
              <td className="space-x-3 space-x-reverse whitespace-nowrap">
                <button className="text-rose-700 cursor-pointer" onClick={() => openEdit(p)}>ویرایش</button>
                <button className="text-red-600 cursor-pointer" onClick={() => del(p)}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
