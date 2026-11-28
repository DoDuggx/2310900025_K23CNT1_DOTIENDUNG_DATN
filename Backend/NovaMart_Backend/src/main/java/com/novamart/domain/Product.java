package com.novamart.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(nullable = false, length = 180)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 100)
    private String brand;

    @Column(nullable = false, unique = true, length = 80)
    private String sku;

    @Column(nullable = false)
    private Long price;

    private Long oldPrice;

    @Column(nullable = false)
    private Integer stockQty = 0;

    @Column(length = 1000)
    private String image;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 60)
    private String badge;

    private Double rating = 0.0;
    private Integer reviewCount = 0;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (active == null) active = true;
        if (stockQty == null) stockQty = 0;
        if (rating == null) rating = 0.0;
        if (reviewCount == null) reviewCount = 0;
    }
}