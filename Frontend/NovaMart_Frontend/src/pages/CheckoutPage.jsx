import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, ShieldCheck, Truck } from 'lucide-react'
import { getCartTotals, useCartStore } from '../store/useCartStore'
import { formatCurrency } from '../utils/format'
import { isDemoMode } from '../services/apiClient'
import { createOrder, initiatePayment } from '../services/orderService'

const initialForm = { fullName: '', phone: '', email: '', address: '', note: '', paymentMethod: 'COD' }
const orderFieldMap = {
  recipientName: 'fullName',
  recipientPhone: 'phone',
  recipientEmail: 'email',
  shippingAddress: 'address',
  voucherCode: 'voucher',
}
const pendingOrderKey = 'novamart-pending-vnpay-v1'

function readPendingOrder() {
  try {
    const order = JSON.parse(sessionStorage.getItem(pendingOrderKey))
    if (order && ((Number.isSafeInteger(order.id) && order.id > 0) || (typeof order.id === 'string' && order.id.trim()))
      && order.demo === isDemoMode) {
      return {
        id: order.id,
        demo: order.demo,
        orderCode: typeof order.orderCode === 'string' ? order.orderCode : undefined,
        totalAmount: Number.isSafeInteger(order.totalAmount) && order.totalAmount >= 0 ? order.totalAmount : undefined,
      }
    }
  } catch {
    // Checkout remains available when browser storage is disabled.
  }
  return null
}

