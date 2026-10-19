package com.gst.invoicestudio.service;

import com.gst.invoicestudio.dto.AnalyticsDtos.*;
import com.gst.invoicestudio.model.Invoice;
import com.gst.invoicestudio.model.InvoiceItem;
import com.gst.invoicestudio.repository.InvoiceItemRepository;
import com.gst.invoicestudio.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class AnalyticsService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InvoiceItemRepository invoiceItemRepository;

    public DailySalesSummaryDto getDailySalesSummary(Long shopId, LocalDate date) {
        DailySalesSummaryDto summary = new DailySalesSummaryDto();
        summary.setDate(date);

        List<Invoice> dayInvoices = invoiceRepository.findByShopIdAndInvoiceDateOrderByCreatedAtDesc(shopId, date);
        summary.setTotalInvoicesCount(dayInvoices.size());

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        Map<String, BigDecimal> paymentSplit = new HashMap<>();

        for (Invoice inv : dayInvoices) {
            if (inv.getTotalAmount() != null) {
                totalRevenue = totalRevenue.add(inv.getTotalAmount());
            }

            BigDecimal taxOnInvoice = BigDecimal.ZERO;
            if (inv.getCgstAmount() != null) taxOnInvoice = taxOnInvoice.add(inv.getCgstAmount());
            if (inv.getSgstAmount() != null) taxOnInvoice = taxOnInvoice.add(inv.getSgstAmount());
            if (inv.getIgstAmount() != null) taxOnInvoice = taxOnInvoice.add(inv.getIgstAmount());
            totalTax = totalTax.add(taxOnInvoice);

            String mode = (inv.getPaymentMode() != null && !inv.getPaymentMode().isEmpty())
                    ? inv.getPaymentMode().toUpperCase()
                    : "CASH";
            paymentSplit.put(mode, paymentSplit.getOrDefault(mode, BigDecimal.ZERO).add(inv.getTotalAmount()));
        }

        summary.setTotalRevenue(totalRevenue);
        summary.setTotalTax(totalTax);
        summary.setPaymentModeSplit(paymentSplit);

        // Aggregate itemized sales: products sold on specified date
        List<InvoiceItem> soldItems = invoiceItemRepository.findItemsSoldByShopAndDate(shopId, date);
        Map<String, ItemSalesBreakdownDto> itemMap = new LinkedHashMap<>();

        for (InvoiceItem item : soldItems) {
            String key = (item.getDescription() != null ? item.getDescription().trim() : "Unknown Item")
                    + "_" + (item.getUnit() != null ? item.getUnit().trim() : "");

            if (!itemMap.containsKey(key)) {
                itemMap.put(key, new ItemSalesBreakdownDto(
                        item.getDescription(),
                        item.getHsnSac(),
                        item.getUnit(),
                        item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO,
                        item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO,
                        1
                ));
            } else {
                ItemSalesBreakdownDto existing = itemMap.get(key);
                BigDecimal newQty = existing.getTotalQuantity().add(item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO);
                BigDecimal newAmt = existing.getTotalAmount().add(item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO);
                itemMap.put(key, new ItemSalesBreakdownDto(
                        existing.getDescription(),
                        existing.getHsnSac(),
                        existing.getUnit(),
                        newQty,
                        newAmt,
                        existing.getSalesCount() + 1
                ));
            }
        }

        // Sort by highest sales amount
        List<ItemSalesBreakdownDto> itemList = new ArrayList<>(itemMap.values());
        itemList.sort((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()));

        summary.setItemsSold(itemList);

        return summary;
    }
}
