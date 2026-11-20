import { categories, mockProducts } from './products.js'

const STORAGE_KEY = 'novamart-admin-products-v1'
const CHANGE_EVENT = 'novamart:demo-products-changed'
const categoryIds = new Set(categories.map(({ id }) => id))

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return null
  const { id, slug, name, sku, category } = product
  const price = Number(product.price)
  const stockQty = Number(product.stockQty)
  if (!(Number.isSafeInteger(id) && id > 0) && !(typeof id === 'string' && id.trim())) return null
  if (![slug, name, sku, product.brand].every((field) => typeof field === 'string' && field.trim())) return null
  if (!/^[a-z0-9-]+$/i.test(slug) || !categoryIds.has(category)) return null
  if (product.price == null || !Number.isSafeInteger(price) || price <= 0) return null
  if (product.stockQty == null || product.stockQty === '' || !Number.isSafeInteger(stockQty) || stockQty < 0) return null

  const image = typeof product.image === 'string' ? product.image : ''
  const specs = product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs)
    ? Object.fromEntries(Object.entries(product.specs).filter(([, value]) => ['number', 'string'].includes(typeof value)))
    : {}

  return {
    ...product,
    name: name.trim(),
    sku: sku.trim(),
    brand: product.brand.trim(),
    price,
    stockQty,
    image,
    gallery: Array.isArray(product.gallery)
      ? product.gallery.filter((value) => typeof value === 'string' && value.trim())
      : [],
    description: typeof product.description === 'string' ? product.description : '',
    oldPrice: Number.isFinite(product.oldPrice) && product.oldPrice > price ? product.oldPrice : null,
    rating: Number.isFinite(product.rating) ? product.rating : 0,
    reviewCount: Number.isSafeInteger(product.reviewCount) ? product.reviewCount : 0,
    badge: typeof product.badge === 'string' ? product.badge : '',
    specs,
  }
}

export function readDemoProducts() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    if (!Array.isArray(stored)) return mockProducts

    const ids = new Set()
    const slugs = new Set()
    const products = []
    for (const record of stored) {
      const product = normalizeProduct(record)
      if (!product || ids.has(String(product.id)) || slugs.has(product.slug)) continue
      ids.add(String(product.id))
      slugs.add(product.slug)
      products.push(product)
    }
    return products.length || !stored.length ? products : mockProducts
  } catch {
    return mockProducts
  }
}

export function saveDemoProducts(products) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeDemoProducts(onChange) {
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange()
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', handleStorage)
  }
}

