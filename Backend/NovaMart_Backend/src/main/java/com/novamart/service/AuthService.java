package com.novamart.service;

import com.novamart.domain.Role;
import com.novamart.domain.UserAccount;
import com.novamart.dto.AuthDtos.AuthResponse;
import com.novamart.dto.AuthDtos.LoginRequest;
import com.novamart.dto.AuthDtos.RegisterRequest;
import com.novamart.dto.AuthDtos.UserSummary;
import com.novamart.exception.ApiException;
import com.novamart.repository.UserRepository;
import com.novamart.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Email đã được sử dụng.");
        }
        UserAccount user = new UserAccount();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(request.phone() == null ? null : request.phone().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        return createResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount user = userRepository.findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác.");
        }
        return createResponse(user);
    }

    private AuthResponse createResponse(UserAccount user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(
            token,
            "Bearer",
            jwtService.getExpirationMs(),
            new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getRole())
        );
    }
}