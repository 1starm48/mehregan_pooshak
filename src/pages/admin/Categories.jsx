import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { slugify } from '../../lib/format'

export default function Categories() {
  const [list, setList] = useState([])
  const [name, setName] = useState('')
  const [err, setErr] = useState('')

  const load = () => supabase.from('categories').select('*').order('name').then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('categories').insert({ name: name.trim(), slug: slugify(name) })
    setErr(error?.message || '')
    if (!error) { setName(''); load() }
  }
  const del = async (c) => {
    if (!confirm(`حذف «${c.name}»؟`)) return
    await supabase.from('categories').delete().eq('id', c.id)
    load()
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">دسته‌بندی‌ها</h1>
      <form onSubmit={add} className="flex gap-2">
        <input className="input" placeholder="نام دسته (مثلاً روسری)" required value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn shrink-0">افزودن</button>
      </form>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="card divide-y divide-stone-100">
        {list.map((c) => (
          <div key={c.id} className="flex justify-between py-2">
            <span>{c.name}</span>
            <button className="text-red-600 text-sm cursor-pointer" onClick={() => del(c)}>حذف</button>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-stone-500">دسته‌ای وجود ندارد.</p>}
      </div>
    </div>
  )
}
