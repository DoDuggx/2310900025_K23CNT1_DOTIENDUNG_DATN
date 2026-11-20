import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Menu, X, Sparkles } from 'lucide-react'
import { useCartStore } from '../store/useCartStore'

export default function StoreHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const onCatalog = location.pathname === '/san-pham'
  const currentQuery = onCatalog ? new URLSearchParams(location.search).get('q') || '' : ''
  const [search, setSearch] = useState(currentQuery)
  const [mobileOpen, setMobileOpen] = useState(false)
  const count = useCartStore((state) => state.getCount())
  useEffect(() => setSearch(currentQuery), [currentQuery, location.key])

  const submit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams(onCatalog ? location.search : '')
    const keyword = search.trim()
    if (keyword) params.set('q', keyword)
    else params.delete('q')
    params.delete('page')
    navigate({ pathname: '/san-pham', search: params.toString() })
    setMobileOpen(false)
  }
  return (
    <header className="site-header">
      <div className="header-inner container">
        <button className="icon-button mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu">{mobileOpen ? <X /> : <Menu />}</button>
        <Link to="/" className="brand-lockup"><span className="brand-mark">N</span><span className="brand-word">nova<span>mart</span><small>TECHNOLOGY STORE</small></span></Link>
        <nav className={`main-nav ${mobileOpen ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setMobileOpen(false)}>Trang chủ</NavLink>
          <NavLink to="/san-pham" onClick={() => setMobileOpen(false)}>Sản phẩm</NavLink>
          <a href="/#uu-dai" onClick={() => setMobileOpen(false)}>Ưu đãi</a>
          <a href="/#ve-novamart" onClick={() => setMobileOpen(false)}>Về NovaMart</a>
        </nav>
        <form className="header-search" onSubmit={submit}>
          <Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thiết bị, thương hiệu..." aria-label="Tìm sản phẩm" /><button type="submit">Tìm kiếm</button>
        </form>
        <div className="header-actions">
          <button className="ai-shortcut ai-shortcut-button" type="button" aria-label="Mở trợ lý AI" onClick={() => window.dispatchEvent(new Event('novamart:open-chat'))}><Sparkles size={17} /><span>AI tư vấn</span></button>
          <Link to="/gio-hang" className="cart-link" aria-label="Giỏ hàng"><ShoppingBag size={21} /><span>Giỏ hàng</span><b>{count}</b></Link>
        </div>
      </div>
    </header>
  )
}
