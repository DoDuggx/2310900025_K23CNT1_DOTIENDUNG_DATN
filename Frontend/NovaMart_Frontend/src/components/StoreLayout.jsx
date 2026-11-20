import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import StoreHeader from './StoreHeader.jsx'
import StoreFooter from './StoreFooter.jsx'
import ChatWidget from './ChatWidget.jsx'
import { readDemoProducts, subscribeDemoProducts } from '../data/demoCatalog'
import { isDemoMode } from '../services/apiClient'
import { useCartStore } from '../store/useCartStore'

export default function StoreLayout() {
  useEffect(() => {
    if (!isDemoMode) return
    const syncCart = () => useCartStore.getState().syncProducts(readDemoProducts())
    syncCart()
    return subscribeDemoProducts(syncCart)
  }, [])

  return (
    <div className="app-shell">
      <div className="announcement"><span>Miễn phí giao hàng cho đơn từ 2.000.000₫</span><span>Hỗ trợ tư vấn mỗi ngày · 08:00–22:00</span></div>
      <StoreHeader />
      <main><Outlet /></main>
      <StoreFooter />
      <ChatWidget />
    </div>
  )
}
