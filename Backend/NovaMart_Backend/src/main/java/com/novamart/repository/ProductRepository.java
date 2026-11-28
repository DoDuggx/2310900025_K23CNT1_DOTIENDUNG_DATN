package com.novamart.repository;

import com.novamart.domain.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySlugAndActiveTrue(String slug);
    Optional<Product> findBySkuIgnoreCase(String sku);
    long countByCategory_IdAndActiveTrue(String categoryId);
    List<Product> findTop10ByActiveTrueOrderByRatingDescCreatedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id and p.active = true")
    Optional<Product> findActiveByIdForUpdate(@Param("id") Long id);

    @Query("""
        select p from Product p
        where p.active = true
          and (:keyword is null or
               lower(p.name) like lower(concat('%', :keyword, '%')) or
               lower(p.brand) like lower(concat('%', :keyword, '%')) or
               lower(p.sku) like lower(concat('%', :keyword, '%')))
          and (:categoryId is null or p.category.id = :categoryId)
          and (:brand is null or lower(p.brand) = lower(:brand))
          and (:minPrice is null or p.price >= :minPrice)
          and (:maxPrice is null or p.price <= :maxPrice)
        """)
    Page<Product> search(
        @Param("keyword") String keyword,
        @Param("categoryId") String categoryId,
        @Param("brand") String brand,
        @Param("minPrice") Long minPrice,
        @Param("maxPrice") Long maxPrice,
        Pageable pageable
    );
}