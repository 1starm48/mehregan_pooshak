export const toman = (n) => `${Number(n || 0).toLocaleString('fa-IR')} تومان`
export const num = (n) => Number(n || 0).toLocaleString('fa-IR')
export const date = (d) => new Date(d).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })

export const STATUS = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
}

export const slugify = (s) =>
  s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '') || String(Date.now())
