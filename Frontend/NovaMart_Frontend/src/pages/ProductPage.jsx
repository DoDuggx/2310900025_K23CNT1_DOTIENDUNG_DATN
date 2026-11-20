import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck, Star } from 'lucide-react'
import ProductCard from '../components/ProductCard.jsx'
import { subscribeDemoProducts } from '../data/demoCatalog'
import { isDemoMode } from '../services/apiClient'
import { getProductByRoute, getProductPage } from '../services/productService'
import { useCartStore } from '../store/useCartStore'
import { formatCurrency } from '../utils/format'

export default function ProductPage() {
  const { slug } = useParams()
  const { state } = useLocation()
  return <ProductRoute key={slug} slug={slug} productId={state?.productId}/>
}

function ProductRoute({ slug, productId }) {
  const [status, setStatus] = useState('loading')
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!isDemoMode) return
    return subscribeDemoProducts(() => setRefresh((value) => value + 1))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    getProductByRoute(slug, { id: productId, signal }).then(
      (item) => {
        if (signal.aborted) return
        setProduct(item)
        setRelated([])
        setStatus(item ? 'success' : 'not-found')
        if (item?.category) {
          getProductPage({ category: item.category, size: 4, signal }).then(
            ({ items }) => {
              if (!signal.aborted) setRelated(items.filter(({ id }) => id !== item.id).slice(0, 3))
            },
            () => {},
          )
        }
      },
      (error) => {
        if (!signal.aborted) {
          setError(error.message)
          setStatus(error.status === 404 ? 'not-found' : 'error')
        }
      },
    )
    return () => controller.abort()
  }, [slug, productId, refresh])

  if (status === 'success') return <ProductDetails product={product} related={related}/>

  return <div className="container page-wrap"><div className="empty-state">
    {status === 'loading' ? <h2 role="status">Đang tải sản phẩm...</h2> : <>
      <h2>{status === 'not-found' ? 'Không tìm thấy sản phẩm' : 'Không tải được sản phẩm'}</h2>
      {status === 'error' && <><p role="alert">{error}</p><button className="button button-outline" onClick={() => { setStatus('loading'); setRefresh((value) => value + 1) }}>Thử lại</button></>}
      <Link to="/san-pham" className="button button-dark">Quay lại danh sách</Link>
    </>}
  </div></div>
}

function ProductDetails({ product, related }) {
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const inCart = useCartStore((state) => state.items.find(({ id }) => String(id) === String(product.id))?.quantity ?? 0)
  const navigate = useNavigate()
  const gallery = Array.isArray(product.gallery) ? product.gallery.filter((image) => typeof image === 'string' && image) : []
  const images = gallery.length ? [...new Set(gallery)] : [product.image].filter(Boolean)
  const currentImage = images[activeImage] ?? images[0]
  const specs = product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs)
    ? Object.entries(product.specs).filter(([, value]) => typeof value === 'string' || typeof value === 'number').slice(0, 5)
    : []
  const maxQuantity = Math.max(0, product.stockQty - inCart)
  const selectedQuantity = Math.min(quantity, Math.max(1, maxQuantity))

  const add = (buy = false) => {
    if (!maxQuantity || !addItem(product, selectedQuantity)) return
    setAdded(true)
    if (buy) navigate('/gio-hang')
  }

  return (
    <div className="container page-wrap">
      <div className="breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><Link to="/san-pham">Sản phẩm</Link><span>/</span><strong>{product.name}</strong></div>
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-main-image">{currentImage && <img src={currentImage} alt={product.name}/>}<span className="gallery-label">NOVAMART SELECT</span></div>
          <div className="gallery-thumbs">{images.map((image, index) => <button className={currentImage === image ? 'active' : ''} aria-pressed={currentImage === image} key={image} onClick={() => setActiveImage(index)}><img src={image} alt={`${product.name} ${index + 1}`}/></button>)}</div>
        </div>
        <div className="product-detail-info">
          <div className="eyebrow">{product.brand} · {product.sku}</div>
          <h1>{product.name}</h1>
          <div className="detail-rating"><span><Star size={15} fill="currentColor"/> {product.rating}</span><span>{product.reviewCount} đánh giá</span><span className="detail-stock"><i/> {product.stockQty > 0 ? `Còn ${product.stockQty} sản phẩm` : 'Tạm hết hàng'}</span></div>
          <div className="detail-price"><strong>{formatCurrency(product.price)}</strong>{product.oldPrice && <del>{formatCurrency(product.oldPrice)}</del>}{product.oldPrice && <span className="discount-tag">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>}</div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-benefits"><div><ShieldCheck/><span><strong>Chính hãng</strong><small>Thông tin bảo hành rõ ràng</small></span></div><div><Truck/><span><strong>Giao hàng an toàn</strong><small>Kiểm tra trước khi nhận</small></span></div></div>
          {specs.length > 0 && <div className="detail-specs">
            <div className="detail-specs-heading"><strong>Thông số nổi bật</strong><span>Thông tin tham khảo</span></div>
            {specs.map(([key, value]) => <div className="spec-row" key={key}><span>{key}</span><strong>{value}</strong></div>)}
          </div>}
          <div className="purchase-row">
            <div className="quantity-control">
              <button disabled={selectedQuantity <= 1} aria-label="Giảm số lượng" onClick={() => setQuantity(selectedQuantity - 1)}><Minus size={15}/></button>
              <strong>{selectedQuantity}</strong>
              <button disabled={selectedQuantity >= maxQuantity} aria-label="Tăng số lượng" onClick={() => setQuantity(selectedQuantity + 1)}><Plus size={15}/></button>
            </div>
            <button className="button button-dark add-detail" onClick={() => add(false)} disabled={!maxQuantity}><ShoppingBag size={17}/>{added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}</button>
            <button className="button button-gold buy-detail" onClick={() => add(true)} disabled={!maxQuantity}>Mua ngay <ArrowRight size={16}/></button>
            <button className="detail-heart" aria-label="Yêu thích"><Heart/></button>
          </div>
          <p className="detail-note"><Check size={14}/> {isDemoMode ? 'Giá và tồn kho trong bản demo là dữ liệu minh họa.' : 'Giá và tồn kho sẽ được kiểm tra lại khi đặt hàng.'}</p>
        </div>
      </div>
      {related.length > 0 && <section className="section related-section"><div className="section-heading"><div><div className="eyebrow">YOU MAY ALSO LIKE</div><h2>Có thể bạn <em>quan tâm</em></h2></div><Link className="text-link" to="/san-pham">Xem thêm <ArrowRight size={16}/></Link></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item}/>)}</div></section>}
    </div>
  )
}