function savePendingOrder(order) {
  try {
    if (order) sessionStorage.setItem(pendingOrderKey, JSON.stringify(order))
    else sessionStorage.removeItem(pendingOrderKey)
  } catch {
    // The current page still retains the order for payment retry.
  }
}

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const voucher = useCartStore((state) => state.voucher)
  const clearCart = useCartStore((state) => state.clearCart)
  const { subtotal, discount, shipping, total } = getCartTotals(items, voucher)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(() => {
    const order = readPendingOrder()
    return order ? { order, method: 'VNPAY' } : null
  })
  const [payment, setPayment] = useState(() => ({ status: result?.order.demo ? 'unavailable' : 'idle' }))
  const requestActive = useRef(false)
  const paymentActive = useRef(false)
  const navigate = useNavigate()

  const update = (key, value) => {
    setForm((state) => ({ ...state, [key]: value }))
    setErrors((state) => ({ ...state, [key]: undefined, submit: undefined }))
  }

  const validate = () => {
    const next = {}
    const phone = form.phone.replace(/[\s.-]/g, '')
    if (form.fullName.trim().length < 2) next.fullName = 'Vui lòng nhập họ tên người nhận.'
    if (!/^(?:0|\+84)[1-9][0-9]{8}$/.test(phone)) next.phone = 'Số điện thoại chưa đúng định dạng.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Email chưa hợp lệ.'
    if (form.address.trim().length < 8) next.address = 'Vui lòng nhập địa chỉ nhận hàng cụ thể.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const startPayment = async (order) => {
    if (paymentActive.current) return
    paymentActive.current = true
    setPayment({ status: 'loading' })
    try {
      const response = await initiatePayment({ orderId: order.id, provider: 'VNPAY_SANDBOX' })
      setPayment(response)
    } catch (error) {
      setPayment({ status: 'error', message: error.message || 'Không thể khởi tạo thanh toán.' })
    } finally {
      paymentActive.current = false
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (requestActive.current || !items.length || !validate()) return
    requestActive.current = true
    setBusy(true)
    try {
      const order = await createOrder({
        recipientName: form.fullName.trim(),
        recipientPhone: form.phone.replace(/[\s.-]/g, ''),
        recipientEmail: form.email.trim(),
        shippingAddress: form.address.trim(),
        note: form.note.trim(),
        items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
        paymentMethod: form.paymentMethod,
        ...(voucher && { voucherCode: voucher }),
      })
      setResult({ order, method: form.paymentMethod })
      if (form.paymentMethod === 'VNPAY') savePendingOrder(order)
      if (useCartStore.getState().items === items) clearCart()
      if (form.paymentMethod === 'VNPAY') await startPayment(order)
    } catch (error) {
      const fields = {}
      for (const [apiField, formField] of Object.entries(orderFieldMap)) {
        const message = error.fieldErrors?.[apiField]
        if (typeof message === 'string' && message.trim()) fields[formField] = message
      }
      const submitMessage = error.status === 409
        ? 'Yêu cầu trước đang chờ xác nhận. Hãy thử lại với cùng thông tin đơn hàng.'
        : error.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.'
      setErrors({ ...fields, submit: submitMessage })
    } finally {
      requestActive.current = false
      setBusy(false)
    }
  }

  if (!items.length && !result) return <div className="container page-wrap"><div className="empty-state"><h2>Chưa có sản phẩm để thanh toán</h2><Link className="button button-dark" to="/san-pham">Quay lại mua sắm</Link></div></div>
  if (result) {
    const { order, method } = result
    return (
      <div className="container page-wrap">
        <div className="success-panel">
          <div className="success-icon"><CheckCircle2 size={38}/></div>
          <div className="eyebrow">ORDER RECEIVED</div>
          <h1>Cảm ơn bạn đã chọn <em>NovaMart.</em></h1>
          <p>Mã tham chiếu: <strong>{order.orderCode || order.id}</strong></p>
          {order.totalAmount != null && <p>Tổng đơn hàng: <strong>{formatCurrency(order.totalAmount)}</strong></p>}
          <div className="demo-warning">
            {order.demo ? 'Đây là đơn hàng demo. Đơn chưa được lưu vào cơ sở dữ liệu.' : 'Hệ thống đã nhận đơn hàng.'}
          </div>
          {method === 'BANK_TRANSFER' && <p>Đơn hàng đang chờ hướng dẫn chuyển khoản.</p>}
          {method === 'VNPAY' && (
            <div>
              {payment.status === 'loading' && <p role="status">Đang khởi tạo thanh toán VNPay Sandbox…</p>}
              {payment.status === 'unavailable' && <p role="status">VNPay Sandbox chưa được kết nối. Chưa phát sinh thanh toán.</p>}
              {payment.status === 'error' && <p role="alert">Đơn hàng đã được tạo. Khởi tạo thanh toán thất bại. {payment.message}</p>}
              {payment.status === 'ready' && (
                <>
                  <p role="status">Đơn hàng đang chờ thanh toán.</p>
                  <p><a className="button button-gold" href={payment.paymentUrl}>Mở VNPay Sandbox <ArrowRight size={16}/></a></p>
                </>
              )}
              {(payment.status === 'error' || payment.status === 'idle') && (
                <p><button type="button" className="button button-outline" onClick={() => startPayment(order)}>
                  {payment.status === 'error' ? 'Thử lại thanh toán' : 'Tiếp tục thanh toán'}
                </button></p>
              )}
            </div>
          )}
          <button className="button button-dark" disabled={payment.status === 'loading'} onClick={() => { savePendingOrder(null); navigate('/san-pham') }}>
            Tiếp tục mua sắm <ArrowRight size={16}/>
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="container page-wrap"><div className="breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><Link to="/gio-hang">Giỏ hàng</Link><span>/</span><strong>Thanh toán</strong></div><div className="page-title-row"><div><div className="eyebrow">SECURE CHECKOUT</div><h1>Hoàn tất <em>đơn hàng.</em></h1><p>Kiểm tra thông tin nhận hàng và phương thức thanh toán.</p></div><Link to="/gio-hang" className="text-link"><ArrowLeft size={15}/> Quay lại giỏ hàng</Link></div>
      <form className="checkout-layout" onSubmit={submit} noValidate><div className="checkout-main"><section className="checkout-section"><div className="checkout-section-title"><span>01</span><div><h3>Thông tin người nhận</h3><p>Thông tin dùng để giao hàng và xác nhận đơn.</p></div></div><div className="form-grid"><label className="form-field"><span>Họ và tên *</span><input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Nguyễn Văn A"/>{errors.fullName && <small>{errors.fullName}</small>}</label><label className="form-field"><span>Số điện thoại *</span><input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="09xx xxx xxx"/>{errors.phone && <small>{errors.phone}</small>}</label><label className="form-field"><span>Email *</span><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@example.com"/>{errors.email && <small>{errors.email}</small>}</label><label className="form-field full"><span>Địa chỉ nhận hàng *</span><input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"/>{errors.address && <small>{errors.address}</small>}</label><label className="form-field full"><span>Ghi chú</span><textarea rows="3" value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Ghi chú cho người giao hàng (không bắt buộc)"/></label></div></section>
        <section className="checkout-section"><div className="checkout-section-title"><span>02</span><div><h3>Phương thức thanh toán</h3><p>Chọn cách thanh toán phù hợp với bạn.</p></div></div><div className="payment-options"><label className={form.paymentMethod === 'COD' ? 'selected' : ''}><input type="radio" name="payment" checked={form.paymentMethod === 'COD'} onChange={() => update('paymentMethod', 'COD')}/><span className="payment-icon"><Truck/></span><span><strong>Thanh toán khi nhận hàng (COD)</strong><small>Thanh toán khi nhận và kiểm tra sản phẩm.</small></span></label><label className={form.paymentMethod === 'BANK_TRANSFER' ? 'selected' : ''}><input type="radio" name="payment" checked={form.paymentMethod === 'BANK_TRANSFER'} onChange={() => update('paymentMethod', 'BANK_TRANSFER')}/><span className="payment-icon"><CreditCard/></span><span><strong>Chuyển khoản ngân hàng</strong><small>Thông tin chuyển khoản sẽ được hướng dẫn sau khi xác nhận.</small></span></label><label className={form.paymentMethod === 'VNPAY' ? 'selected' : ''}><input type="radio" name="payment" checked={form.paymentMethod === 'VNPAY'} onChange={() => update('paymentMethod', 'VNPAY')}/><span className="payment-icon vnpay-icon">VNPAY</span><span><strong>Cổng thanh toán VNPay (Sandbox)</strong><small>Chỉ dùng cho môi trường thử nghiệm, chưa phát sinh tiền thật.</small></span></label></div></section>
        {errors.submit && <div className="form-submit-error" role="alert">{errors.submit}{errors.voucher && <p>{errors.voucher} <Link to="/gio-hang">Sửa mã giảm giá</Link></p>}</div>}
      </div><aside className="order-summary checkout-summary"><h3>Đơn hàng của bạn</h3><div className="checkout-products">{items.map((item) => <div key={item.id} className="checkout-product">{item.image && <img src={item.image} alt={item.name}/>} <div><strong>{item.name}</strong><small>{item.quantity} × {formatCurrency(item.price)}</small></div><b>{formatCurrency(item.price * item.quantity)}</b></div>)}</div><div className="summary-line"><span>Tạm tính</span><strong>{formatCurrency(subtotal)}</strong></div><div className="summary-line"><span>Giao hàng</span><strong>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</strong></div>{discount > 0 && <div className="summary-line discount-line"><span>Giảm giá ({voucher})</span><strong>-{formatCurrency(discount)}</strong></div>}<div className="summary-total"><span>Tổng thanh toán</span><strong>{formatCurrency(total)}</strong></div><button type="submit" className="button button-dark checkout-button" disabled={busy}>{busy ? 'Đang xử lý...' : 'Xác nhận đặt hàng'} <ArrowRight size={17}/></button><div className="secure-note"><ShieldCheck size={16}/> {isDemoMode ? 'Dữ liệu thanh toán được xử lý tại Backend trong bản triển khai thật.' : 'Tổng tiền dự kiến sẽ được xác nhận khi hệ thống nhận đơn.'}</div></aside></form>
    </div>
  )
}
