package com.novamart.repository;

import com.novamart.domain.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findFirstByUser_IdAndStatusOrderByCreatedAtDesc(Long userId, String status);
}