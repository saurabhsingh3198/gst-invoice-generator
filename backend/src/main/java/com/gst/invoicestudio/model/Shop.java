package com.gst.invoicestudio.model;

import jakarta.persistence.*;

@Entity
@Table(name = "shops")
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String shopName;

    @Column(length = 20)
    private String gstin;

    @Column(length = 255)
    private String addressLine1;

    @Column(length = 255)
    private String addressLine2;

    @Column(length = 100)
    private String stateName;

    @Column(length = 10)
    private String stateCode;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    // Bank Details
    @Column(length = 100)
    private String bankName;

    @Column(length = 50)
    private String accountNo;

    @Column(length = 50)
    private String branchIfsc;

    @Column(length = 100)
    private String upiId;

    @Column(length = 150)
    private String signatoryCompany;

    @Column(length = 20)
    private String invoicePrefix = "INV/";

    @Column
    private Integer lastInvoiceNo = 74;

    public Shop() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    public String getAddressLine1() { return addressLine1; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }

    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }

    public String getStateName() { return stateName; }
    public void setStateName(String stateName) { this.stateName = stateName; }

    public String getStateCode() { return stateCode; }
    public void setStateCode(String stateCode) { this.stateCode = stateCode; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountNo() { return accountNo; }
    public void setAccountNo(String accountNo) { this.accountNo = accountNo; }

    public String getBranchIfsc() { return branchIfsc; }
    public void setBranchIfsc(String branchIfsc) { this.branchIfsc = branchIfsc; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getSignatoryCompany() { return signatoryCompany; }
    public void setSignatoryCompany(String signatoryCompany) { this.signatoryCompany = signatoryCompany; }

    public String getInvoicePrefix() { return invoicePrefix; }
    public void setInvoicePrefix(String invoicePrefix) { this.invoicePrefix = invoicePrefix; }

    public Integer getLastInvoiceNo() { return lastInvoiceNo; }
    public void setLastInvoiceNo(Integer lastInvoiceNo) { this.lastInvoiceNo = lastInvoiceNo; }
}
