import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { isDemoMode } from '../services/apiClient'

export default function StoreFooter() {
  return (
    <footer className="site-footer" id="ve-novamart">
      <div className="container footer-main">
        <div className="footer-brand"><Link to="/" className="brand-lockup light"><span className="brand-mark">N</span><span className="brand-word">nova<span>mart</span><small>TECHNOLOGY STORE</small></span></Link><p>Không gian mua sắm công nghệ được tuyển chọn — nơi hiệu năng, thiết kế và trải nghiệm gặp nhau.</p></div>
        <div><h4>Khám phá</h4><Link to="/san-pham">Tất cả sản phẩm</Link><Link to="/san-pham?category=laptop">Laptop</Link><Link to="/san-pham?category=phone">Điện thoại</Link><Link to="/san-pham?category=audio">Âm thanh</Link></div>
        <div><h4>Hỗ trợ</h4><a href="#">Chính sách bảo hành</a><a href="#">Giao hàng & đổi trả</a><a href="#">Hướng dẫn mua hàng</a><Link to="/admin">Khu vực quản trị</Link></div>
        <div><h4>Kết nối với chúng tôi</h4><p className="footer-contact"><MapPin size={15}/> Hà Nội, Việt Nam</p><p className="footer-contact"><Phone size={15}/> 1900 6868</p><p className="footer-contact"><Mail size={15}/> hello@novamart.vn</p><a className="footer-social" href="mailto:hello@novamart.vn">Liên hệ NovaMart <ArrowUpRight size={15}/></a></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 NovaMart.{isDemoMode && ' Giao diện đồ án – dữ liệu minh họa.'}</span><span>Thiết kế với sự chú trọng đến từng chi tiết.</span></div>
    </footer>
  )
}
