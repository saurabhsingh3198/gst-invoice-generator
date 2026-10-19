package com.gst.invoicestudio.repository;

import com.gst.invoicestudio.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByShopIdOrderByInvoiceDateDesc(Long shopId);

    List<Invoice> findByShopIdAndInvoiceDateOrderByCreatedAtDesc(Long shopId, LocalDate invoiceDate);

    List<Invoice> findByShopIdAndInvoiceDateBetweenOrderByInvoiceDateDesc(Long shopId, LocalDate startDate, LocalDate endDate);

    Optional<Invoice> findByIdAndShopId(Long id, Long shopId);

    long countByShopId(Long shopId);
}
