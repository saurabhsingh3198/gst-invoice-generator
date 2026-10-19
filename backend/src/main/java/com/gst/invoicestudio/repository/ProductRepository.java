package com.gst.invoicestudio.repository;

import com.gst.invoicestudio.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByShopIdOrderByNameAsc(Long shopId);
}
