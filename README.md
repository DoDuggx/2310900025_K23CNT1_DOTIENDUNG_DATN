# Đồ án tốt nghiệp – NovaMart

Website kinh doanh thiết bị công nghệ tích hợp AI tư vấn sản phẩm và thanh toán trực tuyến.

## Cấu trúc repository

- Frontend/NovaMart_Frontend: giao diện React 19 + Vite 6.
- Backend/NovaMart_Backend: REST API Java 21 + Spring Boot 3.5.7 + MySQL.
- Backend/NovaMart_Backend/docs/API_TESTING.md: hướng dẫn kiểm thử API bằng PowerShell.

## Chạy Front-end

1. Mở thư mục Frontend/NovaMart_Frontend trong VS Code.
2. Chạy npm install.
3. Sao chép .env.example thành .env.
4. Chạy npm run dev.
5. Mặc định giao diện dùng chế độ demo. Khi backend đã chạy, sửa .env thành:

    VITE_API_BASE_URL=http://localhost:8080/api/v1
    VITE_DEMO_MODE=false

## Chạy Back-end

Yêu cầu JDK 21, Maven 3.9+ và MySQL 8.x.

1. Tạo database novamart_db hoặc cấp quyền để ứng dụng tự tạo database.
2. Mở terminal tại Backend/NovaMart_Backend.
3. Cấu hình DB_PASSWORD nếu MySQL có mật khẩu.
4. Chạy mvn spring-boot:run.
5. API chạy tại http://localhost:8080/api/v1.

Chi tiết tài khoản demo, biến môi trường, API và kiểm thử nằm trong Backend/NovaMart_Backend/README.md.

## Công nghệ

- Front-end: React 19, Vite 6, React Router, Zustand, CSS3.
- Back-end: Java 21, Spring Boot 3.5.7, Spring Web, Spring Data JPA, Spring Security, JWT.
- Database: MySQL 8.x.
- AI: Google Gemini API (chỉ gọi thật khi cấu hình GEMINI_API_KEY ở backend).
- Thanh toán: cơ chế giả lập SUCCESS/FAILED; VNPay Sandbox thật chưa được tích hợp chữ ký và callback.

## Trạng thái triển khai

Front-end đã có giao diện cửa hàng, danh mục, chi tiết sản phẩm, giỏ hàng, checkout, chatbot và admin demo. Backend có mã nguồn nền tảng cho đăng ký/đăng nhập JWT, danh mục/sản phẩm, tạo đơn, kiểm tra tồn kho, voucher, admin API, Gemini API và thanh toán giả lập.

**Lưu ý:** Mã nguồn Backend vừa được bổ sung vào repository nhưng cần được chạy và kiểm thử trên máy cá nhân trước khi ghi nhận Pass hoặc mô tả là đã vận hành hoàn chỉnh. Không đưa file .env, mật khẩu database, JWT secret hoặc Gemini API key lên GitHub.
