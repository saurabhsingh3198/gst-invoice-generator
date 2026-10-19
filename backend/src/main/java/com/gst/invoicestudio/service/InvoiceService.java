package com.gst.invoicestudio.service;

import com.gst.invoicestudio.model.Invoice;
import com.gst.invoicestudio.model.InvoiceItem;
import com.gst.invoicestudio.model.Shop;
import com.gst.invoicestudio.repository.InvoiceRepository;
import com.gst.invoicestudio.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Transactional
    public Invoice saveInvoice(Long shopId, Invoice invoice) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found with ID: " + shopId));

        invoice.setShop(shop);

        if (invoice.getInvoiceDate() == null) {
            invoice.setInvoiceDate(LocalDate.now());
        }

        // Link child items to parent invoice
        if (invoice.getItems() != null) {
            for (InvoiceItem item : invoice.getItems()) {
                item.setInvoice(invoice);
            }
        }

        // Auto-increment shop sequence
        try {
            String invNo = invoice.getInvoiceNo();
            if (invNo != null && invNo.matches(".*\\d+.*")) {
                String numericPart = invNo.replaceAll("\\D+", "");
                if (!numericPart.isEmpty()) {
                    shop.setLastInvoiceNo(Integer.parseInt(numericPart));
                    shopRepository.save(shop);
                }
            }
        } catch (Exception ignored) {}

        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getShopInvoices(Long shopId) {
        return invoiceRepository.findByShopIdOrderByInvoiceDateDesc(shopId);
    }

    public List<Invoice> getShopInvoicesByDate(Long shopId, LocalDate date) {
        return invoiceRepository.findByShopIdAndInvoiceDateOrderByCreatedAtDesc(shopId, date);
    }

    public Optional<Invoice> getInvoiceById(Long id, Long shopId) {
        return invoiceRepository.findByIdAndShopId(id, shopId);
    }

    @Transactional
    public void deleteInvoice(Long id, Long shopId) {
        Invoice invoice = invoiceRepository.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found or unauthorized"));
        invoiceRepository.delete(invoice);
    }
}
