package com.novamart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class PaymentDtos {
    private PaymentDtos() {}

    public record PaymentInitRequest(@NotNull Long orderId, @NotBlank String provider) {}
    public record PaymentResponse(String status, String paymentUrl, String message) {}
    public record SimulatePaymentRequest(@NotNull Long orderId, @NotBlank String result) {}
}