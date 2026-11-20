# NovaMart Front-end

Giao diện front-end cho đề tài **Xây dựng website kinh doanh thiết bị công nghệ tích hợp AI tư vấn sản phẩm và thanh toán trực tuyến NovaMart**.

## 1. Nền tảng và công nghệ

- React 19.0.0 + React DOM 19.0.0
- Vite 6.4.6
- React Router DOM 7.18.6
- Zustand 5.0.2 (trạng thái giỏ hàng, lưu localStorage)
- Lucide React 0.468.0 (biểu tượng)
- JavaScript ES Modules, CSS3 responsive
- Node.js 20.x hoặc từ 22 trở lên, npm

## 2. Template tham chiếu miễn phí

Đồ án chọn **danilo62x/ecommerce-react** làm mẫu tham chiếu cấu trúc trải nghiệm cửa hàng: trang chủ, danh mục có bộ lọc, tìm kiếm, chi tiết sản phẩm, giỏ hàng và checkout. Kho tham chiếu công bố giấy phép MIT và stack React 19 + Vite 6. Phần NovaMart trong thư mục này là mã nguồn giao diện được tổ chức lại theo nhận diện premium và mô hình dữ liệu/kiến trúc đã thiết kế ở Chương 3; không chứa mã nguồn backend của kho tham chiếu.

Repository tham chiếu: https://github.com/danilo62x/ecommerce-react

## 3. Chạy dự án

```bash
npm install
cp .env.example .env
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal (mặc định `http://localhost:5173`).

Tạo bản build:

```bash
npm run build
npm run preview
```

## 4. Cấu hình kết nối Spring Boot

Sửa `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_DEMO_MODE=false
```

Khi chưa có backend, dùng `VITE_DEMO_MODE=true` và để URL trống. Admin và storefront chia sẻ danh mục demo trong trình duyệt. Trong chế độ API, dữ liệu rỗng và lỗi được hiển thị riêng. Khi đổi chế độ, khởi động lại Vite hoặc build lại. Xem request, response và yêu cầu CORS trong `docs/API_CONTRACT.md`.

**Không đặt Gemini API Key, JWT secret, mật khẩu DB hoặc khóa thanh toán trong biến `VITE_*`.** Các bí mật phải được giữ ở backend.

## 5. Màn hình và chức năng đã dựng ở lớp giao diện

- `/`: Trang chủ premium, danh mục, sản phẩm nổi bật, khu vực giới thiệu AI.
- `/san-pham`: Tìm kiếm, lọc theo danh mục/giá/thương hiệu, sắp xếp, grid/list, phân trang.
- `/san-pham/:slug`: Chi tiết, ảnh, giá, thông số, tồn kho, thêm giỏ/mua ngay.
- `/gio-hang`: Chỉnh số lượng, xóa sản phẩm, mã NOVA10/TECH5, tính phí giao hàng.
- `/thanh-toan`: Form người nhận, validation, COD/chuyển khoản/VNPay sandbox (chưa kết nối cổng thật).
- Chat widget: giao diện hội thoại, gọi `/ai/chat` trong chế độ API. Chế độ demo trả lời theo từ khóa và gắn nhãn.
- `/admin`: Bảng quản trị sản phẩm, thêm/sửa/xóa và tồn kho ở chế độ localStorage demo.

## 6. Trạng thái triển khai và giới hạn

Đây là **nền tảng Front-end / prototype có tương tác**. Dữ liệu sản phẩm, số liệu dashboard và thao tác Admin hiện chạy bằng dữ liệu demo ở trình duyệt. Chưa có backend Spring Boot, MySQL, xác thực/phân quyền máy chủ, Gemini API thật hoặc giao dịch VNPay thật. Admin phải được bảo vệ bằng Spring Security ở backend trước khi triển khai thực tế.

Schema Chương 3 hiện có 9 bảng: `users`, `categories`, `products`, `carts`, `cart_items`, `orders`, `order_items`, `payments`, `ai_consultations`. Giao diện có thêm các trường mô tả như `brand`, `image`, `gallery`, `specs`, `rating`; cần thống nhất DTO và cân nhắc mở rộng bảng sản phẩm/ảnh/thông số trước khi lưu dữ liệu thật.

## 7. Git gợi ý

```bash
git init
git add .
git commit -m "chore(frontend): khoi tao React Vite cho NovaMart"
git add src/components src/pages src/index.css
git commit -m "feat(frontend): xay dung giao dien cua hang premium"
git add src/services src/store src/data
 git commit -m "feat(frontend): them gio hang va lop tich hop API"
```

Nên tạo repository riêng cho đồ án, không đưa `.env` thật hoặc secret lên GitHub.
