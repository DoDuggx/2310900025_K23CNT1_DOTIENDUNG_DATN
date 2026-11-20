import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Grid2X2, List, Search, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, ArrowUpDown } from 'lucide-react'
import ProductCard from '../components/ProductCard.jsx'
import { subscribeDemoProducts } from '../data/demoCatalog'
import { isDemoMode } from '../services/apiClient'
import { getCategories, getProductPage } from '../services/productService'
import { formatCurrency } from '../utils/format'

const PAGE_SIZE = 8
const SORT_OPTIONS = {
  featured: 'Đề xuất',
  'price-low': 'Giá thấp đến cao',
  'price-high': 'Giá cao đến thấp',
  newest: 'Mới nhất',
  rating: 'Đánh giá cao',
}

function getPriceError(minPrice, maxPrice) {
  if ([minPrice, maxPrice].some((value) => value !== '' && (!Number.isSafeInteger(Number(value)) || Number(value) < 0))) {
    return 'Giá phải là số nguyên không âm.'
  }
  if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) {
    return 'Giá tối thiểu không được lớn hơn giá tối đa.'
  }
  return ''
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('category') || 'all'
  const brand = params.get('brand') || 'all'
  const minPrice = params.get('minPrice') ?? ''
  const maxPrice = params.get('maxPrice') ?? ''
  const sortParam = params.get('sort')
  const sort = Object.hasOwn(SORT_OPTIONS, sortParam) ? sortParam : 'featured'
  const requestedPage = Number(params.get('page'))
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const priceError = getPriceError(minPrice, maxPrice)
  const editingSearch = useRef(false)
  const [view, setView] = useState('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [response, setResponse] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoryError, setCategoryError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const request = useMemo(() => ({
    query, category, brand, minPrice, maxPrice, sort, page, size: PAGE_SIZE,
  }), [query, category, brand, minPrice, maxPrice, sort, page])
  const result = response?.request === request && response.refresh === refresh ? response.data : null
  const error = response?.request === request && response.refresh === refresh ? response.error : null
  const visible = result?.items ?? []
  const total = result?.totalElements
  const pageCount = result?.totalPages ?? 0
  const counts = result?.categoryCounts
  const brands = response?.data?.brands ?? []

  useEffect(() => {
    if (!isDemoMode) return
    return subscribeDemoProducts(() => setRefresh((value) => value + 1))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getCategories({ signal: controller.signal }).then(
      (items) => {
        if (!controller.signal.aborted) {
          setCategories(items)
          setCategoryError('')
        }
      },
      (error) => {
        if (!controller.signal.aborted) setCategoryError(error.message)
      },
    )
    return () => controller.abort()
  }, [refresh])

  useEffect(() => {
    if (priceError) return
    const controller = new AbortController()
    getProductPage({ ...request, signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setResponse({ request, refresh, data })
      },
      (error) => {
        if (!controller.signal.aborted) setResponse({ request, refresh, error })
      },
    )
    return () => controller.abort()
  }, [request, refresh, priceError])

  useEffect(() => {
    if (!result || page <= Math.max(1, pageCount)) return
    const next = new URLSearchParams(params)
    if (pageCount > 1) next.set('page', pageCount)
    else next.delete('page')
    setParams(next, { replace: true })
  }, [page, pageCount, params, result, setParams])

  const updateFilter = (key, value, options) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next, options)
  }
  const updateQuery = (value) => {
    updateFilter('q', value, { replace: editingSearch.current })
    editingSearch.current = true
  }
  const changePage = (nextPage) => {
    const next = new URLSearchParams(params)
    if (nextPage === 1) next.delete('page')
    else next.set('page', nextPage)
    setParams(next)
  }
  const clearFilters = () => setParams({})
  const startPage = Math.max(1, Math.min(page - 2, pageCount - 4))
  const pages = Array.from({ length: Math.min(pageCount, 5) }, (_, index) => startPage + index)

  return (
    <div className="page-wrap container">
      <div className="breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><strong>Sản phẩm</strong></div>
      <div className="catalog-heading">
        <div><div className="eyebrow">THE NOVAMART CATALOG</div><h1>Thiết bị công nghệ <em>được tuyển chọn.</em></h1><p>Tìm kiếm sản phẩm theo thương hiệu, danh mục và ngân sách của bạn.</p></div>
        <div className="catalog-count"><strong>{total?.toString().padStart(2, '0') ?? '—'}</strong><span>SẢN PHẨM<br/>PHÙ HỢP</span></div>
      </div>
      <form className="catalog-search" onSubmit={(event) => {
        event.preventDefault()
        if (query !== query.trim() || page !== 1) updateFilter('q', query.trim(), { replace: true })
        editingSearch.current = false
      }}>
        <Search size={18}/>
        <input value={query} onChange={(event) => updateQuery(event.target.value)} onBlur={() => { editingSearch.current = false }} placeholder="Bạn đang tìm kiếm thiết bị nào?" aria-label="Tìm trong danh mục"/>
        <button type="submit">Tìm kiếm</button>
      </form>
      <div className="catalog-toolbar">
        <button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><SlidersHorizontal size={17}/> Bộ lọc <ChevronDown size={15}/></button>
        <span className="result-count" aria-live="polite">{result && <>Hiển thị <b>{visible.length}</b> trong <b>{total}</b> sản phẩm</>}</span>
        <div className="toolbar-actions">
          <label className="sort-select"><ArrowUpDown size={15}/><select value={sort} aria-label="Sắp xếp" onChange={(event) => updateFilter('sort', event.target.value === 'featured' ? '' : event.target.value)}>
            {Object.entries(SORT_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <div className="view-switch">
            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Lưới" aria-pressed={view === 'grid'}><Grid2X2 size={17}/></button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="Danh sách" aria-pressed={view === 'list'}><List size={18}/></button>
          </div>
        </div>
      </div>
      <div className={`catalog-layout ${filtersOpen ? 'filters-visible' : ''}`}>
        <aside className="filter-sidebar">
          <div className="filter-head"><strong>Bộ lọc</strong><button onClick={clearFilters}>Xóa tất cả</button></div>
          <div className="filter-group">
            <h4>Danh mục</h4>
            <label className="filter-option"><input type="radio" name="category" checked={category === 'all'} onChange={() => updateFilter('category', '')}/> Tất cả sản phẩm {counts && <span>{counts.all}</span>}</label>
            {categories.map((item) => <label className="filter-option" key={item.id}><input type="radio" name="category" checked={category === item.id} onChange={() => updateFilter('category', item.id)}/> {item.name} {counts && <span>{counts[item.id] ?? 0}</span>}</label>)}
            {categoryError && <small className="field-error" role="alert">{categoryError}</small>}
          </div>
          <div className="filter-group">
            <h4>Khoảng giá</h4>
            <div className="price-inputs">
              <input type="number" min="0" placeholder="Từ" aria-label="Giá tối thiểu" aria-invalid={Boolean(priceError)} aria-describedby={priceError ? 'catalog-price-error' : undefined} value={minPrice} onChange={(event) => updateFilter('minPrice', event.target.value, { replace: true })}/>
              <span>—</span>
              <input type="number" min="0" placeholder="Đến" aria-label="Giá tối đa" aria-invalid={Boolean(priceError)} aria-describedby={priceError ? 'catalog-price-error' : undefined} value={maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value, { replace: true })}/>
            </div>
            {priceError ? <small className="field-error" id="catalog-price-error" role="alert">{priceError}</small> : <small className="filter-hint">Ví dụ: {formatCurrency(5000000)} đến {formatCurrency(30000000)}</small>}
          </div>
          <div className="filter-group">
            <h4>Thương hiệu</h4>
            {isDemoMode
              ? <select className="full-select" value={brand} aria-label="Thương hiệu" onChange={(event) => updateFilter('brand', event.target.value === 'all' ? '' : event.target.value)}><option value="all">Tất cả thương hiệu</option>{brands.map((item) => <option key={item}>{item}</option>)}</select>
              : <input className="full-select" value={brand === 'all' ? '' : brand} aria-label="Thương hiệu" placeholder="Nhập thương hiệu" onChange={(event) => updateFilter('brand', event.target.value, { replace: true })}/>}
          </div>
          <div className="filter-help"><span>Chưa biết chọn sản phẩm?</span><p>Để Nova gợi ý thiết bị theo ngân sách và nhu cầu của bạn.</p><button onClick={() => window.dispatchEvent(new Event('novamart:open-chat'))}>Hỏi Nova <ArrowRight size={14}/></button></div>
        </aside>
        <div className="catalog-results">
          {priceError ? <div className="empty-state"><h3>Vui lòng điều chỉnh khoảng giá.</h3></div>
            : error ? <div className="empty-state" role="alert"><h3>Không tải được danh sách sản phẩm</h3><p>{error.message}</p><button className="button button-dark" onClick={() => setRefresh((value) => value + 1)}>Thử lại</button></div>
            : !result ? <div className="empty-state" role="status">Đang tải sản phẩm...</div>
            : visible.length ? <div className={view === 'grid' ? 'product-grid catalog-grid' : 'product-list'}>{visible.map((product) => <ProductCard key={product.id} product={product} list={view === 'list'}/>)}</div>
            : <div className="empty-state"><Search size={30}/><h3>Chưa tìm thấy sản phẩm phù hợp</h3><p>Thử thay đổi từ khóa hoặc xóa bớt bộ lọc.</p><button className="button button-dark" onClick={clearFilters}>Xóa bộ lọc</button></div>}
          {pageCount > 1 && <nav className="pagination" aria-label="Phân trang sản phẩm">
            <button disabled={page <= 1} onClick={() => changePage(page - 1)} aria-label="Trang trước"><ChevronLeft size={17}/></button>
            {pages.map((number) => <button key={number} className={page === number ? 'active' : ''} aria-current={page === number ? 'page' : undefined} onClick={() => changePage(number)}>{number}</button>)}
            <button disabled={page >= pageCount} onClick={() => changePage(page + 1)} aria-label="Trang sau"><ChevronRight size={17}/></button>
          </nav>}
        </div>
      </div>
    </div>
  )
}
