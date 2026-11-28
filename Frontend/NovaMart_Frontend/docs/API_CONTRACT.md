# API contract NovaMart Front-end ↔ Spring Boot

Base URL: http://localhost:8080/api/v1

## Endpoints hiện có

| Method | Endpoint | Mục đích | Bảo vệ |
|---|---|---|---|
| POST | /auth/register | Đăng ký tài khoản USER | Public |
| POST | /auth/login | Đăng nhập, cấp JWT | Public |
| GET | /categories | Danh sách danh mục | Public |
| GET | /products | Danh sách, tìm kiếm, lọc, phân trang | Public |
| GET | /products/{id} | Chi tiết theo ID | Public |
| GET | /products/by-slug/{slug} | Chi tiết theo slug | Public |
| POST | /orders | Tạo đơn hàng, kiểm tra kho và voucher | Public checkout |
| GET | /orders/{id} | Tra cứu đơn hàng | Public demo |
| POST | /payments/initiate | Khởi tạo thanh toán | Public |
| POST | /payments/simulate | Giả lập SUCCESS / FAILED | Chỉ bật ở môi trường phát triển |
| POST | /ai/chat | Tư vấn sản phẩm bằng Gemini hoặc demo | Public |
| GET | /admin/products | Danh sách sản phẩm quản trị | JWT + ADMIN |
| POST | /admin/products | Thêm sản phẩm | JWT + ADMIN |
| PUT | /admin/products/{id} | Cập nhật sản phẩm | JWT + ADMIN |
| DELETE | /admin/products/{id} | Ngừng bán sản phẩm | JWT + ADMIN |
| GET | /admin/orders | Danh sách đơn hàng | JWT + ADMIN |
| PATCH | /admin/orders/{id}/status | Cập nhật trạng thái đơn | JWT + ADMIN |

## Catalog

- GET /categories trả mảng CategoryResponse gồm id, name và count. ID danh mục dùng các giá trị laptop, phone, audio, monitor, accessory, wearable để khớp dữ liệu Front-end.
- GET /products nhận keyword, categoryId, brand, minPrice, maxPrice, page, size và nhiều sort dạng field,asc hoặc field,desc.
- page bắt đầu từ 0; size mặc định 8 và tối đa 50.
- Kết quả phân trang là Page JSON gồm content, totalElements, totalPages, number và size.
- Các trường ProductResponse gồm id, slug, name, categoryId, brand, sku, price (VND), oldPrice, stockQty, image, gallery, description, badge, rating, reviewCount, specs và createdAt.
- GET /products/{id} và GET /products/by-slug/{slug} trả cùng cấu trúc DTO; 404 nếu không tồn tại.

## Authentication

Đăng ký:
    
    POST /auth/register
    {
      "fullName": "Khach Hang",
      "email": "customer@example.test",
      "password": "Customer@12345",
      "phone": "0901234567"
    }

Đăng nhập:

    POST /auth/login
    {
      "email": "admin@novamart.local",
      "password": "Admin@12345"
    }

Response trả token, tokenType, expiresIn và user. Gọi endpoint Admin bằng header:

    Authorization: Bearer <JWT>

Role được cấp từ dữ liệu tài khoản trong database; mật khẩu được lưu bằng BCrypt.

## Đơn hàng

POST /orders yêu cầu header Idempotency-Key. Payload:

    {
      "recipientName": "Khách Demo",
      "recipientPhone": "0901234567",
      "recipientEmail": "customer@example.test",
      "shippingAddress": "123 Đường Ví Dụ, Hà Nội",
      "note": "",
      "items": [{ "productId": 1, "quantity": 1 }],
      "paymentMethod": "COD",
      "voucherCode": "NOVA10"
    }

Backend tự đọc giá và tồn kho từ database, kiểm tra số lượng, tính subtotal, discount, shippingFee và totalAmount. Không tin giá do trình duyệt gửi lên. Phí giao hàng hiện là 30.000đ nếu subtotal dưới 2.000.000đ; miễn phí từ 2.000.000đ. Voucher seed: NOVA10 và TECH5.

Cùng Idempotency-Key và cùng payload trả lại đơn đã tạo; cùng key nhưng payload khác trả HTTP 409.

Phương thức thanh toán được chấp nhận khi tạo đơn: COD, BANK_TRANSFER, VNPAY.

## Payment

POST /payments/initiate nhận:

    { "orderId": 1, "provider": "VNPAY_SANDBOX" }

Hiện VNPay Sandbox thật chưa được cấu hình chữ ký và callback; endpoint trả status UNAVAILABLE, không giả nhận giao dịch.

Để kiểm thử luồng thành công/thất bại, gọi:

    POST /payments/initiate
    { "orderId": 1, "provider": "SIMULATED" }

Sau đó gọi:

    POST /payments/simulate
    { "orderId": 1, "result": "SUCCESS" }

Đổi result thành FAILED để kiểm tra nhánh thất bại. Đây chỉ là cơ chế giả lập phục vụ kiểm thử đồ án.

## AI Chat

POST /ai/chat nhận:

    { "message": "Tư vấn laptop để lập trình dưới 30 triệu" }

Trả reply và provider. provider=gemini chỉ khi backend đã cấu hình GEMINI_API_KEY và gọi Gemini thành công. Nếu chưa có key, API trả provider=demo. API key chỉ được lưu ở backend.

## HTTP errors

- 400: JSON hoặc tham số không hợp lệ.
- 401: chưa xác thực hoặc thông tin đăng nhập không đúng.
- 403: tài khoản không có role ADMIN.
- 404: không tìm thấy sản phẩm/đơn hàng.
- 409: SKU/email trùng hoặc Idempotency-Key xung đột.
- 422: tồn kho không đủ hoặc voucher không hợp lệ.
- 500: lỗi hệ thống.

## Lưu ý tích hợp

1. Trong Front-end, đặt VITE_API_BASE_URL=http://localhost:8080/api/v1 và VITE_DEMO_MODE=false trong file .env.
2. Khởi động lại Vite sau khi đổi biến môi trường.
3. Backend cho phép CORS mặc định từ http://localhost:5173.
4. Front-end hiện đã có service gọi catalog, orders và AI. Giao diện đăng nhập và kết nối Admin page với JWT cần được hoàn thiện tiếp.
5. Không đưa DB password, JWT secret, Gemini API key hoặc thông tin thanh toán vào biến VITE_*.
