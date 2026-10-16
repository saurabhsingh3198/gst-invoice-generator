/**
 * Smart Invoice Number Auto-Sequence & Increment Utility
 * Supports patterns like:
 * - Pure numbers: '74' -> '75', '1' -> '2'
 * - Leading zero padding: '089' -> '090', '001' -> '002'
 * - Prefixes with slashes or hyphens: 'INV/089' -> 'INV/090'
 * - Financial year formats: 'INV/24-25/074' -> 'INV/24-25/075'
 * - Business custom codes: 'BT/2026/001' -> 'BT/2026/002'
 */

const LAST_INVOICE_KEY = 'invoice_last_number_v1';
const HISTORY_STORAGE_KEY = 'saved_invoices_history_v1';

/**
 * Get the last recorded or highest invoice number from history
 */
export function getLastRecordedInvoiceNo(): string {
  try {
    const recorded = localStorage.getItem(LAST_INVOICE_KEY);
    if (recorded && recorded.trim()) {
      return recorded.trim();
    }

    // Fallback: check saved history
    const historyRaw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (historyRaw) {
      const history = JSON.parse(historyRaw);
      if (Array.isArray(history) && history.length > 0 && history[0].invoiceNo) {
        return history[0].invoiceNo.trim();
      }
    }
  } catch (e) {
    console.warn('Error reading last invoice number', e);
  }
  return '';
}

/**
 * Save the last generated or saved invoice number
 */
export function recordLastInvoiceNo(invNo: string): void {
  if (!invNo || !invNo.trim()) return;
  try {
    localStorage.setItem(LAST_INVOICE_KEY, invNo.trim());
  } catch (e) {
    console.warn('Error saving last invoice number', e);
  }
}

/**
 * Increment an invoice number string while preserving its prefix, delimiters and zero-padding
 */
export function incrementInvoiceNo(currentNo: string): string {
  const trimmed = (currentNo || '').trim();
  if (!trimmed) {
    return '1';
  }

  // Regex matches any prefix followed by trailing digits:
  // e.g. "INV/089" => match[1]="INV/", match[2]="089"
  // e.g. "74"      => match[1]="",     match[2]="74"
  // e.g. "BT-001"  => match[1]="BT-",  match[2]="001"
  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const digitsStr = match[2];
    const currentNum = parseInt(digitsStr, 10);
    const nextNum = currentNum + 1;

    // Preserve the original padding length (e.g. '089' is length 3, next is '090')
    const paddedDigits = nextNum.toString().padStart(digitsStr.length, '0');
    return `${prefix}${paddedDigits}`;
  }

  // If there are numbers inside but ends with letters (e.g. "INV-1A"), append "-1"
  return `${trimmed}-1`;
}

/**
 * Calculate the next invoice number based on either the provided number,
 * the last saved invoice, or sensible defaults.
 */
export function getNextInvoiceNo(currentNo?: string): string {
  if (currentNo && currentNo.trim()) {
    return incrementInvoiceNo(currentNo.trim());
  }

  const lastRecorded = getLastRecordedInvoiceNo();
  if (lastRecorded) {
    return incrementInvoiceNo(lastRecorded);
  }

  // Default initial invoice number
  return 'INV-001';
}
