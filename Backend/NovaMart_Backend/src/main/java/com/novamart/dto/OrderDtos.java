package com.novamart.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    public record OrderLineRequest(
        @NotNull Long productId,
        @NotNull @Min(1) Integer quantity
    ) {}

    public record CreateOrderRequest(
        @NotBlank @Size(min = 2, max = 120) String recipientName,
        @NotBlank @Size(max = 20) String recipientPhone,
        @NotBlank @Email @Size(max = 160) String recipientEmail,
        @NotBlank @Size(min = 8, max = 500) String shippingAddress,
        @Size(max = 1000) String note,
        @NotEmpty List<@Valid OrderLineRequest> items,
        @NotBlank String paymentMethod,
        String voucherCode
    ) {}

    public record OrderResponse(
        Long id,
        String orderCode,
        String status,
        String paymentStatus,
        Long subtotal,
        Long discountAmount,
        Long shippingFee,
        Long totalAmount,
        LocalDateTime createdAt
    ) {}

    public record UpdateOrderStatusRequest(@NotBlank String status) {}
}