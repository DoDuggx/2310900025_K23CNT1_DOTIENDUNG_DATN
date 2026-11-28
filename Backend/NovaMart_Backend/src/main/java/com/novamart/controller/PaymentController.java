package com.novamart.controller;

import com.novamart.dto.PaymentDtos.PaymentInitRequest;
import com.novamart.dto.PaymentDtos.PaymentResponse;
import com.novamart.dto.PaymentDtos.SimulatePaymentRequest;
import com.novamart.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/initiate")
    public PaymentResponse initiate(@Valid @RequestBody PaymentInitRequest request) {
        return paymentService.initiate(request);
    }

    @PostMapping("/simulate")
    public PaymentResponse simulate(@Valid @RequestBody SimulatePaymentRequest request) {
        return paymentService.simulate(request);
    }
}