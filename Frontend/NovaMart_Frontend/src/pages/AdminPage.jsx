import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Boxes, ChevronDown, LayoutDashboard, LogOut, Package, Pencil, Plus, Search, Settings, ShoppingCart, Trash2, Users, X } from 'lucide-react'
import { categories, mockProducts } from '../data/products'
import { readDemoProducts, saveDemoProducts, subscribeDemoProducts } from '../data/demoCatalog'
import { isDemoMode } from '../services/apiClient'
import { formatCurrency, formatNumber } from '../utils/format'

const navigation = [
  { id: 'overview', label: 'Tổng quan', title: 'Tổng quan cửa hàng', Icon: LayoutDashboard },
  { id: 'products', label: 'Sản phẩm', title: 'Quản lý sản phẩm', Icon: Package },
  { id: 'orders', label: 'Đơn hàng', Icon: ShoppingCart, unavailable: 'Quản lý đơn hàng sẽ khả dụng khi kết nối API đơn hàng.' },
  { id: 'customers', label: 'Khách hàng', Icon: Users, unavailable: 'Quản lý khách hàng sẽ khả dụng khi kết nối API tài khoản.' },
  { id: 'inventory', label: 'Kho hàng', title: 'Quản lý tồn kho', Icon: Boxes },
  { id: 'statistics', label: 'Thống kê', Icon: BarChart3 },
  { id: 'settings', label: 'Cài đặt', Icon: Settings, unavailable: 'Cài đặt hệ thống chưa được triển khai trong bản demo.' },
]

const emptyForm = { name: '', brand: '', sku: '', price: '', stockQty: '', category: 'laptop' }
const categoryNames = new Map(categories.map(({ id, name }) => [id, name]))

function stockStatus(product) {
  if (product.stockQty === 0) return { value: 'out-stock', label: 'Hết hàng' }
  if (product.stockQty <= 10) return { value: 'low-stock', label: 'Sắp hết' }
  return { value: 'in-stock', label: 'Đang bán' }
}

function StockStatus({ product }) {
  const { value, label } = stockStatus(product)
  return <span className={`status-pill ${value}`}>{label}</span>
}

function AdminSummary({ products }) {
  const cards = [
    { label: 'Sản phẩm', value: products.length, note: 'Đang quản lý', Icon: Package },
    { label: 'Tồn kho', value: products.reduce((sum, { stockQty }) => sum + stockQty, 0), note: 'Tổng số đơn vị trong kho', Icon: Boxes },
    { label: 'Sắp hết hàng', value: products.filter((item) => stockStatus(item).value === 'low-stock').length, note: 'Còn từ 1 đến 10 đơn vị', Icon: Package },
    { label: 'Hết hàng', value: products.filter((item) => item.stockQty === 0).length, note: 'Tồn kho bằng 0', Icon: ShoppingCart },
  ]
  return <div className="admin-stats">{cards.map(({ label, value, note, Icon }) => (
    <div className="admin-stat-card" key={label}>
      <div className="stat-card-top"><span>{label}</span><Icon/></div>
      <strong>{formatNumber(value)}</strong>
      <small>{note}</small>
    </div>
  ))}</div>
}

function AdminStatistics({ products }) {
  return (
    <section className="admin-table-panel">
      <div className="admin-table-heading">
        <div><h3>Thống kê theo danh mục</h3><p>Tính từ danh mục sản phẩm demo hiện tại.</p></div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>DANH MỤC</th><th>SẢN PHẨM</th><th>ĐƠN VỊ TRONG KHO</th><th>SẢN PHẨM HẾT HÀNG</th></tr></thead>
          <tbody>{categories.map(({ id, name }) => {
            const items = products.filter(({ category }) => category === id)
            const units = items.reduce((total, { stockQty }) => total + stockQty, 0)
            return <tr key={id}><td>{name}</td><td>{formatNumber(items.length)}</td><td>{formatNumber(units)}</td><td>{formatNumber(items.filter(({ stockQty }) => stockQty === 0).length)}</td></tr>
          })}</tbody>
        </table>
      </div>
    </section>
  )
}

