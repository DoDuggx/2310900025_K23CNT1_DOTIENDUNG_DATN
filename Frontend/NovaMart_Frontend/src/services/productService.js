import { categories } from '../data/products'
import { readDemoProducts } from '../data/demoCatalog'
import { apiRequest, isDemoMode } from './apiClient'

const apiSorts = {
  'price-low': 'price,asc',
  'price-high': 'price,desc',
  newest: 'createdAt,desc',
  rating: 'rating,desc',
}

function sortProducts(products, sort) {
  const comparators = {
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || Number(b.id) - Number(a.id),
    rating: (a, b) => b.rating - a.rating,
  }
  return comparators[sort] ? [...products].sort(comparators[sort]) : products
}

function paginate(products, page, size) {
  return {
    items: products.slice((page - 1) * size, page * size),
    totalElements: products.length,
    totalPages: Math.ceil(products.length / size),
  }
}

function getDemoPage({ query, category, brand, minPrice, maxPrice, sort, page, size }) {
  const products = readDemoProducts()
  const keyword = query.trim().toLowerCase()
  const matches = products.filter((product) => {
    const search = `${product.name} ${product.brand} ${product.sku}`.toLowerCase()
    return search.includes(keyword)
      && (brand === 'all' || brand === product.brand)
      && (minPrice === '' || product.price >= Number(minPrice))
      && (maxPrice === '' || product.price <= Number(maxPrice))
  })
  const categoryCounts = Object.fromEntries(categories.map(({ id }) => [
    id, matches.filter((product) => product.category === id).length,
  ]))
  const filtered = category === 'all' ? matches : matches.filter((product) => product.category === category)
  return {
    ...paginate(sortProducts(filtered, sort), page, size),
    categoryCounts: { ...categoryCounts, all: matches.length },
    brands: [...new Set(products.map((product) => product.brand).filter(Boolean))].sort(),
  }
}

function normalizeProduct(product) {
  if (!product || !validId(product.id) || !validId(product.categoryId)
    || !nonemptyString(product.slug) || !nonemptyString(product.name)
    || !Number.isSafeInteger(product.price) || product.price < 0
    || !Number.isSafeInteger(product.stockQty) || product.stockQty < 0) {
    throw new Error('API trả về sản phẩm thiếu thông tin cần thiết.')
  }
  return {
    ...product,
    id: String(product.id),
    category: String(product.categoryId),
    brand: typeof product.brand === 'string' ? product.brand : '',
    sku: typeof product.sku === 'string' ? product.sku : '',
    image: typeof product.image === 'string' ? product.image : '',
    description: typeof product.description === 'string' ? product.description : '',
    badge: typeof product.badge === 'string' ? product.badge : '',
    oldPrice: Number.isSafeInteger(product.oldPrice) && product.oldPrice > product.price ? product.oldPrice : null,
    rating: Number.isFinite(product.rating) ? product.rating : 0,
    reviewCount: Number.isSafeInteger(product.reviewCount) && product.reviewCount >= 0 ? product.reviewCount : 0,
  }
}

const nonemptyString = (value) => typeof value === 'string' && Boolean(value.trim())
const validId = (value) => nonemptyString(value) || (Number.isSafeInteger(value) && value > 0)

export async function getProductPage({
  query = '', category = 'all', brand = 'all', minPrice = '', maxPrice = '',
  sort = 'featured', page = 1, size = 8, signal,
} = {}) {
  if (isDemoMode) return getDemoPage({ query, category, brand, minPrice, maxPrice, sort, page, size })

  const params = new URLSearchParams()
  if (query.trim()) params.set('keyword', query.trim())
  if (category !== 'all') params.set('categoryId', category)
  if (brand !== 'all' && brand.trim()) params.set('brand', brand.trim())
  if (minPrice !== '') params.set('minPrice', minPrice)
  if (maxPrice !== '') params.set('maxPrice', maxPrice)
  params.set('page', page - 1)
  params.set('size', size)
  if (apiSorts[sort]) params.append('sort', apiSorts[sort])
  params.append('sort', 'id,asc')

  const response = await apiRequest(`/products?${params}`, { signal })
  const { content, totalElements, totalPages, number, size: responseSize } = response ?? {}
  if (!Array.isArray(content) || !Number.isSafeInteger(totalElements) || totalElements < 0
    || !Number.isSafeInteger(totalPages) || totalPages < 0
    || number !== page - 1 || !Number.isSafeInteger(responseSize) || responseSize < 1
    || content.length > responseSize) {
    throw new Error('API trả về danh sách sản phẩm với cấu trúc phân trang không hợp lệ.')
  }
  return { items: content.map(normalizeProduct), totalElements, totalPages }
}

export async function getProducts(params) {
  return (await getProductPage(params)).items
}

export async function getCategories({ signal } = {}) {
  if (isDemoMode) {
    const products = readDemoProducts()
    return categories.map((category) => ({
      ...category,
      count: products.filter((product) => product.category === category.id).length,
    }))
  }

  const items = await apiRequest('/categories', { signal })
  if (!Array.isArray(items) || items.some((item) => !validId(item?.id) || !nonemptyString(item.name))) {
    throw new Error('API trả về danh mục với cấu trúc không hợp lệ.')
  }
  return items.map((item) => ({ ...item, id: String(item.id) }))
}

export async function getProductByRoute(slug, { id, signal } = {}) {
  if (isDemoMode) return readDemoProducts().find((product) => product.slug === slug)
  const path = validId(id) ? `/products/${encodeURIComponent(id)}` : `/products/by-slug/${encodeURIComponent(slug)}`
  return normalizeProduct(await apiRequest(path, { signal }))
}
