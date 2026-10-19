package com.gst.invoicestudio.controller;

import com.gst.invoicestudio.model.Invoice;
import com.gst.invoicestudio.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<?> createInvoice(Authentication auth, @RequestBody Invoice invoice) {
        Long shopId = (Long) auth.getCredentials();
        try {
            Invoice saved = invoiceService.saveInvoice(shopId, invoice);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Invoice>> getInvoices(
            Authentication auth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Long shopId = (Long) auth.getCredentials();
        if (date != null) {
            return ResponseEntity.ok(invoiceService.getShopInvoicesByDate(shopId, date));
        }
        return ResponseEntity.ok(invoiceService.getShopInvoices(shopId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(Authentication auth, @PathVariable Long id) {
        Long shopId = (Long) auth.getCredentials();
        return invoiceService.getInvoiceById(id, shopId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvoice(Authentication auth, @PathVariable Long id) {
        Long shopId = (Long) auth.getCredentials();
        try {
            invoiceService.deleteInvoice(id, shopId);
            return ResponseEntity.ok(Map.of("message", "Invoice deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
