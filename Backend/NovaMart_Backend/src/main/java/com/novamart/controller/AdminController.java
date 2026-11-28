package com.novamart.controller;

import com.novamart.dto.CatalogDtos.ProductRequest;
import com.novamart.dto.CatalogDtos.ProductResponse;
import com.novamart.dto.OrderDtos.OrderResponse;
import com.novamart.dto.OrderDtos.UpdateOrderStatusRequest;
import com.novamart.service.CatalogService;
import com.novamart.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final CatalogService catalogService;
    private final OrderService orderService;

    public AdminController(CatalogService catalogService, OrderService orderService) {
        this.catalogService = catalogService;
        this.orderService = orderService;
    }

    @GetMapping("/products")
    public List<ProductResponse> products() {
        return catalogService.getAllForAdmin();
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
        return catalogService.create(request);
    }

    @PutMapping("/products/{id}")
    public ProductResponse updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return catalogService.update(id, request);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        catalogService.deactivate(id);
    }

    @GetMapping("/orders")
    public List<OrderResponse> orders() {
        return orderService.getAll();
    }

    @PatchMapping("/orders/{id}/status")
    public OrderResponse updateOrderStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return orderService.updateStatus(id, request.status());
    }
}