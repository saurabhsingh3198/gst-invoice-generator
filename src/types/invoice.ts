export interface SellerInfo {
  name: string;
  addressLine1: string;
  addressLine2: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  email: string;
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
}

export interface TaxSummaryItem {
  hsnSac: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalTaxAmount: number;
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
  taxSummary?: TaxSummaryItem[];
  customAmountInWords?: string;
}
