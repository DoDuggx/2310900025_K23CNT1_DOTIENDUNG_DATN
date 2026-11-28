package com.novamart.service;

import com.novamart.domain.Payment;
import com.novamart.domain.PurchaseOrder;
import com.novamart.dto.PaymentDtos.PaymentInitRequest;
import com.novamart.dto.PaymentDtos.PaymentResponse;
import com.novamart.dto.PaymentDtos.SimulatePaymentRequest;
import com.novamart.exception.ApiException;
import com.novamart.repository.OrderRepository;
import com.novamart.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final boolean simulationEnabled;

    public PaymentService(
        OrderRepository orderRepository,
        PaymentRepository paymentRepository,
        @Value("${app.payments.simulation-enabled:true}") boolean simulationEnabled
    ) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.simulationEnabled = simulationEnabled;
    }

    @Transactional
    public PaymentResponse initiate(PaymentInitRequest request) {
        PurchaseOrder order = orderRepository.findById(request.orderId())
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy đơn hàng."));
        String provider = request.provider().trim().toUpperCase();
        if ("SIMULATED".equals(provider)) {
            if (!simulationEnabled) throw ApiException.badRequest("Chế độ thanh toán giả lập đang tắt.");
            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setProvider("SIMULATED");
            payment.setStatus("PENDING");
            payment.setAmount(order.getTotalAmount());
            paymentRepository.save(payment);
            return new PaymentResponse("PENDING", null,
                "Đã tạo giao dịch giả lập. Gọi POST /api/v1/payments/simulate để chọn SUCCESS hoặc FAILED.");
        }
        if ("VNPAY_SANDBOX".equals(provider)) {
            return new PaymentResponse("UNAVAILABLE", null,
                "Chưa cấu hình thông tin VNPay Sandbox ở máy chủ. Chưa phát sinh giao dịch.");
        }
        throw ApiException.badRequest("Nhà cung cấp thanh toán không được hỗ trợ.");
    }

    @Transactional
    public PaymentResponse simulate(SimulatePaymentRequest request) {
        if (!simulationEnabled) throw ApiException.badRequest("Chế độ thanh toán giả lập đang tắt.");
        PurchaseOrder order = orderRepository.findById(request.orderId())
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy đơn hàng."));
        String result = request.result().trim().toUpperCase();
        if (!java.util.Set.of("SUCCESS", "FAILED").contains(result)) {
            throw ApiException.badRequest("Kết quả giả lập chỉ nhận SUCCESS hoặc FAILED.");
        }

        Payment payment = paymentRepository.findByOrder_IdOrderByCreatedAtDesc(order.getId()).stream()
            .findFirst().orElseGet(Payment::new);
        payment.setOrder(order);
        if (payment.getProvider() == null) payment.setProvider("SIMULATED");
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(result);
        payment.setTransactionRef("SIM-" + order.getOrderCode());
        paymentRepository.save(payment);

        order.setPaymentStatus(result);
        if ("SUCCESS".equals(result)) order.setStatus("PROCESSING");
        orderRepository.save(order);
        return new PaymentResponse(result, null, "Đã cập nhật trạng thái thanh toán giả lập.");
    }
}