import { Link, Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useCart } from '../lib/cart.jsx'
import { num } from '../lib/format.js'

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const { count } = useCart()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-rose-700">فروشگاه شال و پوشاک</Link>
          <nav className="flex items-center gap-4 mr-auto text-sm">
            {isAdmin && <NavLink to="/admin" className="text-rose-700">پنل مدیریت</NavLink>}
            {user && <NavLink to="/orders">سفارش‌های من</NavLink>}
            {user
              ? <button onClick={signOut} className="cursor-pointer">خروج</button>
              : <NavLink to="/login">ورود / ثبت‌نام</NavLink>}
            <NavLink to="/cart" className="btn !py-1">سبد خرید ({num(count)})</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6"><Outlet /></main>
      <footer className="text-center text-sm text-stone-500 py-6">تمام حقوق محفوظ است.</footer>
    </div>
  )
}
