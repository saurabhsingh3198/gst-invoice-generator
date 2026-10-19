package com.gst.invoicestudio.repository;

import com.gst.invoicestudio.model.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {

    @Query("SELECT item FROM InvoiceItem item JOIN item.invoice inv WHERE inv.shop.id = :shopId AND inv.invoiceDate = :date")
    List<InvoiceItem> findItemsSoldByShopAndDate(@Param("shopId") Long shopId, @Param("date") LocalDate date);

    @Query("SELECT item FROM InvoiceItem item JOIN item.invoice inv WHERE inv.shop.id = :shopId AND inv.invoiceDate BETWEEN :startDate AND :endDate")
    List<InvoiceItem> findItemsSoldByShopBetweenDates(@Param("shopId") Long shopId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
