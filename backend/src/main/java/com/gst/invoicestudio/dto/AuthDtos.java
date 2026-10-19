package com.gst.invoicestudio.dto;

public class AuthDtos {

    public static class SendOtpRequest {
        private String identifier; // phone or email

        public String getIdentifier() { return identifier; }
        public void setIdentifier(String identifier) { this.identifier = identifier; }
    }

    public static class VerifyOtpRequest {
        private String identifier;
        private String otpCode;

        public String getIdentifier() { return identifier; }
        public void setIdentifier(String identifier) { this.identifier = identifier; }

        public String getOtpCode() { return otpCode; }
        public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    }

    public static class SignupRequest {
        private String phone;
        private String email;
        private String shopName;
        private String gstin;
        private String addressLine1;
        private String stateName;
        private String stateCode;

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getShopName() { return shopName; }
        public void setShopName(String shopName) { this.shopName = shopName; }

        public String getGstin() { return gstin; }
        public void setGstin(String gstin) { this.gstin = gstin; }

        public String getAddressLine1() { return addressLine1; }
        public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }

        public String getStateName() { return stateName; }
        public void setStateName(String stateName) { this.stateName = stateName; }

        public String getStateCode() { return stateCode; }
        public void setStateCode(String stateCode) { this.stateCode = stateCode; }
    }

    public static class AuthResponse {
        private String token;
        private Long userId;
        private Long shopId;
        private String shopName;
        private String phone;
        private String email;
        private String gstin;

        public AuthResponse(String token, Long userId, Long shopId, String shopName, String phone, String email, String gstin) {
            this.token = token;
            this.userId = userId;
            this.shopId = shopId;
            this.shopName = shopName;
            this.phone = phone;
            this.email = email;
            this.gstin = gstin;
        }

        public String getToken() { return token; }
        public Long getUserId() { return userId; }
        public Long getShopId() { return shopId; }
        public String getShopName() { return shopName; }
        public String getPhone() { return phone; }
        public String getEmail() { return email; }
        public String getGstin() { return gstin; }
    }
}
