# NovaMart Backend

Backend REST API cho đồ án tốt nghiệp NovaMart, xây dựng bằng Java 21 và Spring Boot 3.5.7.

## Công nghệ

- Java 21, Spring Boot 3.5.7
- Spring Web, Spring Data JPA, Hibernate
- MySQL 8.x
- Spring Security, BCrypt, JWT (JJWT 0.12.6)
- Jakarta Validation
- Google Gemini API qua REST Client
- Lombok

## Cấu trúc chính

    src/main/java/com/novamart/
    ├── config/       # Security, CORS và dữ liệu khởi tạo
    ├── controller/   # REST Controller
    ├── domain/       # Entity ánh xạ bảng MySQL
    ├── dto/          # Request / Response DTO
    ├── exception/    # Xử lý lỗi API
    ├── repository/   # Spring Data JPA
    ├── security/     # JWT filter và JWT service
    └── service/      # Nghiệp vụ

## 1. Chuẩn bị MySQL

Khởi động MySQL Server. Có thể tạo database trước bằng MySQL Workbench:

    CREATE DATABASE novamart_db
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;

Mặc định ứng dụng dùng:
- Host: localhost:3306
- Database: novamart_db
- Username: root
- Password: để trống

Nếu máy của bạn dùng mật khẩu MySQL khác, cấu hình biến môi trường DB_PASSWORD. Không đưa mật khẩu thật lên GitHub.

Các bảng được Hibernate tạo/cập nhật từ Entity khi ứng dụng chạy lần đầu (spring.jpa.hibernate.ddl-auto=update). Các bảng gồm users, categories, products, carts, cart_items, orders, order_items, payments, ai_consultations và vouchers. Quan hệ dữ liệu được mô tả tại docs/DATABASE_SCHEMA.md. Dữ liệu mẫu được nạp tự động khi SEED_ENABLED=true.

## 2. Chạy Backend

Yêu cầu JDK 21 và Maven 3.9+.

Mở terminal tại thư mục Backend/NovaMart_Backend, chạy:

    mvn spring-boot:run

Hoặc mở project Maven trong IntelliJ IDEA / VS Code (Extension Pack for Java và Maven for Java), sau đó chạy NovaMartApplication.java.

Backend mặc định chạy tại http://localhost:8080; API prefix là /api/v1.

## 3. Tài khoản và dữ liệu mẫu

Khi seed được bật, hệ thống tạo:
- 6 danh mục: laptop, phone, audio, monitor, accessory, wearable.
- 10 sản phẩm công nghệ mẫu.
- 1 tài khoản Admin và 10 tài khoản khách hàng demo.
- 2 voucher: NOVA10 (giảm 10%, tối đa 1.000.000đ) và TECH5 (giảm 5%, tối đa 500.000đ).

Tài khoản thử nghiệm local:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| ADMIN | admin@novamart.local | Admin@12345 |
| USER | customer01@novamart.local | Customer@12345 |

Các tài khoản customer02 đến customer10 dùng cùng mật khẩu Customer@12345.

**Lưu ý:** Đây là tài khoản demo cho môi trường phát triển. Hãy đổi mật khẩu, JWT secret và tắt seed trước khi triển khai thật.

## 4. Cấu hình Gemini

Gemini API Key chỉ được đặt ở backend, tuyệt đối không đặt trong biến VITE_*.

Thiết lập biến môi trường:
- GEMINI_API_KEY: API key được cấp từ Google AI Studio.
- GEMINI_MODEL: mặc định gemini-2.5-flash.

Nếu chưa có key, endpoint chat trả phản hồi provider=demo; khi key hợp lệ và gọi Gemini thành công, phản hồi là provider=gemini. Hội thoại được lưu trong bảng ai_consultations.

## 5. Cấu hình Front-end

Trong file Frontend/NovaMart_Frontend/.env:

    VITE_API_BASE_URL=http://localhost:8080/api/v1
    VITE_DEMO_MODE=false

Khởi động lại Vite sau khi sửa biến môi trường. Không đặt DB password, JWT secret hoặc Gemini API key vào Front-end.

## 6. API chính

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | /api/v1/auth/register | Đăng ký |
| POST | /api/v1/auth/login | Đăng nhập, cấp JWT |
| GET | /api/v1/categories | Danh sách danh mục |
| GET | /api/v1/products | Tìm kiếm, lọc, phân trang sản phẩm |
| GET | /api/v1/products/{id} | Chi tiết theo ID |
| GET | /api/v1/products/by-slug/{slug} | Chi tiết theo slug |
| POST | /api/v1/orders | Tạo đơn hàng, kiểm tra tồn kho và voucher |
| GET | /api/v1/orders/{id} | Tra cứu đơn hàng |
| POST | /api/v1/payments/initiate | Khởi tạo thanh toán |
| POST | /api/v1/payments/simulate | Giả lập SUCCESS / FAILED trong môi trường dev |
| POST | /api/v1/ai/chat | Chat với Gemini hoặc chế độ demo |
| GET/POST/PUT/DELETE | /api/v1/admin/products | Quản trị sản phẩm, yêu cầu JWT role ADMIN |
| GET | /api/v1/admin/orders | Xem đơn hàng, yêu cầu JWT role ADMIN |
| PATCH | /api/v1/admin/orders/{id}/status | Cập nhật trạng thái đơn, yêu cầu JWT role ADMIN |

Xem ví dụ request trong docs/API_TESTING.md.

## 7. Phạm vi và giới hạn hiện tại

- Đăng ký/đăng nhập JWT, catalog, tạo đơn, kiểm tra tồn kho có khóa bản ghi, voucher, lưu lịch sử chat AI và thanh toán giả lập đã có mã nguồn nền tảng.
- Gemini API thật chỉ hoạt động khi cấu hình GEMINI_API_KEY hợp lệ; nếu không, API trả provider=demo.
- VNPay Sandbox thật chưa được tích hợp chữ ký và callback; API hiện trả UNAVAILABLE để tránh giả nhận thanh toán thật.
- Các endpoint Admin đã được bảo vệ bằng role ADMIN. Giao diện đăng nhập và kết nối màn hình Admin với token cần hoàn thiện ở bước tích hợp Front-end.
- Giỏ hàng Front-end hiện vẫn lưu trong Zustand/localStorage; bảng carts và cart_items đã được khai báo theo thiết kế nhưng chưa có API đồng bộ giỏ hàng.
- Trước khi nộp, cần chạy ứng dụng trên máy cá nhân, kiểm tra kết nối MySQL và chụp ảnh minh chứng thực tế. Không ghi chức năng là Pass nếu chưa chạy kiểm thử.
