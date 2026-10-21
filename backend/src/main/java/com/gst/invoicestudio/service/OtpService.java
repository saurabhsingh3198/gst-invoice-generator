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

    @Value("${app.mail.resend-api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${app.mail.brevo-api-key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

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

        System.out.println("=================================================");
        System.out.println("  OTP GENERATED FOR [" + cleanIdentifier + "]: " + otpCode);
        System.out.println("=================================================");

        // Email Delivery: Prioritizes HTTPS REST API (Port 443 - never blocked by Render)
        if (cleanIdentifier.contains("@")) {
            final String recipient = cleanIdentifier;
            final String code = otpCode;
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                boolean sent = false;

                // 1. Resend HTTPS REST API (Port 443 - never blocked by Render)
                String activeResendKey = (resendApiKey != null && !resendApiKey.trim().isEmpty())
                        ? resendApiKey.trim()
                        : System.getenv("RESEND_API_KEY");

                if (activeResendKey != null && !activeResendKey.trim().isEmpty()) {
                    try {
                        String payload = "{\"from\":\"GST Studio <onboarding@resend.dev>\",\"to\":[\"" + recipient + "\"],\"subject\":\"🔑 Your GST Studio OTP: " + code + "\",\"html\":\"<h2>GST Invoice Studio Verification</h2><p>Your 6-digit verification code is: <strong style='font-size:24px;color:#2563eb;'>" + code + "</strong></p><p>Valid for 10 minutes.</p>\"}";
                        java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                                .uri(java.net.URI.create("https://api.resend.com/emails"))
                                .header("Authorization", "Bearer " + activeResendKey.trim())
                                .header("Content-Type", "application/json")
                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
                                .build();
                        java.net.http.HttpResponse<String> resp = java.net.http.HttpClient.newHttpClient().send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
                        if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                            System.out.println("  [EMAIL SUCCESS] OTP delivered via Resend HTTPS API to: " + recipient);
                            sent = true;
                        } else {
                            System.err.println("  [RESEND API ERROR] Status " + resp.statusCode() + ": " + resp.body());
                        }
                    } catch (Exception e) {
                        System.err.println("  [RESEND FAILED] " + e.getMessage());
                    }
                }

                // 2. Brevo HTTPS REST API (Port 443)
                if (!sent && brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
                    try {
                        String payload = "{\"sender\":{\"name\":\"GST Studio\",\"email\":\"Saurabh.antworksmoney@gmail.com\"},\"to\":[{\"email\":\"" + recipient + "\"}],\"subject\":\"🔑 Your GST Studio OTP: " + code + "\",\"htmlContent\":\"<h2>GST Invoice Studio Verification</h2><p>Your 6-digit verification code is: <strong style='font-size:24px;color:#2563eb;'>" + code + "</strong></p><p>Valid for 10 minutes.</p>\"}";
                        java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                                .uri(java.net.URI.create("https://api.brevo.com/v3/smtp/email"))
                                .header("api-key", brevoApiKey.trim())
                                .header("Content-Type", "application/json")
                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
                                .build();
                        java.net.http.HttpResponse<String> resp = java.net.http.HttpClient.newHttpClient().send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
                        if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                            System.out.println("  [EMAIL SUCCESS] OTP delivered via Brevo HTTPS API to: " + recipient);
                            sent = true;
                        } else {
                            System.err.println("  [BREVO API ERROR] Status " + resp.statusCode() + ": " + resp.body());
                        }
                    } catch (Exception e) {
                        System.err.println("  [BREVO FAILED] " + e.getMessage());
                    }
                }

                // 3. Fallback to Gmail SMTP (works locally and on unblocked hosts)
                if (!sent && mailSender != null) {
                    try {
                        org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
                        message.setFrom("Saurabh.antworksmoney@gmail.com");
                        message.setTo(recipient);
                        message.setSubject("🔑 Your GST Invoice Studio OTP: " + code);
                        message.setText("Hello Business Owner,\n\nYour one-time verification code (OTP) for GST Invoice Studio is:\n\n" 
                                + code + "\n\nThis OTP is valid for the next 10 minutes. Please do not share this code with anyone.\n\nThank you,\nGST Invoice Studio SaaS Platform");
                        mailSender.send(message);
                        System.out.println("  [EMAIL SUCCESS] Real OTP sent via Gmail SMTP to: " + recipient);
                    } catch (Exception e) {
                        System.err.println("  [SMTP FAILED] Outbound SMTP port blocked on host: " + e.getMessage());
                    }
                }
            });
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
