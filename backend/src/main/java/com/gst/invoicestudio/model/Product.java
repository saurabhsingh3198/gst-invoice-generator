package com.gst.invoicestudio.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 20)
    private String hsnSac;

    @Column(length = 20)
    private String unit = "PC";

    @Column(precision = 12, scale = 2)
    private BigDecimal defaultRate = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal defaultGstRate = BigDecimal.valueOf(18.0);

    public Product() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Shop getShop() { return shop; }
    public void setShop(Shop shop) { this.shop = shop; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getHsnSac() { return hsnSac; }
    public void setHsnSac(String hsnSac) { this.hsnSac = hsnSac; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getDefaultRate() { return defaultRate; }
    public void setDefaultRate(BigDecimal defaultRate) { this.defaultRate = defaultRate; }

    public BigDecimal getDefaultGstRate() { return defaultGstRate; }
    public void setDefaultGstRate(BigDecimal defaultGstRate) { this.defaultGstRate = defaultGstRate; }
}
