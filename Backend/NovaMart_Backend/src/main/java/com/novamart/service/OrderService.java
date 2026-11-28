package com.novamart.service;

import com.novamart.domain.OrderItem;
import com.novamart.domain.Product;
import com.novamart.domain.PurchaseOrder;
import com.novamart.domain.Voucher;
import com.novamart.dto.OrderDtos.CreateOrderRequest;
import com.novamart.dto.OrderDtos.OrderLineRequest;
import com.novamart.dto.OrderDtos.OrderResponse;
import com.novamart.exception.ApiException;
import com.novamart.repository.OrderRepository;
import com.novamart.repository.ProductRepository;
import com.novamart.repository.VoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final VoucherRepository voucherRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository, VoucherRepository voucherRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.voucherRepository = voucherRepository;
    }

    @Transactional
    public OrderResponse create(CreateOrderRequest request, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw ApiException.badRequest("Thiếu header Idempotency-Key.");
        }
        String fingerprint = fingerprint(request);
        var previous = orderRepository.findByIdempotencyKey(idempotencyKey);
        if (previous.isPresent()) {
            if (!fingerprint.equals(previous.get().getRequestFingerprint())) {
                throw ApiException.conflict("Idempotency-Key đã được sử dụng cho một nội dung đơn hàng khác.");
            }
            return toResponse(previous.get());
        }

        String paymentMethod = request.paymentMethod().trim().toUpperCase();
        if (!java.util.Set.of("COD", "BANK_TRANSFER", "VNPAY").contains(paymentMethod)) {
            throw ApiException.unprocessable("Phương thức thanh toán không được hỗ trợ.");
        }

        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (OrderLineRequest line : request.items()) {
            quantities.merge(line.productId(), line.quantity(), Integer::sum);
        }

        Map<Product, Integer> selectedProducts = new LinkedHashMap<>();
        long subtotal = 0L;
        for (var entry : quantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                .filter(Product::getActive)
                .orElseThrow(() -> ApiException.notFound("Một sản phẩm trong giỏ hàng không còn tồn tại."));
            int quantity = entry.getValue();
            if (product.getStockQty() < quantity) {
                throw ApiException.unprocessable("Sản phẩm " + product.getName() + " không đủ số lượng tồn kho.");
            }
            product.setStockQty(product.getStockQty() - quantity);
            selectedProducts.put(product, quantity);
            subtotal = Math.addExact(subtotal, Math.multiplyExact(product.getPrice(), (long) quantity));
        }

        long discount = 0L;
        String voucherCode = request.voucherCode() == null ? null : request.voucherCode().trim().toUpperCase();
        if (voucherCode != null && !voucherCode.isBlank()) {
            Voucher voucher = voucherRepository.findByCodeIgnoreCaseAndActiveTrue(voucherCode)
                .orElseThrow(() -> ApiException.unprocessable("Mã giảm giá không hợp lệ hoặc đã hết hạn."));
            if (subtotal < voucher.getMinOrderAmount()) {
                throw ApiException.unprocessable("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã.");
            }
            discount = Math.round(subtotal * voucher.getDiscountPercent() / 100.0);
            discount = Math.min(discount, voucher.getMaxDiscount());
        }

        long shippingFee = subtotal == 0 || subtotal >= 2_000_000L ? 0L : 30_000L;
        long total = Math.max(0L, subtotal - discount + shippingFee);

        PurchaseOrder order = new PurchaseOrder();
        order.setOrderCode("NM" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"))
            + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        order.setIdempotencyKey(idempotencyKey);
        order.setRequestFingerprint(fingerprint);
        order.setRecipientName(request.recipientName().trim());
        order.setRecipientPhone(request.recipientPhone().trim());
        order.setRecipientEmail(request.recipientEmail().trim().toLowerCase());
        order.setShippingAddress(request.shippingAddress().trim());
        order.setNote(request.note());
        order.setPaymentMethod(paymentMethod);
        order.setStatus("NEW");
        order.setPaymentStatus("UNPAID");
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discount);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(total);
        order.setVoucherCode(voucherCode);

        for (var entry : selectedProducts.entrySet()) {
            Product product = entry.getKey();
            int quantity = entry.getValue();
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setUnitPrice(product.getPrice());
            item.setQuantity(quantity);
            item.setLineTotal(product.getPrice() * quantity);
            order.getItems().add(item);
            productRepository.save(product);
        }
        return toResponse(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public OrderResponse getById(Long id) {
        PurchaseOrder order = orderRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy đơn hàng."));
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public java.util.List<OrderResponse> getAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public OrderResponse updateStatus(Long id, String status) {
        PurchaseOrder order = orderRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy đơn hàng."));
        String normalized = status.trim().toUpperCase();
        if (!java.util.Set.of("NEW", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED").contains(normalized)) {
            throw ApiException.badRequest("Trạng thái đơn hàng không hợp lệ.");
        }
        order.setStatus(normalized);
        return toResponse(orderRepository.save(order));
    }

    private OrderResponse toResponse(PurchaseOrder order) {
        return new OrderResponse(order.getId(), order.getOrderCode(), order.getStatus(),
            order.getPaymentStatus(), order.getSubtotal(), order.getDiscountAmount(),
            order.getShippingFee(), order.getTotalAmount(), order.getCreatedAt());
    }

    private String fingerprint(CreateOrderRequest request) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(request.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể tạo mã kiểm tra yêu cầu.", ex);
        }
    }
}