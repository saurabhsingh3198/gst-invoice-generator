package com.gst.invoicestudio.service;

import com.gst.invoicestudio.config.JwtTokenProvider;
import com.gst.invoicestudio.dto.AuthDtos.*;
import com.gst.invoicestudio.model.Shop;
import com.gst.invoicestudio.model.User;
import com.gst.invoicestudio.repository.ShopRepository;
import com.gst.invoicestudio.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public void requestOtp(String identifier) {
        otpService.generateAndSendOtp(identifier);
    }

    @Transactional
    public AuthResponse verifyOtpAndLogin(String identifier, String otpCode) {
        boolean valid = otpService.verifyOtp(identifier, otpCode);
        if (!valid) {
            throw new IllegalArgumentException("Invalid or expired OTP. Please try again.");
        }

        String cleanIdentifier = identifier.trim();

        // Find user by phone or email
        Optional<User> optionalUser = userRepository.findByPhone(cleanIdentifier);
        if (optionalUser.isEmpty()) {
            optionalUser = userRepository.findByEmail(cleanIdentifier);
        }

        User user;
        Shop shop;

        if (optionalUser.isEmpty()) {
            // Auto-create initial user & default shop on first phone login
            user = new User();
            if (cleanIdentifier.contains("@")) {
                user.setEmail(cleanIdentifier);
                user.setPhone("98" + System.currentTimeMillis() % 100000000);
            } else {
                user.setPhone(cleanIdentifier);
            }
            user = userRepository.save(user);

            shop = new Shop();
            shop.setUser(user);
            shop.setShopName("My GST Enterprise");
            shop.setGstin("09FELPS8884L1ZE");
            shop.setStateName("Uttar Pradesh");
            shop.setStateCode("09");
            shop = shopRepository.save(shop);
        } else {
            final User existingUser = optionalUser.get();
            user = existingUser;
            shop = shopRepository.findFirstByUserId(existingUser.getId())
                    .orElseGet(() -> {
                        Shop s = new Shop();
                        s.setUser(existingUser);
                        s.setShopName("My GST Enterprise");
                        return shopRepository.save(s);
                    });
        }

        String token = jwtTokenProvider.generateToken(user.getId(), shop.getId(), user.getPhone());

        return new AuthResponse(
                token,
                user.getId(),
                shop.getId(),
                shop.getShopName(),
                user.getPhone(),
                user.getEmail(),
                shop.getGstin()
        );
    }

    @Transactional
    public AuthResponse registerShop(SignupRequest req) {
        if (req.getPhone() == null || req.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number is required");
        }

        String cleanPhone = req.getPhone().trim();
        Optional<User> existing = userRepository.findByPhone(cleanPhone);
        User user;

        if (existing.isPresent()) {
            user = existing.get();
        } else {
            user = new User(cleanPhone, req.getEmail());
            user = userRepository.save(user);
        }

        Shop shop = new Shop();
        shop.setUser(user);
        shop.setShopName(req.getShopName() != null ? req.getShopName().trim() : "My Shop");
        shop.setGstin(req.getGstin());
        shop.setAddressLine1(req.getAddressLine1());
        shop.setStateName(req.getStateName());
        shop.setStateCode(req.getStateCode());
        shop.setPhone(cleanPhone);
        shop.setEmail(req.getEmail());
        shop = shopRepository.save(shop);

        String token = jwtTokenProvider.generateToken(user.getId(), shop.getId(), user.getPhone());

        return new AuthResponse(
                token,
                user.getId(),
                shop.getId(),
                shop.getShopName(),
                user.getPhone(),
                user.getEmail(),
                shop.getGstin()
        );
    }
}
