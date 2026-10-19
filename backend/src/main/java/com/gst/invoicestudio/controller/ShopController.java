package com.gst.invoicestudio.controller;

import com.gst.invoicestudio.model.Shop;
import com.gst.invoicestudio.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/shop")
public class ShopController {

    @Autowired
    private ShopService shopService;

    @GetMapping("/profile")
    public ResponseEntity<?> getShopProfile(Authentication auth) {
        Long shopId = (Long) auth.getCredentials();
        return shopService.getShopById(shopId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateShopProfile(Authentication auth, @RequestBody Shop updated) {
        Long shopId = (Long) auth.getCredentials();
        try {
            Shop saved = shopService.updateShop(shopId, updated);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
