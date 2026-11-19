import { Link, useSearchParams } from 'react-router-dom'
import { num } from '../lib/format'

export default function PaymentResult() {
  const [sp] = useSearchParams()
  const ok = sp.get('status') === 'success'
  return (
    <div className="card max-w-md mx-auto text-center space-y-3">
      <div className={`text-xl font-bold ${ok ? 'text-green-700' : 'text-red-600'}`}>
        {ok ? 'پرداخت با موفقیت انجام شد' : 'پرداخت ناموفق بود'}
      </div>
      <p>شماره سفارش: {num(sp.get('order'))}</p>
      {ok && sp.get('ref') && <p>کد پیگیری: {num(sp.get('ref'))}</p>}
      <Link to="/orders" className="btn">سفارش‌های من</Link>
    </div>
  )
}
