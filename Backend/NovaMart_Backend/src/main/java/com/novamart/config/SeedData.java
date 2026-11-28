package com.novamart.config;

import com.novamart.domain.Category;
import com.novamart.domain.Product;
import com.novamart.domain.Role;
import com.novamart.domain.UserAccount;
import com.novamart.domain.Voucher;
import com.novamart.repository.CategoryRepository;
import com.novamart.repository.ProductRepository;
import com.novamart.repository.UserRepository;
import com.novamart.repository.VoucherRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class SeedData {
    @Bean
    ApplicationRunner seedNovaMart(
        CategoryRepository categoryRepository,
        ProductRepository productRepository,
        UserRepository userRepository,
        VoucherRepository voucherRepository,
        PasswordEncoder passwordEncoder
    ) {
        return args -> {
            Map<String, String> categories = new LinkedHashMap<>();
            categories.put("laptop", "Laptop");
            categories.put("phone", "Điện thoại");
            categories.put("audio", "Âm thanh");
            categories.put("monitor", "Màn hình");
            categories.put("accessory", "Phụ kiện");
            categories.put("wearable", "Thiết bị đeo");
            categories.forEach((id, name) -> {
                if (!categoryRepository.existsById(id)) categoryRepository.save(new Category(id, name));
            });

            seedProduct(productRepository, categoryRepository, "macbook-pro-14-m4-pro", "MacBook Pro 14 M4 Pro", "laptop", "Apple", "APL-MBP14-M4P", 49990000L, 52990000L, 12, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1100&q=85", "MacBook Pro 14 inch với chip M4 Pro, phù hợp lập trình và sáng tạo nội dung.", "Bán chạy", 4.9);
            seedProduct(productRepository, categoryRepository, "asus-rog-zephyrus-g16", "ASUS ROG Zephyrus G16", "laptop", "ASUS", "ASU-ROG-G16", 64990000L, 67990000L, 7, "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1100&q=85", "Laptop gaming cao cấp với màn hình OLED và hiệu năng đồ họa mạnh.", "Gaming", 4.8);
            seedProduct(productRepository, categoryRepository, "iphone-16-pro-max", "iPhone 16 Pro Max 256GB", "phone", "Apple", "APL-IP16PM-256", 31990000L, 34990000L, 19, "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1100&q=85", "Điện thoại cao cấp với hệ thống camera Pro và hiệu năng mạnh.", "Ưu đãi", 4.9);
            seedProduct(productRepository, categoryRepository, "samsung-galaxy-s25-ultra", "Samsung Galaxy S25 Ultra", "phone", "Samsung", "SAM-S25U-256", 28990000L, 33990000L, 14, "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1100&q=85", "Flagship Android với màn hình lớn và bút S Pen.", "Mới", 4.8);
            seedProduct(productRepository, categoryRepository, "sony-wh-1000xm5", "Sony WH-1000XM5", "audio", "Sony", "SNY-WH1000XM5", 7490000L, 8990000L, 23, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85", "Tai nghe chống ồn chủ động, âm thanh chi tiết.", "Yêu thích", 4.8);
            seedProduct(productRepository, categoryRepository, "dell-ultrasharp-u2723qe", "Dell UltraSharp U2723QE", "monitor", "Dell", "DEL-U2723QE", 13990000L, 15990000L, 9, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1100&q=85", "Màn hình 4K phục vụ thiết kế và làm việc chuyên nghiệp.", "Văn phòng", 4.7);
            seedProduct(productRepository, categoryRepository, "keychron-q1-max", "Keychron Q1 Max", "accessory", "Keychron", "KEY-Q1MAX", 5190000L, null, 16, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1100&q=85", "Bàn phím cơ custom khung nhôm và kết nối không dây.", "Premium", 4.9);
            seedProduct(productRepository, categoryRepository, "logitech-mx-master-3s", "Logitech MX Master 3S", "accessory", "Logitech", "LOG-MXM3S", 2490000L, 2890000L, 31, "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1100&q=85", "Chuột công thái học cho hiệu suất làm việc.", "Bán chạy", 4.8);
            seedProduct(productRepository, categoryRepository, "apple-watch-series-10", "Apple Watch Series 10", "wearable", "Apple", "APL-AW-S10", 10990000L, 11990000L, 11, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1100&q=85", "Đồng hồ thông minh theo dõi hoạt động và thông báo.", "Chính hãng", 4.7);
            seedProduct(productRepository, categoryRepository, "anker-prime-power-bank", "Anker Prime Power Bank 27.650mAh", "accessory", "Anker", "ANK-PRIME-27650", 2990000L, 3490000L, 26, "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1100&q=85", "Pin dự phòng dung lượng lớn, hỗ trợ sạc nhanh.", "Công suất cao", 4.8);

            if (!voucherRepository.findByCodeIgnoreCaseAndActiveTrue("NOVA10").isPresent()) {
                voucherRepository.save(new Voucher("NOVA10", 10, 1000000L, 0L));
            }
            if (!voucherRepository.findByCodeIgnoreCaseAndActiveTrue("TECH5").isPresent()) {
                voucherRepository.save(new Voucher("TECH5", 5, 500000L, 0L));
            }

            if (!userRepository.existsByEmailIgnoreCase("admin@novamart.local")) {
                UserAccount admin = new UserAccount();
                admin.setFullName("Quản trị viên NovaMart");
                admin.setEmail("admin@novamart.local");
                admin.setPhone("0900000000");
                admin.setPasswordHash(passwordEncoder.encode("Admin@12345"));
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
            }
            for (int i = 1; i <= 10; i++) {
                String email = "customer" + String.format("%02d", i) + "@novamart.local";
                if (!userRepository.existsByEmailIgnoreCase(email)) {
                    UserAccount customer = new UserAccount();
                    customer.setFullName("Khách hàng demo " + i);
                    customer.setEmail(email);
                    customer.setPhone("09000000" + String.format("%02d", i));
                    customer.setPasswordHash(passwordEncoder.encode("Customer@12345"));
                    customer.setRole(Role.USER);
                    userRepository.save(customer);
                }
            }
        };
    }

    private void seedProduct(
        ProductRepository products, CategoryRepository categories, String slug, String name,
        String categoryId, String brand, String sku, long price, Long oldPrice, int stock,
        String image, String description, String badge, double rating
    ) {
        if (products.findBySkuIgnoreCase(sku).isPresent()) return;
        Product product = new Product();
        product.setSlug(slug);
        product.setName(name);
        product.setCategory(categories.findById(categoryId).orElseThrow());
        product.setBrand(brand);
        product.setSku(sku);
        product.setPrice(price);
        product.setOldPrice(oldPrice);
        product.setStockQty(stock);
        product.setImage(image);
        product.setDescription(description);
        product.setBadge(badge);
        product.setRating(rating);
        product.setReviewCount(20 + (int) (rating * 10));
        product.setActive(true);
        products.save(product);
    }
}