import { Link } from 'react-router-dom'
export default function NotFoundPage() { return <div className="container page-wrap"><div className="empty-state"><div className="eyebrow">404 · PAGE NOT FOUND</div><h1>Trang này chưa có trong NovaMart.</h1><p>Đường dẫn có thể đã thay đổi hoặc không tồn tại.</p><Link className="button button-dark" to="/">Về trang chủ</Link></div></div> }
