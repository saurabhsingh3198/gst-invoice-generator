package com.gst.invoicestudio.controller;

import com.gst.invoicestudio.dto.AnalyticsDtos.DailySalesSummaryDto;
import com.gst.invoicestudio.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/daily")
    public ResponseEntity<DailySalesSummaryDto> getDailySales(
            Authentication auth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Long shopId = (Long) auth.getCredentials();
        LocalDate queryDate = (date != null) ? date : LocalDate.now();

        DailySalesSummaryDto summary = analyticsService.getDailySalesSummary(shopId, queryDate);
        return ResponseEntity.ok(summary);
    }
}
