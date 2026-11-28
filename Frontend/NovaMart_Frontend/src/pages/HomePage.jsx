import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ShieldCheck, Truck, Headphones, Sparkles, ChevronRight, BadgeCheck } from 'lucide-react'
import ProductCard from '../components/ProductCard.jsx'
import { subscribeDemoProducts } from '../data/demoCatalog'
import { isDemoMode } from '../services/apiClient'
import { getCategories, getProducts } from '../services/productService'

const categoryImages = {
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80',
  phone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80',
  accessory: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80',
  wearable: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80',
  camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80',
  gaming: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=700&q=80',
  network: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=700&q=80',
  storage: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=700&q=80',
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [productStatus, setProductStatus] = useState('loading')
  const [categoryStatus, setCategoryStatus] = useState('loading')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!isDemoMode) return
    return subscribeDemoProducts(() => setRefresh((value) => value + 1))
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    getProducts({ size: 4, signal }).then(
      (items) => {
        if (!signal.aborted) {
          setProducts(items)
          setProductStatus('success')
        }
      },
      () => { if (!signal.aborted) setProductStatus('error') },
    )
    getCategories({ signal }).then(
      (items) => {
        if (!signal.aborted) {
          setCategories(items)
          setCategoryStatus('success')
        }
      },
      () => { if (!signal.aborted) setCategoryStatus('error') },
    )
    return () => controller.abort()
  }, [refresh])
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy"><div className="eyebrow light-eyebrow"><span/> NOVAMART · CURATED TECHNOLOGY</div><h1>Công nghệ tốt.<br/><em>Trải nghiệm</em> khác biệt.</h1><p>Khám phá những thiết bị được tuyển chọn kỹ lưỡng — từ hiệu năng mạnh mẽ đến những chi tiết tạo nên trải nghiệm mỗi ngày.</p><div className="hero-actions"><Link className="button button-gold" to="/san-pham">Khám phá sản phẩm <ArrowUpRight size={17}/></Link><a className="hero-text-link" href="#danh-muc">Khám phá danh mục <ArrowRight size={16}/></a></div><div className="hero-proof"><div className="proof-avatars"><span>NM</span><span>★</span><span>+</span></div><div><strong>Chọn lọc có chủ đích</strong><small>Thiết bị chính hãng · Tư vấn tận tâm</small></div></div></div>
          <div className="hero-visual"><div className="hero-image-main"><img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=90" alt="Laptop công nghệ cao cấp"/></div><div className="hero-floating-card"><span className="floating-icon"><Sparkles size={17}/></span><div><strong>Chọn đúng thiết bị</strong><small>AI tư vấn theo nhu cầu</small></div><ArrowUpRight size={17}/></div><div className="hero-vertical-label">TECHNOLOGY · LIFESTYLE · PERFORMANCE</div></div>
        </div>
        <div className="hero-bottom-line"><span>01 / 03</span><span className="line"/><span>DISCOVER YOUR NEXT DEVICE</span></div>
      </section>

      <section className="trust-strip"><div className="container trust-grid"><div><ShieldCheck/><span><strong>Chính hãng & minh bạch</strong><small>Thông tin sản phẩm rõ ràng</small></span></div><div><Truck/><span><strong>Giao hàng toàn quốc</strong><small>Đóng gói cẩn thận</small></span></div><div><Headphones/><span><strong>Tư vấn có chuyên môn</strong><small>Chọn thiết bị đúng nhu cầu</small></span></div><div><BadgeCheck/><span><strong>Hỗ trợ sau mua</strong><small>Đồng hành trong quá trình sử dụng</small></span></div></div></section>

      <section className="section container" id="danh-muc"><div className="section-heading"><div><div className="eyebrow">EXPLORE COLLECTIONS</div><h2>Khám phá theo <em>danh mục</em></h2><p>Mọi thứ bạn cần, được sắp xếp để tìm thấy dễ dàng hơn.</p></div><Link className="text-link" to="/san-pham">Tất cả danh mục <ArrowUpRight size={16}/></Link></div>{categoryStatus === 'error' ? <p role="alert">Không tải được danh mục.</p> : categoryStatus === 'loading' ? <p role="status">Đang tải danh mục...</p> : !categories.length ? <p>Chưa có danh mục.</p> : <div className="category-grid">{categories.map((category, index) => {
        const image = category.image || categoryImages[category.slug ?? category.id]
        return <Link to={`/san-pham?category=${encodeURIComponent(category.id)}`} className={`category-tile category-${index + 1}`} key={category.id}>{image && <img src={image} alt={category.name}/>}<div className="category-overlay"/><div className="category-info"><span>0{index + 1}{category.count != null && ` / ${category.count} sản phẩm`}</span><strong>{category.name}</strong><small>Khám phá <ArrowUpRight size={14}/></small></div></Link>
      })}</div>}</section>

      <section className="section section-soft"><div className="container"><div className="section-heading"><div><div className="eyebrow">THE NOVAMART SELECTION</div><h2>Lựa chọn <em>nổi bật</em></h2><p>Những thiết bị được khách hàng quan tâm trong tuần.</p></div><Link className="text-link" to="/san-pham">Xem toàn bộ <ArrowUpRight size={16}/></Link></div>{productStatus === 'error' ? <p role="alert">Không tải được sản phẩm nổi bật.</p> : productStatus === 'loading' ? <p role="status">Đang tải sản phẩm nổi bật...</p> : !products.length ? <p>Chưa có sản phẩm nổi bật.</p> : <div className="product-grid featured-grid">{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div>}</div></section>

      <section className="section container" id="uu-dai"><div className="ai-banner"><div className="ai-banner-copy"><div className="eyebrow light-eyebrow"><Sparkles size={14}/> SMART SHOPPING</div><h2>Chưa biết chọn gì?<br/><em>Hỏi Nova.</em></h2><p>Chia sẻ ngân sách, mục đích sử dụng và điều bạn ưu tiên. Trợ lý Nova sẽ giúp bạn bắt đầu hành trình chọn thiết bị phù hợp.</p><button className="button button-gold" onClick={() => window.dispatchEvent(new Event('novamart:open-chat'))}>Bắt đầu tư vấn <ArrowUpRight size={17}/></button></div><div className="ai-banner-art"><div className="ai-orbit orbit-one"/><div className="ai-orbit orbit-two"/><div className="ai-core"><Sparkles size={38}/><span>NOVA AI</span></div><div className="ai-chip chip-one">Theo ngân sách</div><div className="ai-chip chip-two">Theo nhu cầu</div><div className="ai-chip chip-three">Gợi ý cấu hình</div></div></div></section>

      <section className="section container editorial-section"><div className="editorial-image"><img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85" alt="Không gian làm việc công nghệ"/></div><div className="editorial-copy"><div className="eyebrow">WHY NOVAMART</div><h2>Không chỉ bán thiết bị.<br/><em>Chúng tôi chọn giải pháp.</em></h2><p>Mỗi sản phẩm được giới thiệu với thông tin dễ hiểu, thông số trọng yếu và định hướng sử dụng thực tế. NovaMart hướng tới trải nghiệm mua sắm công nghệ có cân nhắc — không chỉ là một danh sách sản phẩm.</p><Link className="text-link" to="/san-pham">Tìm thiết bị phù hợp <ArrowUpRight size={16}/></Link><div className="editorial-stat"><strong>01</strong><span>Trải nghiệm mua sắm tập trung vào nhu cầu thật.</span></div></div></section>
      <section className="bottom-cta"><div className="container bottom-cta-inner"><div><div className="eyebrow light-eyebrow">YOUR NEXT UPGRADE STARTS HERE</div><h2>Sẵn sàng nâng cấp trải nghiệm?</h2></div><Link className="button button-light" to="/san-pham">Mua sắm ngay <ChevronRight size={17}/></Link></div></section>
    </>
  )
}
