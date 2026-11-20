import { apiRequest, isDemoMode } from './apiClient'

const attemptKey = 'novamart-order-attempt-v1'
let currentAttempt

function orderAttempt() {
  if (currentAttempt) return currentAttempt
  try {
    const saved = sessionStorage.getItem(attemptKey)
    if (/^[a-f0-9]{32}$/.test(saved || '')) currentAttempt = saved
  } catch {
    // The in-memory token still covers retries on this page.
  }
  if (currentAttempt) return currentAttempt

  currentAttempt = Array.from(crypto.getRandomValues(new Uint8Array(16)),
    (byte) => byte.toString(16).padStart(2, '0')).join('')
  try { sessionStorage.setItem(attemptKey, currentAttempt) } catch { /* Storage may be unavailable. */ }
  return currentAttempt
}

function clearAttempt(key) {
  if (currentAttempt !== key) return
  currentAttempt = undefined
  try { sessionStorage.removeItem(attemptKey) } catch { /* Storage may be unavailable. */ }
}

function validOrderId(id) {
  return (Number.isSafeInteger(id) && id > 0) || (typeof id === 'string' && id.trim())
}

export async function createOrder(payload) {
  if (isDemoMode) {
    const id = `NM-DEMO-${Date.now()}`
    return { id, demo: true, orderCode: id, status: 'PENDING_BACKEND' }
  }

  const key = orderAttempt()
  try {
    const order = await apiRequest('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(payload),
    })
    if (!validOrderId(order?.id)) throw new Error('Hệ thống chưa trả mã định danh đơn hàng.')
    clearAttempt(key)
    return {
      id: order.id,
      orderCode: typeof order.orderCode === 'string' ? order.orderCode : undefined,
      totalAmount: Number.isSafeInteger(order.totalAmount) && order.totalAmount >= 0 ? order.totalAmount : undefined,
      demo: false,
    }
  } catch (error) {
    if ([400, 422].includes(error.status)) clearAttempt(key)
    throw error
  }
}

export async function initiatePayment(payload) {
  if (isDemoMode) return { status: 'unavailable' }
  const response = await apiRequest('/payments/initiate', { method: 'POST', body: JSON.stringify(payload) })
  if (response?.status === 'UNAVAILABLE') return { status: 'unavailable' }
  if (response?.status !== 'PENDING') throw new Error('Hệ thống chưa trả trạng thái khởi tạo thanh toán hợp lệ.')
  let url
  try {
    url = new URL(response?.paymentUrl)
  } catch {
    throw new Error('Hệ thống chưa trả liên kết thanh toán hợp lệ.')
  }
  if (url.origin !== 'https://sandbox.vnpayment.vn' || url.pathname !== '/paymentv2/vpcpay.html' || url.username || url.password) {
    throw new Error('Liên kết thanh toán không thuộc VNPay Sandbox.')
  }
  return { status: 'ready', paymentUrl: url.href }
}