function ProductManagement({ products, inventory, onAdd, onEdit, onRemove }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return products.filter((product) => {
      const matches = `${product.name} ${product.brand} ${product.sku}`.toLowerCase().includes(keyword)
      const value = inventory ? stockStatus(product).value : product.category
      return matches && (!filter || filter === value)
    })
  }, [products, search, inventory, filter])

  return (
    <section className="admin-table-panel">
      <div className="admin-table-heading">
        <div>
          <h3>{inventory ? 'Theo dõi tồn kho' : 'Danh sách sản phẩm'}</h3>
          <p>{inventory ? 'Kiểm tra và cập nhật số lượng theo SKU.' : 'Quản lý thông tin, giá bán và danh mục.'}</p>
        </div>
        {!inventory && <button className="button button-dark admin-add-btn" onClick={onAdd}><Plus size={16}/> Thêm sản phẩm</button>}
      </div>
      <div className="admin-table-tools">
        <label><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, thương hiệu, SKU..." aria-label="Tìm sản phẩm"/></label>
        <select className="admin-filter-btn" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label={inventory ? 'Lọc theo tồn kho' : 'Lọc theo danh mục'}>
          <option value="">{inventory ? 'Mọi trạng thái' : 'Mọi danh mục'}</option>
          {inventory ? (
            <>
              <option value="in-stock">Đang bán</option>
              <option value="low-stock">Sắp hết</option>
              <option value="out-stock">Hết hàng</option>
            </>
          ) : categories.map(({ id, name }) => <option value={id} key={id}>{name}</option>)}
        </select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>SẢN PHẨM</th><th>SKU</th>{!inventory && <><th>DANH MỤC</th><th>GIÁ BÁN</th></>}<th>TỒN KHO</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead>
          <tbody>{filtered.map((product) => (
            <tr key={product.id}>
              <td><div className="admin-product-cell">
                {product.image && <img src={product.image} alt=""/>}
                <span><strong>{product.name}</strong><small>{product.brand}</small></span>
              </div></td>
              <td className="sku-cell">{product.sku}</td>
              {!inventory && <><td>{categoryNames.get(product.category)}</td><td><strong>{formatCurrency(product.price)}</strong></td></>}
              <td>{formatNumber(product.stockQty)}</td>
              <td><StockStatus product={product}/></td>
              <td><div className="table-actions">
                <button onClick={() => onEdit(product)} aria-label={inventory ? 'Cập nhật tồn kho' : 'Sửa'}><Pencil size={15}/></button>
                {!inventory && <button onClick={() => onRemove(product)} aria-label="Xóa"><Trash2 size={15}/></button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {!filtered.length && <div className="table-empty">Không tìm thấy sản phẩm.</div>}
      </div>
      <div className="admin-table-footer">
        <span>Hiển thị {filtered.length} / {products.length} sản phẩm</span>
        <span>Dữ liệu lưu trong trình duyệt này.</span>
      </div>
    </section>
  )
}

function AdminProductForm({ modal, onClose, onSave }) {
  const [form, setForm] = useState(modal.product ? {
    ...modal.product,
    price: String(modal.product.price),
    stockQty: String(modal.product.stockQty),
  } : emptyForm)
  const [error, setError] = useState('')
  const inventory = modal.mode === 'inventory'
  const title = inventory ? 'Cập nhật tồn kho' : modal.product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    setError('')
  }

  const submit = (event) => {
    event.preventDefault()
    const stockQty = Number(form.stockQty)
    if (form.stockQty === '' || !Number.isSafeInteger(stockQty) || stockQty < 0) {
      setError('Tồn kho phải là số nguyên từ 0 trở lên.')
      return
    }

    const { category } = form
    const name = form.name.trim()
    const brand = form.brand.trim()
    const sku = form.sku.trim()
    const price = Number(form.price)
    if (!inventory) {
      if (!name || !brand || !sku || !categoryNames.has(category)) {
        setError('Vui lòng nhập tên, thương hiệu, SKU và chọn danh mục hợp lệ.')
        return
      }
      if (!Number.isSafeInteger(price) || price <= 0) {
        setError('Giá bán phải là số nguyên VND lớn hơn 0.')
        return
      }
    }

    const changes = inventory ? { stockQty } : { name, brand, sku, price, stockQty, category }
    const failure = onSave(changes)
    if (failure) setError(failure)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title"
        onSubmit={submit} noValidate onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
        <div className="modal-heading">
          <div><span className="eyebrow">PRODUCT MANAGEMENT</span><h3 id="admin-dialog-title">{title}</h3></div>
          <button type="button" onClick={onClose} aria-label="Đóng"><X/></button>
        </div>
        {inventory ? (
          <>
            <p>{modal.product.name} · {modal.product.sku}</p>
            <label>Tồn kho<input autoFocus type="number" min="0" value={form.stockQty} onChange={(event) => update('stockQty', event.target.value)} required/></label>
          </>
        ) : (
          <>
            <label>Tên sản phẩm<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} required/></label>
            <div className="modal-two">
              <label>Thương hiệu<input value={form.brand} onChange={(event) => update('brand', event.target.value)} required/></label>
              <label>SKU<input value={form.sku} onChange={(event) => update('sku', event.target.value)} required/></label>
            </div>
            <div className="modal-two">
              <label>Giá bán (VND)<input type="number" min="1" value={form.price} onChange={(event) => update('price', event.target.value)} required/></label>
              <label>Tồn kho<input type="number" min="0" value={form.stockQty} onChange={(event) => update('stockQty', event.target.value)} required/></label>
            </div>
            <label>Danh mục<select value={form.category} onChange={(event) => update('category', event.target.value)}>
              {categories.map(({ id, name }) => <option value={id} key={id}>{name}</option>)}
            </select></label>
          </>
        )}
        {error && <div className="form-submit-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="button button-outline" onClick={onClose}>Hủy</button>
          <button className="button button-dark" type="submit">{inventory ? 'Lưu tồn kho' : 'Lưu sản phẩm'}</button>
        </div>
      </form>
    </div>
  )
}

export default function AdminPage() {
  const [products, setProducts] = useState(() => isDemoMode ? readDemoProducts() : [])
  const [activeNav, setActiveNav] = useState('products')
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')
  const current = navigation.find(({ id }) => id === activeNav)

  useEffect(() => {
    if (!isDemoMode) return
    const refresh = () => setProducts(readDemoProducts())
    const unsubscribe = subscribeDemoProducts(refresh)
    refresh()
    return unsubscribe
  }, [])

  const navigate = (next) => {
    setActiveNav(next)
    setError('')
  }

  const save = (changes) => {
    const latest = readDemoProducts()
    const productId = modal.product?.id
    if (modal.product && !latest.some(({ id }) => id === productId)) return 'Sản phẩm đã bị xóa.'
    if (changes.sku && latest.some(({ id, sku }) => id !== productId && sku.toLowerCase() === changes.sku.toLowerCase())) {
      return 'SKU này đã được sử dụng cho sản phẩm khác.'
    }

    let next
    if (modal.product) {
      next = latest.map((item) => item.id === productId ? { ...item, ...changes } : item)
    } else {
      let id = Date.now()
      while (latest.some((item) => String(item.id) === String(id) || item.slug === `san-pham-${id}`)) id += 1
      const image = mockProducts.find(({ category }) => category === changes.category)?.image || mockProducts[0].image
      next = [{
        ...changes,
        id,
        slug: `san-pham-${id}`,
        createdAt: new Date().toISOString(),
        image,
        gallery: [image],
        rating: 0,
        reviewCount: 0,
        specs: {},
      }, ...latest]
    }

    try {
      saveDemoProducts(next)
      setModal(null)
      setError('')
      return ''
    } catch {
      return 'Không lưu được dữ liệu. Hãy kiểm tra quyền lưu trữ của trình duyệt.'
    }
  }

  const remove = (product) => {
    if (!window.confirm(`Xóa "${product.name}" khỏi danh mục demo?`)) return
    try {
      saveDemoProducts(readDemoProducts().filter(({ id }) => id !== product.id))
      setError('')
    } catch {
      setError('Không xóa được sản phẩm. Hãy kiểm tra quyền lưu trữ của trình duyệt.')
    }
  }

  const unavailable = !isDemoMode ? 'Cần kết nối chức năng quản trị với API có xác thực và quyền ADMIN.' : current.unavailable

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Menu quản trị">
        <Link to="/" className="brand-lockup light admin-brand"><span className="brand-mark">N</span><span className="brand-word">nova<span>mart</span><small>ADMIN CONSOLE</small></span></Link>
        <div className="admin-workspace"><span className="workspace-dot"/> NOVAMART STORE <ChevronDown size={14}/></div>
        <div className="admin-nav-label">WORKSPACE</div>
        {navigation.map(({ id, label, Icon }) => (
          <button className={activeNav === id ? 'active' : ''} aria-current={activeNav === id ? 'page' : undefined} onClick={() => navigate(id)} key={id}>
            <Icon/> {label}
          </button>
        ))}
        <Link to="/" className="admin-back-link"><LogOut/> Quay lại cửa hàng</Link>
        <div className="admin-user">
          <div className="admin-user-avatar">AD</div>
          <div><strong>Admin NovaMart</strong><small>{!isDemoMode ? 'Yêu cầu xác thực' : 'Quản trị viên demo'}</small></div>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-breadcrumb">NovaMart / <strong>{current.label}</strong></span><h1>{current.title || current.label}</h1></div>
          <div className="admin-top-actions"><Link to="/" className="admin-top-avatar" aria-label="Quay lại cửa hàng"><LogOut size={14}/></Link></div>
        </header>
        <div className="admin-content">
          {isDemoMode && <div className="admin-welcome"><div><h2>Quản trị NovaMart</h2><p>Danh mục demo lưu trong trình duyệt.</p></div><span className="demo-pill">DEMO MODE</span></div>}
          {error && <div className="form-submit-error" role="alert">{error}</div>}
          {unavailable ? (
            <section className="admin-table-panel">
              <div className="admin-table-heading"><div><h3>Chưa triển khai</h3><p>{unavailable}</p></div></div>
            </section>
          ) : (
            <>
              {activeNav === 'overview' && <AdminSummary products={products}/>}
              {activeNav === 'statistics' && <AdminStatistics products={products}/>}
              {(activeNav === 'products' || activeNav === 'inventory') && (
                <ProductManagement key={activeNav} products={products} inventory={activeNav === 'inventory'}
                  onAdd={() => setModal({ mode: 'add' })}
                  onEdit={(product) => setModal({ product, mode: activeNav === 'inventory' ? 'inventory' : 'edit' })}
                  onRemove={remove}/>
              )}
            </>
          )}
        </div>
      </main>
      {modal && <AdminProductForm modal={modal} onClose={() => setModal(null)} onSave={save}/>}
    </div>
  )
}
