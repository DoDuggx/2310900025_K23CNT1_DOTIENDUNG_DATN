package com.novamart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class CatalogDtos {
    private CatalogDtos() {}

    public record CategoryResponse(String id, String name, long count) {}

    public record ProductResponse(
        Long id,
        String slug,
        String name,
        String categoryId,
        String brand,
        String sku,
        Long price,
        Long oldPrice,
        Integer stockQty,
        String image,
        List<String> gallery,
        String description,
        String badge,
        Double rating,
        Integer reviewCount,
        Map<String, String> specs,
        LocalDateTime createdAt
    ) {}

    public record ProductRequest(
        @NotBlank String name,
        String slug,
        @NotBlank String categoryId,
        @NotBlank String brand,
        @NotBlank String sku,
        @NotNull @Positive Long price,
        Long oldPrice,
        @NotNull @PositiveOrZero Integer stockQty,
        String image,
        String description,
        String badge,
        Double rating,
        Integer reviewCount
    ) {}
}