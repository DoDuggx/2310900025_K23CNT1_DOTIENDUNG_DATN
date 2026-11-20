import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, TicketPercent } from 'lucide-react'
import { getCartTotals, useCartStore } from '../store/useCartStore'
import { formatCurrency } from '../utils/format'
import { isDemoMode } from '../services/apiClient'

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const voucher = useCartStore((state) => state.voucher)
  const applyVoucher = useCartStore((state) => state.applyVoucher)
  const [voucherInput, setVoucherInput] = useState(voucher || '')
  const [voucherError, setVoucherError] = useState('')
  const navigate = useNavigate()
  const { subtotal, discount, shipping, total } = getCartTotals(items, voucher)
  const submitVoucher = (event) => {
    event.preventDefault()
    const code = voucherInput.trim().toUpperCase()
    if (applyVoucher(code)) {
      setVoucherError('')
      setVoucherInput(code)
      return
    }
    setVoucherError('Mã giảm giá không hợp lệ. Thử NOVA10 hoặc TECH5.')
  }
  if (!items.length) return <div className="container page-wrap"><div className="breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><strong>Giỏ hàng</strong></div><div className="empty-state cart-empty"><div className="empty-icon"><ShoppingBag size={30}/></div><h2>Giỏ hàng đang trống</h2><p>Hãy khám phá những thiết bị công nghệ phù hợp với bạn.</p><Link className="button button-dark" to="/san-pham">Khám phá sản phẩm <ArrowUpRight size={16}/></Link></div></div>
  return (
    <div className="container page-wrap"><div className="breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><strong>Giỏ hàng</strong></div><div className="page-title-row"><div><div className="eyebrow">YOUR SELECTION</div><h1>Giỏ hàng <em>của bạn.</em></h1><p>{items.length} sản phẩm đang được giữ trong giỏ hàng.</p></div><Link to="/san-pham" className="text-link">Tiếp tục mua sắm <ArrowRight size={16}/></Link></div>
      <div className="cart-layout"><div className="cart-items-panel"><div className="cart-table-head"><span>SẢN PHẨM</span><span>ĐƠN GIÁ</span><span>SỐ LƯỢNG</span><span>TẠM TÍNH</span></div>{items.map((item) => <div className="cart-item" key={item.id}><div className="cart-product"><Link to={`/san-pham/${item.slug}`} state={{ productId: item.id }}>{item.image && <img src={item.image} alt={item.name}/>} </Link><div><small>{item.brand}</small><Link to={`/san-pham/${item.slug}`} state={{ productId: item.id }}>{item.name}</Link><span className="cart-sku">SKU: {item.sku}</span><button className="remove-item" onClick={() => removeItem(item.id)}><Trash2 size={13}/> Xóa</button></div></div><strong className="cart-unit-price">{formatCurrency(item.price)}</strong><div className="quantity-control cart-quantity"><button type="button" aria-label="Giảm số lượng" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={13}/></button><strong>{item.quantity}</strong><button type="button" aria-label="Tăng số lượng" disabled={item.quantity >= item.stockQty} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={13}/></button></div><strong className="cart-line-total">{formatCurrency(item.price * item.quantity)}</strong></div>)}</div>
        <aside className="order-summary"><h3>Tóm tắt đơn hàng</h3><form className="voucher-box" onSubmit={submitVoucher}><label htmlFor="voucher-code"><TicketPercent size={16}/> Mã ưu đãi</label><div><input id="voucher-code" value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} placeholder="Nhập mã giảm giá"/><button type="submit">Áp dụng</button></div>{voucherError && <small className="field-error">{voucherError}</small>}{voucher && <small className="field-success">Đã áp dụng mã {voucher}</small>}</form><div className="summary-line"><span>Tạm tính</span><strong>{formatCurrency(subtotal)}</strong></div><div className="summary-line"><span>Phí giao hàng</span><strong>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</strong></div>{discount > 0 && <div className="summary-line discount-line"><span>Giảm giá</span><strong>-{formatCurrency(discount)}</strong></div>}<div className="summary-total"><span>Tổng cộng</span><strong>{formatCurrency(total)}</strong></div><p className="vat-note">{isDemoMode ? 'Đã bao gồm thuế theo giá niêm yết (demo).' : 'Tổng tiền dự kiến. Giá và mã giảm giá sẽ được xác nhận khi đặt hàng.'}</p><button className="button button-dark checkout-button" onClick={() => navigate('/thanh-toan')}>Tiến hành thanh toán <ArrowRight size={17}/></button><div className="secure-note"><ShieldCheck size={16}/> Thông tin giao dịch được xử lý an toàn.</div></aside></div>
    </div>
  )
}
