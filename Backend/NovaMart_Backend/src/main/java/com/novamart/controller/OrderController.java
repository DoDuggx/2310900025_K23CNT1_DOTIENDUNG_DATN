package com.novamart.controller;

import com.novamart.dto.OrderDtos.CreateOrderRequest;
import com.novamart.dto.OrderDtos.OrderResponse;
import com.novamart.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse create(
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @Valid @RequestBody CreateOrderRequest request
    ) {
        return orderService.create(request, idempotencyKey);
    }

    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable Long id) {
        return orderService.getById(id);
    }
}