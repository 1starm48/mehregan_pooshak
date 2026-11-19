import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)
export const useCart = () => useContext(Ctx)

const keyOf = (i) => `${i.product_id}|${i.size || ''}`

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })
  useEffect(() => localStorage.setItem('cart', JSON.stringify(items)), [items])

  const add = (item) =>
    setItems((cur) => {
      const found = cur.find((c) => keyOf(c) === keyOf(item))
      if (found)
        return cur.map((c) =>
          keyOf(c) === keyOf(item) ? { ...c, quantity: Math.min(c.quantity + item.quantity, item.stock) } : c)
      return [...cur, item]
    })
  const setQty = (item, quantity) =>
    setItems((cur) => cur.map((c) => (keyOf(c) === keyOf(item) ? { ...c, quantity: Math.max(1, Math.min(quantity, c.stock)) } : c)))
  const remove = (item) => setItems((cur) => cur.filter((c) => keyOf(c) !== keyOf(item)))
  const clear = () => setItems([])

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0)
  return <Ctx.Provider value={{ items, add, setQty, remove, clear, count, total, keyOf }}>{children}</Ctx.Provider>
}
