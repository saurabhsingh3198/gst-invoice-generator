package com.gst.invoicestudio.repository;

import com.gst.invoicestudio.model.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findTopByIdentifierAndUsedFalseOrderByExpiresAtDesc(String identifier);
}
