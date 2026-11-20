import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Star, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '../utils/format'
import { useCartStore } from '../store/useCartStore'

export default function ProductCard({ product, list = false }) {
  const addItem = useCartStore((state) => state.addItem)
  const inCart = useCartStore((state) => state.items.find(({ id }) => String(id) === String(product.id))?.quantity ?? 0)
  const [saved, setSaved] = useState(false)
  const [added, setAdded] = useState(false)
  const add = () => {
    if (!addItem(product)) return
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }
  return (
    <article className={`product-card ${list ? 'list-card' : ''}`}>
      <Link to={`/san-pham/${product.slug}`} state={{ productId: product.id }} className="product-image-wrap">
        {product.badge && <span className="product-badge">{product.badge}</span>}
        {product.image && <img src={product.image} alt={product.name} loading="lazy"/>}
        <span className="quick-view">Xem chi tiết <ArrowUpRight size={14}/></span>
      </Link>
      <div className="product-card-content">
        <div className="product-meta"><span>{product.brand}</span><span className="rating"><Star size={13} fill="currentColor"/> {product.rating} <small>({product.reviewCount})</small></span></div>
        <Link to={`/san-pham/${product.slug}`} state={{ productId: product.id }} className="product-title">{product.name}</Link>
        <div className="product-price-row"><div><strong>{formatCurrency(product.price)}</strong>{product.oldPrice && <del>{formatCurrency(product.oldPrice)}</del>}</div><button className={`heart-button ${saved ? 'active' : ''}`} onClick={() => setSaved(!saved)} aria-label="Yêu thích"><Heart size={17} fill={saved ? 'currentColor' : 'none'}/></button></div>
        <div className="product-card-bottom"><span className={product.stockQty > 0 ? 'stock-ok' : 'stock-out'}>{product.stockQty > 0 ? `Còn ${product.stockQty} sản phẩm` : 'Tạm hết hàng'}</span><button className="add-cart-mini" onClick={add} disabled={product.stockQty <= inCart}>{added ? 'Đã thêm ✓' : <><ShoppingBag size={15}/> Thêm</>}</button></div>
      </div>
    </article>
  )
}
