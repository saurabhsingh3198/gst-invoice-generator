import type { InvoiceData, TaxSummaryItem } from '../types/invoice';

/**
 * Checks whether an invoice requires Inter-State Tax (IGST)
 * or Intra-State Tax (CGST + SGST/UTGST).
 */
export function isInterStateTax(data: InvoiceData): boolean {
  if (data.taxType === 'igst') return true;
  if (data.taxType === 'cgst_sgst') return false;

  // Auto-detect based on state codes if taxType is 'auto' or not specified
  const sellerCode = data.seller?.stateCode?.trim();
  const buyerCode = data.buyer?.stateCode?.trim();
  if (sellerCode && buyerCode && sellerCode !== buyerCode) {
    return true;
  }
  return false;
}

/**
 * Calculates HSN/SAC Tax Summary from invoice items.
 * Groups items by HSN/SAC code and applies either inclusive or exclusive tax formulas.
 */
export function computeTaxSummaryFromItems(data: InvoiceData): TaxSummaryItem[] {
  const defaultGst = typeof data.defaultGstRate === 'number' ? data.defaultGstRate : 18;
  const isInterState = isInterStateTax(data);
  const isInclusive = data.pricingMode === 'inclusive';

  // Group items by HSN/SAC code and GST rate
  const groups: Record<
    string,
    {
      hsnSac: string;
      taxableValue: number;
      gstRate: number;
    }
  > = {};

  data.items.forEach((item) => {
    const hsn = (item.hsnSac || '').trim();
    const amount = Number(item.amount) || 0;
    const gstRate = typeof item.gstRate === 'number' ? item.gstRate : defaultGst;

    let taxable = amount;
    if (isInclusive) {
      taxable = gstRate > 0 ? amount / (1 + gstRate / 100) : amount;
    }

    const key = `${hsn}_${gstRate}`;
    if (!groups[key]) {
      groups[key] = {
        hsnSac: hsn,
        taxableValue: 0,
        gstRate,
      };
    }
    groups[key].taxableValue += taxable;
  });

  const keys = Object.keys(groups);
  if (keys.length === 0) {
    if (data.items.length > 0) {
      const firstHsn = (data.items[0]?.hsnSac || '').trim();
      const halfRate = Math.round((defaultGst / 2) * 100) / 100;
      return [
        {
          id: '1',
          hsnSac: firstHsn,
          taxableValue: 0,
          cgstRate: isInterState ? 0 : halfRate,
          cgstAmount: 0,
          sgstRate: isInterState ? 0 : halfRate,
          sgstAmount: 0,
          igstRate: isInterState ? defaultGst : 0,
          igstAmount: 0,
          totalTaxAmount: 0,
        },
      ];
    }
    return [];
  }

  return keys.map((key, idx) => {
    const grp = groups[key];
    const taxableRounded = Math.round(grp.taxableValue * 100) / 100;
    const gstRate = grp.gstRate;

    if (isInterState) {
      const igstAmount = Math.round(taxableRounded * (gstRate / 100) * 100) / 100;
      return {
        id: (idx + 1).toString(),
        hsnSac: grp.hsnSac,
        taxableValue: taxableRounded,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: gstRate,
        igstAmount,
        totalTaxAmount: igstAmount,
      };
    } else {
      const halfRate = Math.round((gstRate / 2) * 100) / 100;
      const cgstAmt = Math.round(taxableRounded * (halfRate / 100) * 100) / 100;
      const sgstAmt = Math.round(taxableRounded * (halfRate / 100) * 100) / 100;
      const totalTax = Math.round((cgstAmt + sgstAmt) * 100) / 100;

      return {
        id: (idx + 1).toString(),
        hsnSac: grp.hsnSac,
        taxableValue: taxableRounded,
        cgstRate: halfRate,
        cgstAmount: cgstAmt,
        sgstRate: halfRate,
        sgstAmount: sgstAmt,
        igstRate: 0,
        igstAmount: 0,
        totalTaxAmount: totalTax,
      };
    }
  });
}

/**
 * Returns the effective tax summary to render/export:
 * Uses manual rows if taxMode === 'manual' and rows exist,
 * otherwise calculates dynamically from items.
 */
export function getEffectiveTaxSummary(data: InvoiceData): TaxSummaryItem[] {
  if (data.taxMode === 'manual' && data.taxSummary && data.taxSummary.length > 0) {
    return data.taxSummary;
  }
  return computeTaxSummaryFromItems(data);
}

export interface TaxTotals {
  totalTaxableValue: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount: number;
  totalTaxAmount: number;
}

export function getTaxTotals(rows: TaxSummaryItem[]): TaxTotals {
  let totalTaxableValue = 0;
  let totalCgstAmount = 0;
  let totalSgstAmount = 0;
  let totalIgstAmount = 0;
  let totalTaxAmount = 0;

  rows.forEach((r) => {
    totalTaxableValue += Number(r.taxableValue) || 0;
    totalCgstAmount += Number(r.cgstAmount) || 0;
    totalSgstAmount += Number(r.sgstAmount) || 0;
    totalIgstAmount += Number(r.igstAmount) || 0;
    totalTaxAmount += Number(r.totalTaxAmount) || 0;
  });

  return {
    totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
    totalCgstAmount: Math.round(totalCgstAmount * 100) / 100,
    totalSgstAmount: Math.round(totalSgstAmount * 100) / 100,
    totalIgstAmount: Math.round(totalIgstAmount * 100) / 100,
    totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
  };
}
