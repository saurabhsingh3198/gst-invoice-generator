package com.gst.invoicestudio.service;

import com.gst.invoicestudio.model.OtpToken;
import com.gst.invoicestudio.repository.OtpTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OtpService {

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Autowired(required = false)
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @Value("${app.otp.expiration-minutes:10}")
    private int expirationMinutes;

    @Value("${app.otp.demo-bypass:false}")
    private boolean demoBypass;

    private final SecureRandom random = new SecureRandom();

    public String generateAndSendOtp(String identifier) {
        String cleanIdentifier = identifier.trim().toLowerCase();

        // Generate 6-digit random code
        String otpCode = String.format("%06d", random.nextInt(900000) + 100000);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);
        OtpToken token = new OtpToken(cleanIdentifier, otpCode, expiresAt);
        otpTokenRepository.save(token);

        // Real Email Delivery via Gmail SMTP
        // Real Email Delivery via Gmail SMTP (asynchronous to avoid blocking HTTP response)
        if (cleanIdentifier.contains("@") && mailSender != null) {
            final String recipient = cleanIdentifier;
            final String code = otpCode;
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
                    message.setFrom("Saurabh.antworksmoney@gmail.com");
                    message.setTo(recipient);
                    message.setSubject("🔑 Your GST Invoice Studio OTP: " + code);
                    message.setText("Hello Business Owner,\n\nYour one-time verification code (OTP) for GST Invoice Studio is:\n\n" 
                            + code + "\n\nThis OTP is valid for the next 10 minutes. Please do not share this code with anyone.\n\nThank you,\nGST Invoice Studio SaaS Platform");
                    mailSender.send(message);
                    System.out.println("=================================================");
                    System.out.println("  REAL EMAIL OTP SENT TO [" + recipient + "]: " + code);
                    System.out.println("=================================================");
                } catch (Exception e) {
                    System.err.println("  [EMAIL FAILED] Could not send email: " + e.getMessage());
                }
            });
        } else {
            System.out.println("=================================================");
            System.out.println("  OTP SENT TO [" + cleanIdentifier + "]: " + otpCode);
            System.out.println("=================================================");
        }

        return otpCode;
    }

    public boolean verifyOtp(String identifier, String otpCode) {
        if (identifier == null || otpCode == null) return false;

        String cleanIdentifier = identifier.trim().toLowerCase();
        String cleanOtp = otpCode.trim();

        // Optional developer bypass for testing
        if (demoBypass && "123456".equals(cleanOtp)) {
            return true;
        }

        Optional<OtpToken> optionalToken = otpTokenRepository
                .findTopByIdentifierAndUsedFalseOrderByExpiresAtDesc(cleanIdentifier);

        if (optionalToken.isEmpty()) {
            return false;
        }

        OtpToken token = optionalToken.get();

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        if (token.getOtpCode().equals(cleanOtp)) {
            token.setUsed(true);
            otpTokenRepository.save(token);
            return true;
        }

        return false;
    }
}
