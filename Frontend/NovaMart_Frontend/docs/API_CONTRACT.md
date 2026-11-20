# API contract đề xuất cho NovaMart Front-end ↔ Spring Boot

Base URL: `/api/v1`

| Method | Endpoint | Mục đích | Payload / tham số chính |
|---|---|---|---|
| GET | `/categories` | Danh sách danh mục | — |
| GET | `/products` | Danh sách, tìm kiếm, lọc, phân trang | `keyword`, `categoryId`, `brand`, `minPrice`, `maxPrice`, `page`, `size`, `sort` |
| GET | `/products/{id}` | Chi tiết sản phẩm theo ID | — |
| GET | `/products/by-slug/{slug}` | Chi tiết cho liên kết trực tiếp | — |
| POST | `/orders` | Tạo đơn hàng | Header `Idempotency-Key` và payload đặt hàng bên dưới |
| GET | `/orders/{id}` | Chi tiết đơn hàng | — |
| POST | `/payments/initiate` | Khởi tạo thanh toán thử nghiệm | `{ "orderId": "123", "provider": "VNPAY_SANDBOX" }` |
| POST | `/payments/callback/{provider}` | Nhận callback, xác minh chữ ký ở backend | Payload do cổng thanh toán gửi |
| POST | `/ai/chat` | Tư vấn sản phẩm | `{ "message": "..." }`. Các trường `budget` và `purpose` là tùy chọn. |
| GET | `/admin/products` | Quản trị: danh sách sản phẩm | Yêu cầu role ADMIN |
| POST | `/admin/products` | Quản trị: thêm sản phẩm | DTO sản phẩm; yêu cầu role ADMIN |
| PUT | `/admin/products/{id}` | Quản trị: cập nhật sản phẩm | DTO sản phẩm; yêu cầu role ADMIN |
| DELETE | `/admin/products/{id}` | Quản trị: xóa/ngừng bán | Yêu cầu role ADMIN |

## Catalog

- `GET /categories` trả mảng `{id, name}`. ID có thể là chuỗi hoặc số nguyên dương biểu diễn chính xác trong JavaScript. Dùng chuỗi cho ID Java vượt giới hạn này. `categoryId` trong bộ lọc và DTO sản phẩm tham chiếu cùng ID.
- `GET /products` trả trực tiếp `{content, totalElements, totalPages, number, size}`. `page` và `number` bắt đầu từ 0. `size` là kích thước trang. API chấp nhận nhiều khóa `sort` dạng `field,asc|desc` theo thứ tự ưu tiên. Giao diện dùng `price`, `createdAt`, `rating` và `id`. ID làm tiêu chí cuối để các trang ổn định khi giá trị sắp xếp trùng.
- Kết quả rỗng trả `200` với `content: []`, `totalElements: 0` và `totalPages: 0`. Khi yêu cầu vượt trang cuối nhưng vẫn có kết quả, giữ metadata đúng và trả `content: []` để giao diện điều hướng về trang hợp lệ.
- Hai endpoint chi tiết trả cùng DTO. `id` dùng cho định danh và giỏ hàng. `slug` duy nhất dùng cho liên kết storefront. Các trường chính là `id`, `slug`, `name`, `categoryId`, `price` nguyên không âm theo VND và `stockQty` nguyên không âm. Có thể bổ sung `brand`, `sku`, `image`, `gallery`, `description`, `specs`, `oldPrice`, `rating`, `reviewCount` và `createdAt`. Trả `404` khi sản phẩm không tồn tại.

## Đơn hàng và thanh toán

`POST /orders` nhận payload sau. Bỏ qua `voucherCode` nếu khách chưa áp dụng mã. Backend xác nhận mã, giá và tồn kho, sau đó tính lại tổng tiền.

```json
{
  "recipientName": "Khách Demo",
  "recipientPhone": "0901234567",
  "recipientEmail": "customer@example.test",
  "shippingAddress": "123 Đường Ví Dụ",
  "note": "",
  "items": [{ "productId": "17", "quantity": 1 }],
  "paymentMethod": "VNPAY",
  "voucherCode": "NOVA10"
}
```

- Phương thức đặt hàng nhận `COD`, `BANK_TRANSFER` hoặc `VNPAY`. Phản hồi tạo đơn chứa `id`, có thể kèm `orderCode`, `status` và `totalAmount` đã tính ở server. Trạng thái đơn độc lập với trạng thái thanh toán.
- Backend lưu và kiểm tra `Idempotency-Key` cùng thao tác tạo đơn trong một giao dịch. Cùng khóa và payload trả lại đơn đã tạo. Cùng khóa với payload khác trả `409`. Frontend giữ khóa khi kết quả chưa xác định để có thể gửi lại cùng yêu cầu. Nếu dùng CORS, cấu hình cho phép header này và `Content-Type`.
- `POST /payments/initiate` trả `{"status":"PENDING","paymentUrl":"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."}` khi có thể chuyển hướng, hoặc `{"status":"UNAVAILABLE"}` khi chưa cấu hình. Việc khởi tạo hoặc mở URL chưa xác nhận giao dịch. Khi thử lại, frontend gửi cùng `orderId` và `provider`. Backend chịu trách nhiệm tránh giao dịch thanh toán trùng và xác nhận trạng thái qua callback đã kiểm tra chữ ký.

## Chat

`POST /ai/chat` trả `{ "reply": "...", "provider": "gemini" }` khi Spring Boot thực sự gọi Gemini. Dùng `provider: "demo"` cho phản hồi minh họa do backend cung cấp.

## Lỗi HTTP

- `400` hoặc `422` dùng cho lỗi validation. Có thể trả `{ "fieldErrors": { "recipientEmail": "Email chưa hợp lệ." } }` để gắn lỗi vào trường tương ứng.
- `401` yêu cầu đăng nhập, `403` báo thiếu quyền, `404` báo tài nguyên không tồn tại, `409` báo xung đột và `500` báo sự cố hệ thống. API thật trả lỗi hoặc danh sách rỗng đúng trạng thái. Giao diện chỉ dùng dữ liệu demo khi chế độ demo được bật.

## Quy tắc tích hợp

1. Giá, tồn kho và tổng tiền phải được backend tính/kiểm tra lại; không tin dữ liệu gửi từ trình duyệt.
2. `VITE_API_BASE_URL` chỉ chứa URL công khai của API. Không đưa Gemini API Key hoặc thông tin cổng thanh toán vào front-end.
3. Gemini API chỉ được gọi từ Spring Boot. Backend truy vấn danh mục/sản phẩm hợp lệ làm ngữ cảnh, giới hạn dữ liệu cá nhân và ghi lịch sử vào `ai_consultations` nếu phù hợp.
4. VNPay chỉ được bật sau khi cấu hình sandbox ở backend. Chữ ký callback phải được xác minh tại server.
5. Các endpoint `/admin/**` phải yêu cầu xác thực và role `ADMIN` ở Spring Security.

## Lưu ý khớp lược đồ Chương 3

Lược đồ hiện tại mô tả tối thiểu `products` gồm `category_id`, `name`, `sku`, `price`, `stock_qty`, `description`. Giao diện cần thêm dữ liệu thương hiệu, URL ảnh và thông số kỹ thuật; có thể mở rộng `products` hoặc tạo các bảng `brands`, `product_images`, `product_specs` ở giai đoạn thiết kế CSDL tiếp theo. Trạng thái voucher, email người nhận, ghi chú và phương thức thanh toán cũng cần mô hình hóa nếu muốn lưu bền vững.
