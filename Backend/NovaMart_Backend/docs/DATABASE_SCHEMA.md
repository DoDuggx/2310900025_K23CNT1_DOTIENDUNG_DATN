# Mô hình dữ liệu Backend NovaMart

Hibernate ánh xạ các Entity sang bảng MySQL khi ứng dụng khởi động. Database mặc định: novamart_db. Seed mặc định gồm 10 danh mục, 14 sản phẩm, 11 tài khoản (1 Admin + 10 khách hàng demo) và 2 voucher.

## Danh sách bảng

| Bảng | Mục đích | Khóa chính | Quan hệ chính |
|---|---|---|---|
| users | Tài khoản và vai trò | id | 1-N với carts, ai_consultations |
| categories | Danh mục thiết bị | id dạng chuỗi | 1-N với products |
| products | Thông tin sản phẩm, giá và tồn kho | id | N-1 categories; 1-N cart_items, order_items |
| carts | Giỏ hàng theo người dùng | id | N-1 users; 1-N cart_items |
| cart_items | Chi tiết sản phẩm trong giỏ | id | N-1 carts, products |
| orders | Thông tin đơn hàng | id | 1-N order_items, payments |
| order_items | Chi tiết sản phẩm của đơn hàng | id | N-1 orders, products |
| payments | Giao dịch và trạng thái thanh toán | id | N-1 orders |
| ai_consultations | Lịch sử câu hỏi và phản hồi AI | id | N-1 users (nullable với khách vãng lai) |
| vouchers | Mã giảm giá | id | Được tham chiếu bằng voucher_code trong orders |

## Quan hệ

- categories (1) — (N) products
- users (1) — (N) carts
- carts (1) — (N) cart_items
- products (1) — (N) cart_items
- orders (1) — (N) order_items
- products (1) — (N) order_items
- orders (1) — (N) payments
- users (1) — (N) ai_consultations

## Ràng buộc và quy tắc nghiệp vụ

- users.email và products.sku/products.slug là duy nhất.
- categories.id sử dụng slug cố định laptop, phone, audio, monitor, accessory, wearable để đồng bộ với Front-end.
- products.price và products.stock_qty được kiểm tra ở Backend; trình duyệt không được quyết định giá cuối cùng.
- orders.idempotency_key duy nhất để chống tạo đơn trùng khi Front-end gửi lại request.
- order_items lưu product_name và unit_price tại thời điểm mua để bảo toàn lịch sử khi giá sản phẩm thay đổi.
- carts và cart_items đã có Entity để khớp thiết kế dữ liệu; phiên bản Front-end hiện vẫn giữ giỏ hàng ở Zustand/localStorage, chưa đồng bộ giỏ hàng lên các bảng này.
- ai_consultations lưu message, response và provider; chat khách vãng lai được lưu với user_id để trống.
- vouchers lưu phần trăm giảm, giá trị giảm tối đa, giá trị đơn tối thiểu và trạng thái hoạt động.

## Lưu ý khi đối chiếu ERD Chương 3

Đây là cấu trúc Entity hiện được bổ sung trong mã nguồn Backend. Nếu ERD đã được giảng viên duyệt có thêm/bớt thuộc tính hoặc quan hệ, cần đối chiếu và điều chỉnh Entity trước khi chốt báo cáo. Không tự ý ghi rằng giỏ hàng đã đồng bộ vào MySQL khi Front-end vẫn đang lưu localStorage.
