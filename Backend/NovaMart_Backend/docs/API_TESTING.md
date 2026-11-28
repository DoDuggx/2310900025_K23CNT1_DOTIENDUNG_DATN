# Kiểm thử API NovaMart (local)

Base URL: http://localhost:8080/api/v1

Các ví dụ dưới đây dùng PowerShell. Thay ID sản phẩm/đơn hàng theo dữ liệu API trả về.

## 1. Kiểm tra danh mục và sản phẩm

    Invoke-RestMethod "http://localhost:8080/api/v1/categories"
    Invoke-RestMethod "http://localhost:8080/api/v1/products?page=0&size=8"
    Invoke-RestMethod "http://localhost:8080/api/v1/products?keyword=Apple&categoryId=phone&page=0&size=8"

Kết quả mong đợi: HTTP 200; danh sách có content, totalElements, totalPages, number, size.

## 2. Đăng nhập Admin và kiểm tra JWT

    $login = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/auth/login" -ContentType "application/json" -Body '{"email":"admin@novamart.local","password":"Admin@12345"}'
    $token = $login.token
    $headers = @{ Authorization = "Bearer $token" }
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/products" -Headers $headers

Kết quả mong đợi: đăng nhập trả token; request Admin có token role ADMIN trả HTTP 200. Không có token hoặc dùng token USER phải bị từ chối.

## 3. Tạo đơn hàng

    $headers = @{ "Content-Type" = "application/json"; "Idempotency-Key" = "novamart-test-order-0001" }
    $body = @{
      recipientName = "Khach Demo"
      recipientPhone = "0901234567"
      recipientEmail = "customer@example.test"
      shippingAddress = "123 Nguyen Trai, Ha Noi"
      note = "Giao gio hanh chinh"
      items = @(@{ productId = 1; quantity = 1 })
      paymentMethod = "COD"
      voucherCode = "NOVA10"
    } | ConvertTo-Json -Depth 5
    $order = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/orders" -Headers $headers -Body $body
    $order

Kết quả mong đợi: API trả mã đơn, tổng tiền được tính ở Backend. Gửi lại cùng header và cùng payload sẽ trả lại đơn đã tạo; cùng key nhưng payload khác trả HTTP 409.

## 4. Giả lập thanh toán

    $paymentBody = @{ orderId = $order.id; result = "SUCCESS" } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/payments/simulate" -ContentType "application/json" -Body $paymentBody

Đổi SUCCESS thành FAILED để kiểm tra nhánh thất bại. Đây là cơ chế giả lập cho đồ án, không phải giao dịch tiền thật.

## 5. Kiểm tra chatbot

    Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/ai/chat" -ContentType "application/json" -Body '{"message":"Tư vấn laptop để lập trình dưới 30 triệu"}'

Kết quả mong đợi: có reply và provider. Nếu chưa cấu hình Gemini key, provider=demo; chỉ ghi nhận Gemini thật khi provider=gemini.

## 6. Gợi ý Test Case cho Mục 4.3

| ID | Mô tả | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| TC-AUTH-01 | Đăng nhập đúng | admin@novamart.local / Admin@12345 | HTTP 200, trả JWT và role ADMIN |
| TC-AUTH-02 | Đăng nhập sai mật khẩu | Email đúng, mật khẩu sai | HTTP 401, không cấp token |
| TC-ORD-01 | Đặt hàng đủ tồn kho | Product ID hợp lệ, quantity 1 | HTTP 200, lưu đơn và trừ tồn kho |
| TC-ORD-02 | Đặt hàng vượt tồn kho | Quantity lớn hơn stockQty | HTTP 422, không tạo đơn |
| TC-ORD-03 | Gửi lại cùng Idempotency-Key | Cùng key và payload | Trả lại cùng mã đơn, không tạo đơn trùng |
| TC-PAY-01 | Giả lập thanh toán thành công | orderId hợp lệ, result SUCCESS | Payment SUCCESS, đơn chuyển PROCESSING |
| TC-AI-01 | Hỏi trợ lý | message có nội dung | Trả reply, provider demo hoặc gemini đúng trạng thái |

Cột Trạng thái thực tế (Pass/Fail) chỉ điền sau khi chạy test trên máy và ghi nhận kết quả thật.
