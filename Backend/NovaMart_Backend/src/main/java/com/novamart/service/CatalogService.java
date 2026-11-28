package com.novamart.service;

import com.novamart.domain.Category;
import com.novamart.domain.Product;
import com.novamart.dto.CatalogDtos.CategoryResponse;
import com.novamart.dto.CatalogDtos.ProductRequest;
import com.novamart.dto.CatalogDtos.ProductResponse;
import com.novamart.exception.ApiException;
import com.novamart.repository.CategoryRepository;
import com.novamart.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Map;

@Service
public class CatalogService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
            .map(category -> new CategoryResponse(
                category.getId(), category.getName(),
                productRepository.countByCategory_IdAndActiveTrue(category.getId())
            )).toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(
        String keyword, String categoryId, String brand, Long minPrice, Long maxPrice, Pageable pageable
    ) {
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw ApiException.badRequest("Giá thấp nhất không được lớn hơn giá cao nhất.");
        }
        return productRepository.search(
            blankToNull(keyword), blankToNull(categoryId), blankToNull(brand), minPrice, maxPrice, pageable
        ).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
            .filter(Product::getActive)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy sản phẩm."));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getBySlug(String slug) {
        Product product = productRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy sản phẩm."));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllForAdmin() {
        return productRepository.findAll().stream().filter(Product::getActive).map(this::toResponse).toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (productRepository.findBySkuIgnoreCase(request.sku().trim()).isPresent()) {
            throw ApiException.conflict("SKU đã tồn tại.");
        }
        Product product = new Product();
        apply(product, request);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy sản phẩm."));
        productRepository.findBySkuIgnoreCase(request.sku().trim()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) throw ApiException.conflict("SKU đã tồn tại.");
        });
        apply(product, request);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void deactivate(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy sản phẩm."));
        product.setActive(false);
        productRepository.save(product);
    }

    private void apply(Product product, ProductRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> ApiException.badRequest("Danh mục sản phẩm không hợp lệ."));
        product.setName(request.name().trim());
        product.setSlug(request.slug() == null || request.slug().isBlank()
            ? slugify(request.name()) : slugify(request.slug()));
        product.setCategory(category);
        product.setBrand(request.brand().trim());
        product.setSku(request.sku().trim());
        product.setPrice(request.price());
        product.setOldPrice(request.oldPrice());
        product.setStockQty(request.stockQty());
        product.setImage(request.image());
        product.setDescription(request.description());
        product.setBadge(request.badge());
        product.setRating(request.rating() == null ? 0.0 : request.rating());
        product.setReviewCount(request.reviewCount() == null ? 0 : request.reviewCount());
        product.setActive(true);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
            product.getId(), product.getSlug(), product.getName(), product.getCategory().getId(),
            product.getBrand(), product.getSku(), product.getPrice(), product.getOldPrice(),
            product.getStockQty(), product.getImage(),
            product.getImage() == null || product.getImage().isBlank() ? List.of() : List.of(product.getImage()),
            product.getDescription(), product.getBadge(), product.getRating(), product.getReviewCount(),
            Map.of(), product.getCreatedAt()
        );
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "").toLowerCase()
            .replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "san-pham" : normalized;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}