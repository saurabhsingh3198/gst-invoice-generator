package com.gst.invoicestudio.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AnalyticsDtos {

    public static class DailySalesSummaryDto {
        private LocalDate date;
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private BigDecimal totalTax = BigDecimal.ZERO;
        private Integer totalInvoicesCount = 0;
        private List<ItemSalesBreakdownDto> itemsSold = new ArrayList<>();
        private Map<String, BigDecimal> paymentModeSplit = new HashMap<>();

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

        public BigDecimal getTotalTax() { return totalTax; }
        public void setTotalTax(BigDecimal totalTax) { this.totalTax = totalTax; }

        public Integer getTotalInvoicesCount() { return totalInvoicesCount; }
        public void setTotalInvoicesCount(Integer totalInvoicesCount) { this.totalInvoicesCount = totalInvoicesCount; }

        public List<ItemSalesBreakdownDto> getItemsSold() { return itemsSold; }
        public void setItemsSold(List<ItemSalesBreakdownDto> itemsSold) { this.itemsSold = itemsSold; }

        public Map<String, BigDecimal> getPaymentModeSplit() { return paymentModeSplit; }
        public void setPaymentModeSplit(Map<String, BigDecimal> paymentModeSplit) { this.paymentModeSplit = paymentModeSplit; }
    }

    public static class ItemSalesBreakdownDto {
        private String description;
        private String hsnSac;
        private String unit;
        private BigDecimal totalQuantity = BigDecimal.ZERO;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private Integer salesCount = 0;

        public ItemSalesBreakdownDto(String description, String hsnSac, String unit, BigDecimal totalQuantity, BigDecimal totalAmount, Integer salesCount) {
            this.description = description;
            this.hsnSac = hsnSac;
            this.unit = unit;
            this.totalQuantity = totalQuantity;
            this.totalAmount = totalAmount;
            this.salesCount = salesCount;
        }

        public String getDescription() { return description; }
        public String getHsnSac() { return hsnSac; }
        public String getUnit() { return unit; }
        public BigDecimal getTotalQuantity() { return totalQuantity; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public Integer getSalesCount() { return salesCount; }
    }
}
