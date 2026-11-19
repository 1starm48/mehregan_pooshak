import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const nav = useNavigate()
  const from = useLocation().state?.from || '/'
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ email: '', password: '', full_name: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.full_name } } })
    setBusy(false)
    if (error) return setErr(error.message)
    nav(from)
  }

  return (
    <form onSubmit={submit} className="card max-w-sm mx-auto space-y-3">
      <h1 className="text-xl font-bold">{mode === 'login' ? 'ورود' : 'ثبت‌نام'}</h1>
      {mode === 'register' && <input className="input" placeholder="نام و نام خانوادگی" required value={f.full_name} onChange={set('full_name')} />}
      <input className="input" type="email" dir="ltr" placeholder="ایمیل" required value={f.email} onChange={set('email')} />
      <input className="input" type="password" dir="ltr" placeholder="رمز عبور (حداقل ۶ کاراکتر)" minLength={6} required value={f.password} onChange={set('password')} />
      {err && <p className="text-sm text-red-600" dir="ltr">{err}</p>}
      <button className="btn w-full" disabled={busy}>{mode === 'login' ? 'ورود' : 'ساخت حساب'}</button>
      <button type="button" className="text-sm text-rose-700 cursor-pointer" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'حساب ندارید؟ ثبت‌نام کنید' : 'حساب دارید؟ وارد شوید'}
      </button>
    </form>
  )
}
