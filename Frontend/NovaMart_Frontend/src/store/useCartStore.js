import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const voucherRates = { NOVA10: 0.1, TECH5: 0.05 }
const hasVoucher = (code) => Object.hasOwn(voucherRates, code)
const sameId = (first, second) => String(first) === String(second)

const cartStorage = {
  getItem(key) {
    try { return localStorage.getItem(key) } catch { return null }
  },
  setItem(key, value) {
    try { localStorage.setItem(key, value) } catch { /* Keep the current cart in memory. */ }
  },
  removeItem(key) {
    try { localStorage.removeItem(key) } catch { /* Storage may be unavailable. */ }
  },
}

function validProduct(product) {
  return product
    && ((typeof product.id === 'string' && product.id.trim()) || Number.isSafeInteger(product.id))
    && typeof product.name === 'string' && product.name.trim()
    && typeof product.slug === 'string' && product.slug.trim()
    && Number.isSafeInteger(product.price) && product.price >= 0
    && Number.isSafeInteger(product.stockQty) && product.stockQty >= 0
}

function restoreCart(saved) {
  const items = new Map()
  if (Array.isArray(saved?.items)) {
    for (const item of saved.items) {
      if (!validProduct(item) || item.stockQty === 0 || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue
      const key = String(item.id)
      if (!items.has(key)) items.set(key, { ...item, quantity: Math.min(item.quantity, item.stockQty) })
    }
  }
  return {
    items: [...items.values()],
    voucher: items.size && hasVoucher(saved?.voucher) ? saved.voucher : null,
  }
}

function getSubtotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

export function getCartTotals(items, voucher) {
  const subtotal = getSubtotal(items)
  const roundedDiscount = hasVoucher(voucher) ? Math.round(subtotal * voucherRates[voucher]) : 0
  const discount = voucher === 'NOVA10' ? Math.min(roundedDiscount, 1000000) : roundedDiscount
  const shipping = subtotal === 0 || subtotal >= 2000000 ? 0 : 30000
  return { subtotal, discount, shipping, total: subtotal - discount + shipping }
}

export const useCartStore = create(persist((set, get) => ({
  items: [],
  voucher: null,
  applyVoucher: (input) => {
    const code = input.trim().toUpperCase()
    const valid = hasVoucher(code)
    set({ voucher: valid ? code : null })
    return valid
  },
  addItem: (product, quantity = 1) => {
    if (!validProduct(product) || !Number.isSafeInteger(quantity) || quantity < 1) return false
    const { items, voucher } = get()
    const existing = items.find((item) => sameId(item.id, product.id))
    const previousQuantity = existing?.quantity ?? 0
    const nextQuantity = Math.min(previousQuantity + quantity, product.stockQty)
    if (!existing && nextQuantity === 0) return false

    const updated = { ...product, quantity: nextQuantity }
    let nextItems = [...items, updated]
    if (existing) {
      nextItems = nextQuantity === 0
        ? items.filter((item) => item !== existing)
        : items.map((item) => item === existing ? updated : item)
    }
    set({ items: nextItems, voucher: nextItems.length ? voucher : null })
    return nextQuantity > previousQuantity
  },
  removeItem: (id) => set((state) => {
    const items = state.items.filter((item) => !sameId(item.id, id))
    return { items, voucher: items.length ? state.voucher : null }
  }),
  updateQuantity: (id, quantity) => {
    if (!Number.isSafeInteger(quantity)) return
    set((state) => ({
      items: state.items.map((item) => sameId(item.id, id)
        ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stockQty)) }
        : item),
    }))
  },
  syncProducts: (products) => set((state) => {
    if (!state.items.length) return state
    const byId = new Map(products.map((product) => [String(product.id), product]))
    const items = state.items.flatMap((item) => {
      const product = byId.get(String(item.id))
      if (!validProduct(product) || !product.stockQty) return []
      return [{ ...product, quantity: Math.min(item.quantity, product.stockQty) }]
    })
    return { items, voucher: items.length ? state.voucher : null }
  }),
  clearCart: () => set({ items: [], voucher: null }),
  getCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
}), {
  name: 'novamart-cart-v1',
  storage: createJSONStorage(() => cartStorage),
  partialize: ({ items, voucher }) => ({ items, voucher }),
  merge: (saved, current) => ({ ...current, ...restoreCart(saved) }),
}))
