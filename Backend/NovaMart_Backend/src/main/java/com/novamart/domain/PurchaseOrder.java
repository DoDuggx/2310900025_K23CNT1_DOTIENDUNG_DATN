package com.novamart.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String orderCode;

    @Column(unique = true, length = 80)
    private String idempotencyKey;

    @Column(length = 1000)
    private String requestFingerprint;

    @Column(nullable = false, length = 120)
    private String recipientName;

    @Column(nullable = false, length = 20)
    private String recipientPhone;

    @Column(nullable = false, length = 160)
    private String recipientEmail;

    @Column(nullable = false, length = 500)
    private String shippingAddress;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, length = 30)
    private String paymentMethod;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false, length = 30)
    private String paymentStatus;

    @Column(nullable = false)
    private Long subtotal;

    @Column(nullable = false)
    private Long discountAmount;

    @Column(nullable = false)
    private Long shippingFee;

    @Column(nullable = false)
    private Long totalAmount;

    @Column(length = 40)
    private String voucherCode;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}