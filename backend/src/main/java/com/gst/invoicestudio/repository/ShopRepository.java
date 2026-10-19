package com.gst.invoicestudio.repository;

import com.gst.invoicestudio.model.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {
    List<Shop> findByUserId(Long userId);
    Optional<Shop> findFirstByUserId(Long userId);
}
