package com.gst.invoicestudio.service;

import com.gst.invoicestudio.model.Shop;
import com.gst.invoicestudio.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ShopService {

    @Autowired
    private ShopRepository shopRepository;

    public Optional<Shop> getShopById(Long shopId) {
        return shopRepository.findById(shopId);
    }

    public Shop updateShop(Long shopId, Shop updated) {
        Shop existing = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found with ID: " + shopId));

        if (updated.getShopName() != null) existing.setShopName(updated.getShopName());
        if (updated.getGstin() != null) existing.setGstin(updated.getGstin());
        if (updated.getAddressLine1() != null) existing.setAddressLine1(updated.getAddressLine1());
        if (updated.getAddressLine2() != null) existing.setAddressLine2(updated.getAddressLine2());
        if (updated.getStateName() != null) existing.setStateName(updated.getStateName());
        if (updated.getStateCode() != null) existing.setStateCode(updated.getStateCode());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getEmail() != null) existing.setEmail(updated.getEmail());
        if (updated.getBankName() != null) existing.setBankName(updated.getBankName());
        if (updated.getAccountNo() != null) existing.setAccountNo(updated.getAccountNo());
        if (updated.getBranchIfsc() != null) existing.setBranchIfsc(updated.getBranchIfsc());
        if (updated.getUpiId() != null) existing.setUpiId(updated.getUpiId());
        if (updated.getSignatoryCompany() != null) existing.setSignatoryCompany(updated.getSignatoryCompany());
        if (updated.getInvoicePrefix() != null) existing.setInvoicePrefix(updated.getInvoicePrefix());

        return shopRepository.save(existing);
    }
}
