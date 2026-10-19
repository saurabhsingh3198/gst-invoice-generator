package com.gst.invoicestudio.controller;

import com.gst.invoicestudio.dto.AuthDtos.*;
import com.gst.invoicestudio.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "GST Invoice Studio Backend",
                "timestamp", System.currentTimeMillis()
        ));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody SendOtpRequest req) {
        if (req.getIdentifier() == null || req.getIdentifier().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number or email is required"));
        }
        authService.requestOtp(req.getIdentifier());
        return ResponseEntity.ok(Map.of(
                "message", "OTP sent successfully to " + req.getIdentifier(),
                "demoOtp", "123456"
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest req) {
        try {
            AuthResponse resp = authService.verifyOtpAndLogin(req.getIdentifier(), req.getOtpCode());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        try {
            AuthResponse resp = authService.registerShop(req);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
