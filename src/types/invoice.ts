export interface SellerInfo {
  name: string;
  addressLine1: string;
  addressLine2: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  email: string;
  phone?: string;
}

export interface PartyInfo {
  name: string;
  address: string;
  stateName: string;
  stateCode: string;
  gstin?: string;
}

export interface DispatchDetails {
  invoiceNo: string;
  invoiceDate: string;
  deliveryNote: string;
  modeTermsOfPayment: string;
  referenceNoAndDate: string;
  otherReferences: string;
  buyersOrderNo: string;
  orderDate: string;
  dispatchDocNo: string;
  deliveryNoteDate: string;
  dispatchedThrough: string;
  destination: string;
  termsOfDelivery: string;
}

export interface InvoiceItem {
  id: string;
  slNo: number;
  description: string;
  hsnSac: string;
  altQuantity: string;
  quantity: number;
  unit: string;
  rateInclTax?: number | string;
  rate: number;
  per: string;
  discountPercent?: number | string;
  amount: number;
  gstRate?: number;
}

export interface TaxSummaryItem {
  id?: string;
  hsnSac: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate?: number;
  igstAmount?: number;
  totalTaxAmount: number;
}

export interface BankDetails {
  showBankDetails?: boolean;
  bankName: string;
  accountNo: string;
  branchAndIfsc: string;
  upiId?: string;
  showQrCode?: boolean;
  customQrUrl?: string;
}

export interface InvoiceData {
  title: string;
  seller: SellerInfo;
  consignee: PartyInfo;
  buyer: PartyInfo;
  dispatch: DispatchDetails;
  items: InvoiceItem[];
  declaration: string;
  showTaxSummary: boolean;
  taxMode?: 'auto' | 'manual';
  taxType?: 'cgst_sgst' | 'igst' | 'auto';
  pricingMode?: 'inclusive' | 'exclusive';
  defaultGstRate?: number;
  taxSummary?: TaxSummaryItem[];
  customTaxAmountInWords?: string;
  customAmountInWords?: string;
  signatoryCompany?: string;
  bankDetails?: BankDetails;
  enableRoundOff?: boolean;
  roundOffAmount?: number;
  logoUrl?: string;
  signatureUrl?: string;
  invoiceStatus?: 'PAID' | 'UNPAID' | 'PARTIAL' | 'PENDING';
  dueDate?: string;
}
