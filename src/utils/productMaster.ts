export interface ProductTemplate {
  id: string;
  description: string;
  hsnSac: string;
  unit: string;
  altQuantityDefault?: string;
  rate: number;
  rateInclTax?: number | string;
  gstRate: number;
  category?: string;
}

export const DEFAULT_PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    id: 'prod-1',
    description: 'TATA TISCON 550 SD 8MM',
    hsnSac: '721420',
    unit: 'PC',
    altQuantityDefault: '44.000 KG',
    rate: 420.0,
    rateInclTax: '495.60',
    gstRate: 18,
    category: 'Steel & TMT',
  },
  {
    id: 'prod-2',
    description: 'TATA TISCON 550 SD 10MM',
    hsnSac: '721420',
    unit: 'PC',
    altQuantityDefault: '112.000 KG',
    rate: 640.0,
    rateInclTax: '755.20',
    gstRate: 18,
    category: 'Steel & TMT',
  },
  {
    id: 'prod-3',
    description: 'TATA TISCON 550 SD 12MM',
    hsnSac: '721420',
    unit: 'PC',
    altQuantityDefault: '60.000 KG',
    rate: 899.0,
    rateInclTax: '1060.82',
    gstRate: 18,
    category: 'Steel & TMT',
  },
  {
    id: 'prod-4',
    description: 'TATA TISCON 550 SD 16MM',
    hsnSac: '721420',
    unit: 'PC',
    altQuantityDefault: '51.000 KG',
    rate: 1600.0,
    rateInclTax: '1888.00',
    gstRate: 18,
    category: 'Steel & TMT',
  },
  {
    id: 'prod-5',
    description: 'TATA WIRE 20G BINDING WIRE',
    hsnSac: '721710',
    unit: 'KG',
    altQuantityDefault: '20.000 KG',
    rate: 110.0,
    rateInclTax: '129.80',
    gstRate: 18,
    category: 'Hardware & Wire',
  },
  {
    id: 'prod-6',
    description: 'ULTRATECH CEMENT PPC 50KG BAG',
    hsnSac: '252329',
    unit: 'BAG',
    altQuantityDefault: '50.000 KG',
    rate: 340.0,
    rateInclTax: '435.20',
    gstRate: 28,
    category: 'Cement',
  },
  {
    id: 'prod-7',
    description: 'ACC GOLD WATER SHIELD CEMENT',
    hsnSac: '252329',
    unit: 'BAG',
    altQuantityDefault: '50.000 KG',
    rate: 365.0,
    rateInclTax: '467.20',
    gstRate: 28,
    category: 'Cement',
  },
  {
    id: 'prod-8',
    description: 'MS FLAT BAR 25X5 MM',
    hsnSac: '721650',
    unit: 'KG',
    altQuantityDefault: '100.000 KG',
    rate: 68.0,
    rateInclTax: '80.24',
    gstRate: 18,
    category: 'Steel & TMT',
  },
];

const STORAGE_KEY = 'gst_product_master_library';

export function getSavedProducts(): ProductTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCT_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCT_TEMPLATES));
      return DEFAULT_PRODUCT_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRODUCT_TEMPLATES;
  } catch (e) {
    console.warn('Failed to load products from localStorage', e);
    return DEFAULT_PRODUCT_TEMPLATES;
  }
}

export function saveProductToLibrary(product: Omit<ProductTemplate, 'id'>): ProductTemplate[] {
  const current = getSavedProducts();
  const newProduct: ProductTemplate = {
    ...product,
    id: `prod-${Date.now()}`,
  };
  const updated = [newProduct, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save product to localStorage', e);
  }
  return updated;
}

export function deleteProductFromLibrary(id: string): ProductTemplate[] {
  const current = getSavedProducts();
  const updated = current.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete product from localStorage', e);
  }
  return updated;
}
