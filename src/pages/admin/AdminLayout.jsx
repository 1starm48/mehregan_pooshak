import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'

const links = [
  ['/admin', 'داشبورد', true],
  ['/admin/products', 'محصولات'],
  ['/admin/categories', 'دسته‌بندی‌ها'],
  ['/admin/orders', 'سفارش‌ها'],
]

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} />
  if (!isAdmin) return <div className="p-10 text-center">شما دسترسی مدیریت ندارید. <Link to="/" className="text-rose-700">بازگشت</Link></div>
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-56 bg-stone-900 text-stone-200 p-4 space-y-1">
        <div className="font-bold text-lg mb-4">پنل مدیریت</div>
        {links.map(([to, label, end]) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `block rounded-lg px-3 py-2 ${isActive ? 'bg-rose-700 text-white' : 'hover:bg-stone-800'}`}>
            {label}
          </NavLink>
        ))}
        <Link to="/" className="block px-3 py-2 text-stone-400 hover:text-white">مشاهده فروشگاه ←</Link>
      </aside>
      <main className="flex-1 p-6 overflow-x-auto"><Outlet /></main>
    </div>
  )
}
