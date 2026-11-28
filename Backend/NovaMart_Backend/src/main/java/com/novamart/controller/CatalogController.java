package com.novamart.controller;

import com.novamart.dto.CatalogDtos.CategoryResponse;
import com.novamart.dto.CatalogDtos.ProductResponse;
import com.novamart.service.CatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {
    private static final Set<String> SORTABLE_FIELDS = Set.of("id", "price", "createdAt", "rating", "name");
    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return catalogService.getCategories();
    }

    @GetMapping("/products")
    public Page<ProductResponse> products(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String categoryId,
        @RequestParam(required = false) String brand,
        @RequestParam(required = false) Long minPrice,
        @RequestParam(required = false) Long maxPrice,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "8") int size,
        @RequestParam(required = false) List<String> sort
    ) {
        List<Sort.Order> orders = new ArrayList<>();
        if (sort != null) {
            for (String item : sort) {
                String[] parts = item.split(",");
                String field = parts[0].trim();
                if (!SORTABLE_FIELDS.contains(field)) continue;
                Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
                orders.add(new Sort.Order(direction, field));
            }
        }
        if (orders.stream().noneMatch(order -> "id".equals(order.getProperty()))) {
            orders.add(Sort.Order.asc("id"));
        }
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(orders));
        return catalogService.search(keyword, categoryId, brand, minPrice, maxPrice, pageable);
    }

    @GetMapping("/products/by-slug/{slug}")
    public ProductResponse productBySlug(@PathVariable String slug) {
        return catalogService.getBySlug(slug);
    }

    @GetMapping("/products/{id}")
    public ProductResponse productById(@PathVariable Long id) {
        return catalogService.getById(id);
    }
}