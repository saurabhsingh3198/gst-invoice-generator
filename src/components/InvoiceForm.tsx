import React, { useState } from 'react';
import type { InvoiceData, InvoiceItem, TaxSummaryItem } from '../types/invoice';
import {
  Building2,
  Users,
  Truck,
  Package,
  Plus,
  Trash2,
  Copy,
  Settings,
  Sparkles,
  RotateCcw,
  Receipt,
  LayoutGrid,
  Table as TableIcon,
  Percent,
  RefreshCw,
  Bookmark,
  CheckCircle2,
  Save,
  FolderOpen,
} from 'lucide-react';
import { formatIndianCurrency, numberToIndianWords, taxNumberToIndianWords } from '../utils/numberToWords';
import {
  computeTaxSummaryFromItems,
  getEffectiveTaxSummary,
  getTaxTotals,
  isInterStateTax,
} from '../utils/taxCalculation';
import { analyzeGstin } from '../utils/gstUtils';
import { ProductMasterModal } from './ProductMasterModal';
import { saveProductToLibrary } from '../utils/productMaster';
import type { ProductTemplate } from '../utils/productMaster';
import { CustomerMasterModal } from './CustomerMasterModal';
import { saveCustomerToDirectory } from '../utils/customerMaster';
import type { CustomerTemplate } from '../utils/customerMaster';
import { getNextInvoiceNo, recordLastInvoiceNo } from '../utils/invoiceSequence';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (newData: InvoiceData) => void;
  onLoadSample: () => void;
  onReset: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  data,
  onChange,
  onLoadSample,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'seller' | 'parties' | 'dispatch' | 'tax' | 'settings'>('items');
  const [showAdvancedColumns, setShowAdvancedColumns] = useState<boolean>(false);
  const [showProductMaster, setShowProductMaster] = useState<boolean>(false);
  const [showCustomerMaster, setShowCustomerMaster] = useState<boolean>(false);
  const [savedProductToast, setSavedProductToast] = useState<string>('');
  const [profileToast, setProfileToast] = useState<string>('');
  const [itemsViewMode, setItemsViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  const saveCompanyProfile = () => {
    try {
      const profileToSave = {
        seller: data.seller,
        signatoryCompany: data.signatoryCompany,
        bankDetails: data.bankDetails,
      };
      localStorage.setItem('saved_user_company_profile', JSON.stringify(profileToSave));
      setProfileToast('Company & Bank Profile saved as default!');
      setTimeout(() => setProfileToast(''), 3500);
    } catch (e) {
      console.warn('Failed to save company profile', e);
    }
  };

  const loadCompanyProfile = () => {
    try {
      const raw = localStorage.getItem('saved_user_company_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        onChange({
          ...data,
          seller: parsed.seller || data.seller,
          signatoryCompany: parsed.signatoryCompany || data.signatoryCompany,
          bankDetails: parsed.bankDetails || data.bankDetails,
        });
        setProfileToast('Company profile loaded successfully!');
        setTimeout(() => setProfileToast(''), 3500);
      } else {
        alert('No saved company profile found. Fill in your company details and click "Save as Default" first.');
      }
    } catch (e) {
      console.warn('Failed to load company profile', e);
    }
  };

  // Helper updates with smart GSTIN auto-detection
  const updateSeller = (key: keyof InvoiceData['seller'], val: string) => {
    let extra = {};
    if (key === 'gstin') {
      const analysis = analyzeGstin(val);
      if (analysis.stateCode && analysis.stateName) {
        extra = {
          stateCode: analysis.stateCode,
          stateName: analysis.stateName,
        };
      }
    }
    onChange({
      ...data,
      seller: { ...data.seller, [key]: val, ...extra },
    });
  };

  const updateConsignee = (key: keyof InvoiceData['consignee'], val: string) => {
    let extra = {};
    if (key === 'gstin') {
      const analysis = analyzeGstin(val);
      if (analysis.stateCode && analysis.stateName) {
        extra = {
          stateCode: analysis.stateCode,
          stateName: analysis.stateName,
        };
      }
    }
    onChange({
      ...data,
      consignee: { ...data.consignee, [key]: val, ...extra },
    });
  };

  const updateBuyer = (key: keyof InvoiceData['buyer'], val: string) => {
    let extra = {};
    if (key === 'gstin') {
      const analysis = analyzeGstin(val);
      if (analysis.stateCode && analysis.stateName) {
        extra = {
          stateCode: analysis.stateCode,
          stateName: analysis.stateName,
        };
      }
    }
    onChange({
      ...data,
      buyer: { ...data.buyer, [key]: val, ...extra },
    });
  };

  const updateDispatch = (key: keyof InvoiceData['dispatch'], val: string) => {
    if (key === 'invoiceNo' && val && val.trim()) {
      recordLastInvoiceNo(val.trim());
    }
    onChange({
      ...data,
      dispatch: { ...data.dispatch, [key]: val },
    });
  };

  const copyConsigneeToBuyer = () => {
    onChange({
      ...data,
      buyer: {
        ...data.consignee,
      },
    });
  };

  const handleSelectCustomer = (c: CustomerTemplate) => {
    onChange({
      ...data,
      buyer: {
        ...data.buyer,
        name: c.name,
        address: c.address,
        gstin: c.gstin || '',
        stateName: c.stateName,
        stateCode: c.stateCode,
      },
      consignee: {
        ...data.consignee,
        name: c.name,
        address: c.address,
        gstin: c.gstin || '',
        stateName: c.stateName,
        stateCode: c.stateCode,
      },
    });
    setProfileToast(`Customer "${c.name}" loaded into invoice!`);
    setTimeout(() => setProfileToast(''), 3000);
  };

  const handleSaveBuyerToDirectory = () => {
    if (!data.buyer.name.trim()) return;
    saveCustomerToDirectory({
      name: data.buyer.name.trim(),
      address: data.buyer.address || '',
      gstin: data.buyer.gstin || '',
      stateName: data.buyer.stateName || 'Uttar Pradesh',
      stateCode: data.buyer.stateCode || '09',
      partyType: data.buyer.gstin ? 'B2B' : 'B2C',
    });
    setProfileToast(`Customer "${data.buyer.name}" saved to Party Directory!`);
    setTimeout(() => setProfileToast(''), 3000);
  };

  const updateBankDetails = (key: keyof NonNullable<InvoiceData['bankDetails']>, val: any) => {
    const current = data.bankDetails || {
      showBankDetails: true,
      bankName: '',
      accountNo: '',
      branchAndIfsc: '',
      upiId: '',
      showQrCode: true,
    };
    onChange({
      ...data,
      bankDetails: {
        ...current,
        [key]: val,
      },
    });
  };

  // Item helpers
  const addItem = () => {
    const nextSl = data.items.length + 1;
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      slNo: nextSl,
      description: 'NEW PRODUCT / ITEM',
      hsnSac: '721420',
      altQuantity: '0.000 KG',
      quantity: 1,
      unit: 'PC',
      rateInclTax: '118.00',
      rate: 100,
      per: 'PC',
      discountPercent: '',
      amount: 100,
      gstRate: data.defaultGstRate ?? 18,
    };
    onChange({
      ...data,
      items: [...data.items, newItem],
    });
  };

  const handleSelectFromLibrary = (template: ProductTemplate) => {
    const nextSl = data.items.length + 1;
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      slNo: nextSl,
      description: template.description,
      hsnSac: template.hsnSac,
      altQuantity: template.altQuantityDefault || '0.000 KG',
      quantity: 1,
      unit: template.unit,
      rateInclTax: template.rateInclTax || '',
      rate: template.rate,
      per: template.unit,
      discountPercent: '',
      amount: template.rate,
      gstRate: template.gstRate,
    };
    onChange({
      ...data,
      items: [...data.items, newItem],
    });
  };

  const handleSaveItemToLibrary = (item: InvoiceItem) => {
    saveProductToLibrary({
      description: item.description,
      hsnSac: item.hsnSac,
      unit: item.unit,
      altQuantityDefault: item.altQuantity,
      rate: Number(item.rate) || 0,
      rateInclTax: item.rateInclTax,
      gstRate: Number(item.gstRate) || (data.defaultGstRate ?? 18),
      category: 'Saved Items',
    });
    setSavedProductToast(`Saved "${item.description}" to product library!`);
    setTimeout(() => setSavedProductToast(''), 3000);
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    const updated = data.items.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      slNo: idx + 1,
    }));
    onChange({
      ...data,
      items: updated,
    });
  };

  // Two-way calculation between rate and rateInclTax
  const updateItem = (index: number, key: keyof InvoiceItem, val: any) => {
    const updated = [...data.items];
    const current = { ...updated[index], [key]: val };
    const gst = typeof current.gstRate === 'number' ? current.gstRate : (data.defaultGstRate ?? 18);

    if (key === 'rateInclTax') {
      const rIncl = Number(val) || 0;
      current.rateInclTax = val;
      if (rIncl > 0 && gst > 0) {
        const base = rIncl / (1 + gst / 100);
        current.rate = Math.round(base * 100) / 100;
      } else if (rIncl > 0) {
        current.rate = rIncl;
      }
      const q = Number(current.quantity) || 0;
      const disc = Number(current.discountPercent) || 0;
      let calculated = q * current.rate;
      if (disc > 0) calculated -= (calculated * disc) / 100;
      current.amount = Math.round(calculated * 100) / 100;
    } else if (key === 'rate' || key === 'quantity' || key === 'discountPercent') {
      const q = key === 'quantity' ? Number(val) || 0 : Number(current.quantity) || 0;
      const r = key === 'rate' ? Number(val) || 0 : Number(current.rate) || 0;
      const disc = key === 'discountPercent' ? Number(val) || 0 : Number(current.discountPercent) || 0;

      if (key === 'rate' && r > 0) {
        const rInc = r * (1 + gst / 100);
        current.rateInclTax = (Math.round(rInc * 100) / 100).toFixed(2);
      }
      let calculated = q * r;
      if (disc > 0) {
        calculated = calculated - (calculated * disc) / 100;
      }
      current.amount = Math.round(calculated * 100) / 100;
    } else if (key === 'gstRate') {
      const newGst = Number(val) || 0;
      current.gstRate = newGst;
      if (data.pricingMode === 'inclusive' && Number(current.rateInclTax) > 0) {
        const base = newGst > 0 ? Number(current.rateInclTax) / (1 + newGst / 100) : Number(current.rateInclTax);
        current.rate = Math.round(base * 100) / 100;
      } else if (Number(current.rate) > 0) {
        const rInc = Number(current.rate) * (1 + newGst / 100);
        current.rateInclTax = (Math.round(rInc * 100) / 100).toFixed(2);
      }
      const q = Number(current.quantity) || 0;
      const disc = Number(current.discountPercent) || 0;
      let calculated = q * current.rate;
      if (disc > 0) calculated -= (calculated * disc) / 100;
      current.amount = Math.round(calculated * 100) / 100;
    } else if (key === 'amount') {
      const amt = Number(val) || 0;
      current.amount = amt;
      const q = Number(current.quantity) || 0;
      if (q > 0) {
        current.rate = Math.round((amt / q) * 100) / 100;
        if (gst > 0) {
          const rInc = current.rate * (1 + gst / 100);
          current.rateInclTax = (Math.round(rInc * 100) / 100).toFixed(2);
        }
      }
    }

    updated[index] = current;
    onChange({
      ...data,
      items: updated,
    });
  };

  const isInclusive = data.pricingMode !== 'exclusive';
  const itemsSubtotal = data.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalAltQtyNumber = data.items.reduce((acc, i) => {
    const m = (i.altQuantity || '').match(/([0-9.,]+)/);
    return acc + (m ? parseFloat(m[1].replace(/,/g, '')) || 0 : 0);
  }, 0);

  const altUnit = data.items.find((i) => i.altQuantity)?.altQuantity?.replace(/[0-9.,\s]/g, '') || 'KG';
  const totalAltQtyFormatted =
    totalAltQtyNumber > 0
      ? `${totalAltQtyNumber.toLocaleString('en-IN', {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })} ${altUnit}`
      : '0.000 KG';

  const totalQuantityCount = data.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  // Tax breakdown helpers
  const effectiveTaxRows = getEffectiveTaxSummary(data);
  const taxTotals = getTaxTotals(effectiveTaxRows);
  const isInterState = isInterStateTax(data);

  const rawGrossTotal = isInclusive
    ? itemsSubtotal
    : itemsSubtotal + taxTotals.totalTaxAmount;
  const isRoundOffEnabled = data.enableRoundOff !== false;
  const totalAmount = isRoundOffEnabled ? Math.round(rawGrossTotal) : Math.round(rawGrossTotal * 100) / 100;

  const autoTaxWords = taxNumberToIndianWords(taxTotals.totalTaxAmount);
  const autoAmountWords = numberToIndianWords(totalAmount);

  const syncTaxFromItems = () => {
    const computed = computeTaxSummaryFromItems(data);
    onChange({
      ...data,
      taxMode: 'auto',
      taxSummary: computed,
    });
  };

  const updateTaxItem = (index: number, key: keyof TaxSummaryItem, val: any) => {
    const currentRows =
      data.taxSummary && data.taxSummary.length > 0
        ? [...data.taxSummary]
        : computeTaxSummaryFromItems(data);
    const updated = [...currentRows];
    const item = { ...updated[index], [key]: val };

    if (key === 'taxableValue' || key === 'cgstRate' || key === 'sgstRate' || key === 'igstRate') {
      const taxable = key === 'taxableValue' ? Number(val) || 0 : Number(item.taxableValue) || 0;
      if (isInterState) {
        const rate = key === 'igstRate' ? Number(val) || 0 : Number(item.igstRate) || 0;
        item.igstAmount = Math.round(taxable * (rate / 100) * 100) / 100;
        item.totalTaxAmount = item.igstAmount;
      } else {
        const cgstR = key === 'cgstRate' ? Number(val) || 0 : Number(item.cgstRate) || 0;
        const sgstR = key === 'sgstRate' ? Number(val) || 0 : Number(item.sgstRate) || 0;
        item.cgstAmount = Math.round(taxable * (cgstR / 100) * 100) / 100;
        item.sgstAmount = Math.round(taxable * (sgstR / 100) * 100) / 100;
        item.totalTaxAmount = Math.round((item.cgstAmount + item.sgstAmount) * 100) / 100;
      }
    } else if (key === 'cgstAmount' || key === 'sgstAmount') {
      const cgstA = key === 'cgstAmount' ? Number(val) || 0 : Number(item.cgstAmount) || 0;
      const sgstA = key === 'sgstAmount' ? Number(val) || 0 : Number(item.sgstAmount) || 0;
      item.totalTaxAmount = Math.round((cgstA + sgstA) * 100) / 100;
    } else if (key === 'igstAmount') {
      item.totalTaxAmount = Number(val) || 0;
    }

    updated[index] = item;
    onChange({
      ...data,
      taxSummary: updated,
    });
  };

  const addTaxRow = () => {
    const currentRows =
      data.taxSummary && data.taxSummary.length > 0
        ? [...data.taxSummary]
        : computeTaxSummaryFromItems(data);
    const newRow: TaxSummaryItem = {
      id: Date.now().toString(),
      hsnSac: '721420',
      taxableValue: 0,
      cgstRate: (data.defaultGstRate || 18) / 2,
      cgstAmount: 0,
      sgstRate: (data.defaultGstRate || 18) / 2,
      sgstAmount: 0,
      igstRate: data.defaultGstRate || 18,
      igstAmount: 0,
      totalTaxAmount: 0,
    };
    onChange({
      ...data,
      taxMode: 'manual',
      taxSummary: [...currentRows, newRow],
    });
  };

  const removeTaxRow = (index: number) => {
    const currentRows =
      data.taxSummary && data.taxSummary.length > 0
        ? [...data.taxSummary]
        : computeTaxSummaryFromItems(data);
    const updated = currentRows.filter((_, idx) => idx !== index);
    onChange({
      ...data,
      taxMode: 'manual',
      taxSummary: updated,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 flex flex-col h-full overflow-hidden text-slate-800">
      {/* Top Header Card - Unique Classic SaaS Header */}
      <div className="bg-slate-50/90 backdrop-blur-xs text-slate-900 px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between border-b border-slate-200/90 gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-xs shadow-blue-500/20 shrink-0">
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight whitespace-nowrap truncate">
                <span className="sm:hidden">Invoice Editor</span>
                <span className="hidden sm:inline">Invoice Studio Editor</span>
              </h2>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 sm:px-2 py-0.5 rounded-full font-bold border border-emerald-200/80 flex items-center gap-1 shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden xs:inline">Live Sync</span>
                <span className="xs:hidden">Live</span>
              </span>
              <span className="hidden md:inline-flex text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                #{data.dispatch?.invoiceNo || 'INV-001'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block truncate">
              Tally Exact GST Tax Invoice Designer & Real-time Live Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onLoadSample}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg flex items-center gap-1 sm:gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Load sample invoice data"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Sample</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg flex items-center gap-1 sm:gap-1.5 transition border border-slate-200 cursor-pointer active:scale-95 shadow-2xs shrink-0"
            title="Clear all fields"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar - Classic Floating Segmented Slider */}
      <div className="bg-slate-50/70 border-b border-slate-200/90 px-2 sm:px-3 py-1.5 flex items-center gap-1 overflow-x-auto text-xs no-scrollbar scroll-smooth">
        {/* Items Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
            activeTab === 'items'
              ? 'bg-white text-blue-700 border-slate-200/90 shadow-2xs font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
          }`}
        >
          <Package className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'items' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Items</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
              activeTab === 'items'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                : 'bg-slate-200/80 text-slate-600'
            }`}
          >
            {data.items.length}
          </span>
        </button>

        {/* Seller Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('seller')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
            activeTab === 'seller'
              ? 'bg-white text-blue-700 border-slate-200/90 shadow-2xs font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
          }`}
        >
          <Building2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'seller' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Seller</span>
        </button>

        {/* Buyer Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('parties')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
            activeTab === 'parties'
              ? 'bg-white text-blue-700 border-slate-200/90 shadow-2xs font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
          }`}
        >
          <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'parties' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Buyer</span>
        </button>

        {/* Dispatch Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
            activeTab === 'dispatch'
              ? 'bg-white text-blue-700 border-slate-200/90 shadow-2xs font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
          }`}
        >
          <Truck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'dispatch' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Dispatch</span>
        </button>

        {/* Tax Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
            activeTab === 'tax'
              ? 'bg-white text-blue-700 border-slate-200/90 shadow-2xs font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
          }`}
        >
          <Percent className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'tax' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Tax & GST</span>
          {data.showTaxSummary && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Tax Table Active"></span>
          )}
        </button>

        {/* Settings Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer border ${
            activeTab === 'settings'
              ? 'bg-white text-blue-700 border-slate-200/90 shadow-2xs font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
          }`}
        >
          <Settings className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Body - Clean, Smooth Touch Scrolling */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* ================= 1. LINE ITEMS TAB ================= */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            {/* Classic Action Bar */}
            <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3 text-slate-800">
              {/* Row 1 on mobile, Left on desktop */}
              <div className="flex items-center justify-between sm:justify-start gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Product Items
                  </h3>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                    {data.items.length} items
                  </span>
                </div>

                {/* View Switcher: Cards vs Table */}
                <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg border border-slate-200 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setItemsViewMode('cards')}
                    className={`px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer ${
                      itemsViewMode === 'cards'
                        ? 'bg-white text-blue-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Card View (best for mobile screens)"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemsViewMode('table')}
                    className={`px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer ${
                      itemsViewMode === 'table'
                        ? 'bg-white text-blue-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Spreadsheet Table View"
                  >
                    <TableIcon className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                </div>
              </div>

              {/* Row 2 on mobile, Right on desktop: Symmetrical Action Buttons */}
              <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setShowProductMaster(true)}
                  className="px-2 py-1.5 text-[11px] sm:text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                  title="Choose from saved Product Library"
                >
                  <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Library</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedColumns(!showAdvancedColumns)}
                  className={`px-2 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg border transition cursor-pointer text-center flex items-center justify-center gap-1 shadow-2xs ${
                    showAdvancedColumns
                      ? 'bg-slate-900 border-slate-900 text-white font-bold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Toggle Tax Rate and Discount columns"
                >
                  <span className="truncate">{showAdvancedColumns ? '− Tax/Disc' : '+ Tax / Disc'}</span>
                </button>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-2.5 py-1.5 text-[11px] sm:text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1 shadow-sm shadow-blue-500/20 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">Add Item</span>
                </button>
              </div>
            </div>

            {/* Product Saved Toast Notification */}
            {savedProductToast && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{savedProductToast}</span>
              </div>
            )}

            {/* DUAL-MODE 1: TOUCH-FRIENDLY CARDS LIST (DEFAULT ON MOBILE) */}
            {itemsViewMode === 'cards' && (
              <div className="space-y-3">
                {data.items.map((item, index) => {
                  const firstLineDesc = item.description ? item.description.split('\n')[0] : '';
                  return (
                    <div
                      key={item.id || index}
                      className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition overflow-hidden"
                    >
                      {/* Card Header Bar */}
                      <div className="bg-slate-50 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                            {index + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-800 truncate">
                            {firstLineDesc || `Item #${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-xs text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md font-mono">
                            ₹ {(Number(item.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSaveItemToLibrary(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Save this item to Product Library"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={data.items.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition disabled:opacity-20 cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Card Input Fields */}
                      <div className="p-3 space-y-2.5">
                        {/* Description */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Description of Goods
                          </label>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="e.g. TATA TISCON 550 SD 8MM"
                            className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                          />
                        </div>

                        {/* HSN and Alt Qty */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              HSN / SAC
                            </label>
                            <input
                              type="text"
                              value={item.hsnSac}
                              onChange={(e) => updateItem(index, 'hsnSac', e.target.value)}
                              placeholder="721420"
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg font-mono text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Alt. Qty (Weight)
                            </label>
                            <input
                              type="text"
                              value={item.altQuantity}
                              onChange={(e) => updateItem(index, 'altQuantity', e.target.value)}
                              placeholder="208.560 KG"
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                            />
                          </div>
                        </div>

                        {/* Quantity, Unit, Rate */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => {
                                updateItem(index, 'unit', e.target.value);
                                updateItem(index, 'per', e.target.value);
                              }}
                              placeholder="PC"
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-center uppercase font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Rate (₹)
                            </label>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', e.target.value)}
                              placeholder="100"
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                            />
                          </div>
                        </div>

                        {/* Optional Advanced columns */}
                        {showAdvancedColumns && (
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                GST %
                              </label>
                              <input
                                type="number"
                                value={item.gstRate !== undefined ? item.gstRate : (data.defaultGstRate ?? 18)}
                                onChange={(e) => updateItem(index, 'gstRate', Number(e.target.value) || 0)}
                                placeholder="18"
                                className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-center font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Rate (Incl. Tax)
                              </label>
                              <input
                                type="text"
                                value={item.rateInclTax || ''}
                                onChange={(e) => updateItem(index, 'rateInclTax', e.target.value)}
                                placeholder="3,956.00"
                                className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Discount %
                              </label>
                              <input
                                type="text"
                                value={item.discountPercent || ''}
                                onChange={(e) => updateItem(index, 'discountPercent', e.target.value)}
                                placeholder="%"
                                className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-center text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              />
                            </div>
                          </div>
                        )}

                        {/* Amount summary row */}
                        <div className="bg-blue-50/50 p-2.5 rounded-lg flex items-center justify-between border border-blue-100">
                          <span className="text-[11px] font-bold text-slate-700">
                            Amount (Qty × Rate):
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateItem(index, 'amount', Number(e.target.value) || 0)}
                              className="w-32 text-right font-extrabold text-xs sm:text-sm text-blue-900 bg-white border border-blue-200 rounded-md px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Big touch-friendly Add Item button */}
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-3 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>+ Add Another Line Item</span>
                </button>
              </div>
            )}

            {/* DUAL-MODE 2: SPREADSHEET DATA GRID (FOR TABLET / LAPTOP / DESKTOP) */}
            {itemsViewMode === 'table' && (
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-2.5 w-8 text-center">#</th>
                      <th className="p-2.5 min-w-[140px]">Description of Goods</th>
                      <th className="p-2.5 w-20 text-center">HSN/SAC</th>
                      <th className="p-2.5 w-24">Alt. Qty</th>
                      <th className="p-2.5 w-16 text-center">Qty</th>
                      <th className="p-2.5 w-14 text-center">Unit</th>
                      <th className="p-2.5 w-20 text-right">Rate (₹)</th>
                      {showAdvancedColumns && (
                        <>
                          <th className="p-2.5 w-16 text-center">GST %</th>
                          <th className="p-2.5 w-24 text-right">Rate(Incl.Tax)</th>
                          <th className="p-2.5 w-16 text-center">Disc%</th>
                        </>
                      )}
                      <th className="p-2.5 w-24 text-right font-extrabold text-slate-800">Amount (₹)</th>
                      <th className="p-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="hover:bg-slate-50/70 transition group"
                      >
                        {/* Sl No */}
                        <td className="p-2 text-center font-bold text-slate-400 group-hover:text-slate-700">
                          {index + 1}
                        </td>

                        {/* Description */}
                        <td className="p-1.5">
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="e.g. TATA TISCON 550 SD 8MM"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg font-semibold text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-y outline-none transition"
                          />
                        </td>

                        {/* HSN/SAC */}
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.hsnSac}
                            onChange={(e) => updateItem(index, 'hsnSac', e.target.value)}
                            placeholder="721420"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg font-mono text-center text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                          />
                        </td>

                        {/* Alt. Qty */}
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.altQuantity}
                            onChange={(e) => updateItem(index, 'altQuantity', e.target.value)}
                            placeholder="208.560 KG"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            placeholder="1"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg font-bold text-center text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                          />
                        </td>

                        {/* Unit */}
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => {
                              updateItem(index, 'unit', e.target.value);
                              updateItem(index, 'per', e.target.value);
                            }}
                            placeholder="PC"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-center uppercase font-semibold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                          />
                        </td>

                        {/* Rate */}
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', e.target.value)}
                            placeholder="100"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg font-mono font-semibold text-right text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                          />
                        </td>

                        {/* Optional Advanced Columns */}
                        {showAdvancedColumns && (
                          <>
                            <td className="p-1.5">
                              <input
                                type="number"
                                value={item.gstRate !== undefined ? item.gstRate : (data.defaultGstRate ?? 18)}
                                onChange={(e) => updateItem(index, 'gstRate', Number(e.target.value) || 0)}
                                placeholder="18"
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-800 focus:border-blue-500 outline-none transition"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.rateInclTax || ''}
                                onChange={(e) => updateItem(index, 'rateInclTax', e.target.value)}
                                placeholder="3,956.00"
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-right text-slate-600 focus:border-blue-500 outline-none transition"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.discountPercent || ''}
                                onChange={(e) => updateItem(index, 'discountPercent', e.target.value)}
                                placeholder="%"
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-center text-slate-600 focus:border-blue-500 outline-none transition"
                              />
                            </td>
                          </>
                        )}

                        {/* Amount */}
                        <td className="p-1.5 text-right">
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateItem(index, 'amount', Number(e.target.value) || 0)}
                            placeholder="100"
                            className="w-full text-xs p-1.5 border border-blue-200 bg-blue-50/40 focus:bg-white rounded-lg font-mono font-bold text-right text-blue-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition"
                          />
                        </td>

                        {/* Actions */}
                        <td className="p-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveItemToLibrary(item)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition cursor-pointer"
                              title="Save to Product Library"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={data.items.length <= 1}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition disabled:opacity-20 cursor-pointer"
                              title="Delete line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200 text-xs">
                      <td colSpan={2} className="p-2.5 text-slate-600 font-semibold">
                        Total ({data.items.length} items)
                      </td>
                      <td></td>
                      <td className="p-2.5 text-slate-700 whitespace-nowrap font-mono">
                        {totalAltQtyFormatted}
                      </td>
                      <td className="p-2.5 text-center text-slate-800 font-bold">
                        {totalQuantityCount}
                      </td>
                      <td colSpan={showAdvancedColumns ? 4 : 2}></td>
                      <td className="p-2.5 text-right font-extrabold text-blue-900 text-sm whitespace-nowrap font-mono">
                        ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Total Summary Banner (Shared between Card & Table view) - Classic Executive Financial Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 space-y-3.5">
              {/* Row 1: 3 balanced metric columns */}
              <div className="grid grid-cols-3 gap-2.5 text-center pb-3 border-b border-slate-800">
                <div className="bg-slate-800/70 rounded-xl py-2 px-2 border border-slate-700/60">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5">
                    Total Items
                  </span>
                  <span className="font-extrabold text-white text-xs sm:text-sm font-mono">
                    {data.items.length}
                  </span>
                </div>

                <div className="bg-slate-800/70 rounded-xl py-2 px-2 border border-slate-700/60">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5">
                    Total Qty
                  </span>
                  <span className="font-extrabold text-white text-xs sm:text-sm font-mono">
                    {totalQuantityCount}
                  </span>
                </div>

                <div className="bg-slate-800/70 rounded-xl py-2 px-2 border border-slate-700/60">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5">
                    Total Weight
                  </span>
                  <span className="font-extrabold text-blue-300 text-xs sm:text-sm truncate block font-mono">
                    {totalAltQtyFormatted}
                  </span>
                </div>
              </div>

              {/* Row 2: Gross Total full width, balanced left and right */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Gross Invoice Total
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    All Taxes & Charges Included
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-black text-emerald-400 text-lg sm:text-2xl tracking-tight font-mono block">
                    ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium line-clamp-1">
                    {numberToIndianWords(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. SELLER / COMPANY TAB ================= */}
        {activeTab === 'seller' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Company / Biller Profile
                </h3>
                <p className="text-[11px] text-slate-500">
                  Seller & Bank details appearing on the invoice
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveCompanyProfile}
                  className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
                  title="Save current details as permanent company profile"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Default</span>
                </button>
                <button
                  type="button"
                  onClick={loadCompanyProfile}
                  className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md flex items-center gap-1 font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
                  title="Load your saved permanent company profile"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Load Saved Profile</span>
                </button>
              </div>
            </div>

            {profileToast && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileToast}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Trade Name (Bold on Invoice)
                </label>
                <input
                  type="text"
                  value={data.seller.name}
                  onChange={(e) => updateSeller('name', e.target.value)}
                  placeholder="e.g. ACME Enterprise / Your Company Name"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={data.seller.addressLine1}
                  onChange={(e) => updateSeller('addressLine1', e.target.value)}
                  placeholder="e.g. 101, Business Park, M.G. Road"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address Line 2 (City / Landmark)
                </label>
                <input
                  type="text"
                  value={data.seller.addressLine2}
                  onChange={(e) => updateSeller('addressLine2', e.target.value)}
                  placeholder="e.g. Andheri East, Mumbai"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    GSTIN / UIN Number
                  </label>
                  <span className="text-[10px] text-blue-600 font-medium">
                    ⚡ Auto-detects State
                  </span>
                </div>
                <input
                  type="text"
                  value={data.seller.gstin}
                  onChange={(e) => updateSeller('gstin', e.target.value)}
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
                {data.seller.gstin && (() => {
                  const info = analyzeGstin(data.seller.gstin);
                  if (info.isValid) {
                    return (
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        Valid GSTIN ({info.stateName})
                      </p>
                    );
                  }
                  if (info.stateName) {
                    return (
                      <p className="text-[10px] text-blue-600 font-medium mt-1">
                        Auto-detected: <strong>{info.stateName} ({info.stateCode})</strong>
                      </p>
                    );
                  }
                  return (
                    <p className="text-[10px] text-amber-600 mt-1">
                      {info.errorMessage}
                    </p>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={data.seller.email}
                  onChange={(e) => updateSeller('email', e.target.value)}
                  placeholder="e.g. billing@yourcompany.com"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State Name
                </label>
                <input
                  type="text"
                  value={data.seller.stateName}
                  onChange={(e) => updateSeller('stateName', e.target.value)}
                  placeholder="Uttar Pradesh"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  value={data.seller.stateCode}
                  onChange={(e) => updateSeller('stateCode', e.target.value)}
                  placeholder="09"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            {/* Bank Details & Payment QR Section in Seller Tab */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between pb-2 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                    Company&apos;s Bank Details & Payment QR
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Appears directly above Declaration on invoice with auto-generated QR code
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.bankDetails?.showBankDetails !== false}
                    onChange={(e) => updateBankDetails('showBankDetails', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {data.bankDetails?.showBankDetails !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={data.bankDetails?.bankName || ''}
                      onChange={(e) => updateBankDetails('bankName', e.target.value)}
                      placeholder="e.g. State Bank of India, HDFC Bank"
                      className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Number (A/c No.)
                    </label>
                    <input
                      type="text"
                      value={data.bankDetails?.accountNo || ''}
                      onChange={(e) => updateBankDetails('accountNo', e.target.value)}
                      placeholder="e.g. 381928371928"
                      className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Branch & IFS Code
                    </label>
                    <input
                      type="text"
                      value={data.bankDetails?.branchAndIfsc || ''}
                      onChange={(e) => updateBankDetails('branchAndIfsc', e.target.value)}
                      placeholder="e.g. Main Branch & SBIN0001234"
                      className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI ID (Pay) - Auto-generates QR
                    </label>
                    <input
                      type="text"
                      value={data.bankDetails?.upiId || ''}
                      onChange={(e) => updateBankDetails('upiId', e.target.value)}
                      placeholder="e.g. yourbusiness@upi"
                      className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        Show &quot;SCAN TO PAY&quot; QR Code
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Live UPI QR generated from UPI ID)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={data.bankDetails?.showQrCode !== false}
                      onChange={(e) => updateBankDetails('showQrCode', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 3. PARTIES TAB ================= */}
        {activeTab === 'parties' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Client / Customer Details
                </h3>
                <p className="text-[11px] text-slate-500">
                  Consignee (Ship to) and Buyer (Bill to) information
                </p>
              </div>

              <button
                type="button"
                onClick={copyConsigneeToBuyer}
                className="px-2.5 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md flex items-center gap-1.5 transition font-semibold cursor-pointer active:scale-95"
                title="Copy Consignee details to Buyer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sync Consignee → Buyer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Consignee (Ship to) */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    Consignee (Ship to)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Consignee Name
                  </label>
                  <input
                    type="text"
                    value={data.consignee.name}
                    onChange={(e) => updateConsignee('name', e.target.value)}
                    placeholder="e.g. M/s ABC Enterprises / Client Name"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Shipping Address
                  </label>
                  <textarea
                    rows={2}
                    value={data.consignee.address}
                    onChange={(e) => updateConsignee('address', e.target.value)}
                    placeholder="e.g. Plot No. 45, Industrial Area, Phase-2"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      GSTIN / UIN (Optional)
                    </label>
                    <span className="text-[10px] text-blue-600 font-medium">⚡ Auto State</span>
                  </div>
                  <input
                    type="text"
                    value={data.consignee.gstin || ''}
                    onChange={(e) => updateConsignee('gstin', e.target.value)}
                    placeholder="e.g. 09AABCM1234F1Z5"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-mono uppercase font-bold text-slate-800 outline-none focus:border-blue-500"
                  />
                  {data.consignee.gstin && (() => {
                    const info = analyzeGstin(data.consignee.gstin);
                    if (info.stateName) {
                      return (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          ✓ {info.stateName} ({info.stateCode})
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      State Name
                    </label>
                    <input
                      type="text"
                      value={data.consignee.stateName}
                      onChange={(e) => updateConsignee('stateName', e.target.value)}
                      placeholder="e.g. Uttar Pradesh"
                      className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      State Code
                    </label>
                    <input
                      type="text"
                      value={data.consignee.stateCode}
                      onChange={(e) => updateConsignee('stateCode', e.target.value)}
                      placeholder="09"
                      className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer (Bill to) */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">
                      Buyer (Bill to)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCustomerMaster(true)}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Users className="w-3 h-3 text-blue-600" />
                      <span>Party Directory</span>
                    </button>
                    {data.buyer.name && (
                      <button
                        type="button"
                        onClick={handleSaveBuyerToDirectory}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        title="Save to Customer Directory"
                      >
                        <span>Save Party</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    value={data.buyer.name}
                    onChange={(e) => updateBuyer('name', e.target.value)}
                    placeholder="e.g. M/s ABC Enterprises / Client Name"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Billing Address
                  </label>
                  <textarea
                    rows={2}
                    value={data.buyer.address}
                    onChange={(e) => updateBuyer('address', e.target.value)}
                    placeholder="e.g. Plot No. 45, Industrial Area, Phase-2"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      GSTIN / UIN (Optional)
                    </label>
                    <span className="text-[10px] text-blue-600 font-medium">⚡ Auto State</span>
                  </div>
                  <input
                    type="text"
                    value={data.buyer.gstin || ''}
                    onChange={(e) => updateBuyer('gstin', e.target.value)}
                    placeholder="09AABCM1234F1Z5"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-mono uppercase font-bold text-slate-800 outline-none focus:border-blue-500"
                  />
                  {data.buyer.gstin && (() => {
                    const info = analyzeGstin(data.buyer.gstin);
                    if (info.stateName) {
                      return (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          ✓ {info.stateName} ({info.stateCode})
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      State Name
                    </label>
                    <input
                      type="text"
                      value={data.buyer.stateName}
                      onChange={(e) => updateBuyer('stateName', e.target.value)}
                      placeholder="Uttar Pradesh"
                      className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      State Code
                    </label>
                    <input
                      type="text"
                      value={data.buyer.stateCode}
                      onChange={(e) => updateBuyer('stateCode', e.target.value)}
                      placeholder="09"
                      className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. DISPATCH TAB ================= */}
        {activeTab === 'dispatch' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Invoice & Dispatch Logistics
              </h3>
              <p className="text-[11px] text-slate-500">
                Invoice numbers, dates, transport vehicle and destination
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Invoice Number
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = getNextInvoiceNo(data.dispatch.invoiceNo);
                      updateDispatch('invoiceNo', next);
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer active:scale-95"
                    title="Automatically increment sequence number preserving prefix (e.g. INV/089 → INV/090)"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>Auto Next (#{getNextInvoiceNo(data.dispatch.invoiceNo)})</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={data.dispatch.invoiceNo}
                  onChange={(e) => updateDispatch('invoiceNo', e.target.value)}
                  placeholder="e.g. 74 or INV-001 or INV/24-25/089"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Auto-Sequence preserves prefixes & zeros (e.g. INV/089 → INV/090)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Dated
                </label>
                <input
                  type="text"
                  value={data.dispatch.invoiceDate}
                  onChange={(e) => updateDispatch('invoiceDate', e.target.value)}
                  placeholder="e.g. 14-Oct-26"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatched Through
                </label>
                <input
                  type="text"
                  value={data.dispatch.dispatchedThrough}
                  onChange={(e) => updateDispatch('dispatchedThrough', e.target.value)}
                  placeholder="e.g. By Road / Transport / Courier"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg uppercase font-bold text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination (Site / City)
                </label>
                <input
                  type="text"
                  value={data.dispatch.destination}
                  onChange={(e) => updateDispatch('destination', e.target.value)}
                  placeholder="e.g. Site / Destination City"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg uppercase font-bold text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Document No.
                </label>
                <input
                  type="text"
                  value={data.dispatch.dispatchDocNo}
                  onChange={(e) => updateDispatch('dispatchDocNo', e.target.value)}
                  placeholder="e.g. LR-1024 or Doc No"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Note Date
                </label>
                <input
                  type="text"
                  value={data.dispatch.deliveryNoteDate}
                  onChange={(e) => updateDispatch('deliveryNoteDate', e.target.value)}
                  placeholder=""
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer's Order No.
                </label>
                <input
                  type="text"
                  value={data.dispatch.buyersOrderNo}
                  onChange={(e) => updateDispatch('buyersOrderNo', e.target.value)}
                  placeholder=""
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order Dated
                </label>
                <input
                  type="text"
                  value={data.dispatch.orderDate}
                  onChange={(e) => updateDispatch('orderDate', e.target.value)}
                  placeholder=""
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terms of Delivery
                </label>
                <textarea
                  rows={2}
                  value={data.dispatch.termsOfDelivery}
                  onChange={(e) => updateDispatch('termsOfDelivery', e.target.value)}
                  placeholder="Delivery terms..."
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. TAX & GST TAB ================= */}
        {activeTab === 'tax' && (
          <div className="space-y-3.5 sm:space-y-4">
            {/* Main Header / Enable Tax Table Switch */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-900 text-white p-3 sm:p-4 rounded-xl border border-slate-800 shadow-sm flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 mt-0.5 sm:mt-0">
                  <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      HSN/SAC Tax Breakdown Table
                    </h3>
                    <span
                      className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        data.showTaxSummary
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-700/60 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {data.showTaxSummary ? 'Active on Invoice' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 leading-snug">
                    Renders CGST + SGST (or IGST) tax analysis table below items matching GST & Tally standards
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5 sm:mt-0" title="Toggle Tax Summary Table">
                <input
                  type="checkbox"
                  id="toggle-show-tax-summary"
                  checked={data.showTaxSummary}
                  onChange={(e) => onChange({ ...data, showTaxSummary: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 sm:w-11 h-5 sm:h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Quick Tax Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {/* 1. Tax Calculation Mode */}
              <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Calculation Mode
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxMode: 'auto', taxSummary: [] })}
                    className={`py-1.5 px-1.5 rounded-md transition cursor-pointer text-center text-[11px] sm:text-xs ${
                      data.taxMode !== 'manual'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Auto (Live Sync)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxMode: 'manual', taxSummary: effectiveTaxRows })}
                    className={`py-1.5 px-1.5 rounded-md transition cursor-pointer text-center text-[11px] sm:text-xs ${
                      data.taxMode === 'manual'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Manual Edit
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {data.taxMode === 'manual'
                    ? 'Manually edit exact HSN codes, rates, and amounts below.'
                    : 'Automatically calculates HSN groups & taxes from items table.'}
                </p>
              </div>

              {/* 2. Tax Structure (CGST+SGST vs IGST) */}
              <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Tax Structure
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxType: 'cgst_sgst' })}
                    className={`py-1.5 px-1 rounded-md transition cursor-pointer text-center text-[10px] xs:text-[11px] truncate ${
                      data.taxType === 'cgst_sgst' || !data.taxType
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Central GST + State GST (Intra-state, e.g. UP to UP)"
                  >
                    CGST+SGST
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxType: 'igst' })}
                    className={`py-1.5 px-1 rounded-md transition cursor-pointer text-center text-[10px] xs:text-[11px] truncate ${
                      data.taxType === 'igst'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Integrated GST (Inter-state sales)"
                  >
                    IGST
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxType: 'auto' })}
                    className={`py-1.5 px-1 rounded-md transition cursor-pointer text-center text-[10px] xs:text-[11px] truncate ${
                      data.taxType === 'auto'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Auto-detect based on state codes"
                  >
                    Auto State
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {isInterState ? 'Inter-state: Integrated Tax (IGST)' : 'Intra-state: CGST (9%) + SGST (9%)'}
                </p>
              </div>

              {/* 3. Pricing Mode (Inclusive vs Exclusive) */}
              <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-xl border border-slate-200 space-y-1.5 sm:col-span-2 lg:col-span-1">
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Item Price Basis
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, pricingMode: 'inclusive' })}
                    className={`py-1.5 px-1.5 rounded-md transition cursor-pointer text-center text-[11px] sm:text-xs ${
                      data.pricingMode === 'inclusive' || !data.pricingMode
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Inclusive (MRP)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, pricingMode: 'exclusive' })}
                    className={`py-1.5 px-1.5 rounded-md transition cursor-pointer text-center text-[11px] sm:text-xs ${
                      data.pricingMode === 'exclusive'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Exclusive (+ Tax)
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {data.pricingMode === 'exclusive'
                    ? 'GST is added on top of item amounts.'
                    : 'Item total already includes GST (Taxable = Amount / 1.18).'}
                </p>
              </div>
            </div>

            {/* Default GST Rate Quick Pills */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 block">Default GST Rate</span>
                <span className="text-[11px] text-slate-500 block">Applied to items without custom GST %</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: '18% (9+9)', val: 18 },
                  { label: '12% (6+6)', val: 12 },
                  { label: '5% (2.5+2.5)', val: 5 },
                  { label: '28% (14+14)', val: 28 },
                  { label: '0%', val: 0 },
                ].map((tier) => (
                  <button
                    key={tier.val}
                    type="button"
                    onClick={() => onChange({ ...data, defaultGstRate: tier.val })}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition cursor-pointer ${
                      (data.defaultGstRate ?? 18) === tier.val
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HSN/SAC Tax Summary Table Card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="bg-slate-50 px-3 sm:px-4 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    HSN/SAC Breakdown Entries
                  </h4>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                    {effectiveTaxRows.length} {effectiveTaxRows.length === 1 ? 'row' : 'rows'}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={syncTaxFromItems}
                    className="flex-1 sm:flex-initial px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                    title="Recalculate summary live from items table"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Sync from Items</span>
                  </button>
                  {data.taxMode === 'manual' && (
                    <button
                      type="button"
                      onClick={addTaxRow}
                      className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>Add HSN Row</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Swipe Hint */}
              <div className="sm:hidden px-3 py-1 bg-blue-50/70 border-b border-blue-100/60 text-[10px] text-blue-700 flex items-center justify-between">
                <span>Swipe table horizontally for all tax columns</span>
                <span className="font-bold">⇄</span>
              </div>

              {/* Table / Row List */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[11px] font-semibold whitespace-nowrap">
                      <th className="p-2 min-w-[85px]">HSN/SAC</th>
                      <th className="p-2 text-right min-w-[110px]">Taxable Value (₹)</th>
                      {isInterState ? (
                        <>
                          <th className="p-2 text-center min-w-[70px]">IGST Rate</th>
                          <th className="p-2 text-right min-w-[95px]">IGST Amt (₹)</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 text-center min-w-[65px]">CGST %</th>
                          <th className="p-2 text-right min-w-[95px]">CGST Amt (₹)</th>
                          <th className="p-2 text-center min-w-[65px]">SGST %</th>
                          <th className="p-2 text-right min-w-[95px]">SGST Amt (₹)</th>
                        </>
                      )}
                      <th className="p-2 text-right min-w-[110px] font-bold text-blue-700">Total Tax (₹)</th>
                      {data.taxMode === 'manual' && <th className="p-2 w-10 text-center"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                    {effectiveTaxRows.map((row, idx) => (
                      <tr key={row.id || row.hsnSac || idx} className="hover:bg-slate-50/80 transition">
                        {/* HSN/SAC */}
                        <td className="p-2">
                          {data.taxMode === 'manual' ? (
                            <input
                              type="text"
                              value={row.hsnSac}
                              onChange={(e) => updateTaxItem(idx, 'hsnSac', e.target.value)}
                              placeholder="721420"
                              className="w-full p-1 border border-slate-200 rounded font-mono font-bold text-slate-800 text-xs outline-none focus:border-blue-500"
                            />
                          ) : (
                            <span className="font-mono font-bold text-slate-800">{row.hsnSac}</span>
                          )}
                        </td>

                        {/* Taxable Value */}
                        <td className="p-2 text-right">
                          {data.taxMode === 'manual' ? (
                            <input
                              type="number"
                              step="0.01"
                              value={row.taxableValue}
                              onChange={(e) => updateTaxItem(idx, 'taxableValue', e.target.value)}
                              className="w-full p-1 border border-slate-200 rounded text-right font-semibold text-slate-800 text-xs outline-none focus:border-blue-500"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">
                              ₹ {formatIndianCurrency(row.taxableValue)}
                            </span>
                          )}
                        </td>

                        {isInterState ? (
                          <>
                            <td className="p-2 text-center">
                              {data.taxMode === 'manual' ? (
                                <input
                                  type="number"
                                  value={row.igstRate || 0}
                                  onChange={(e) => updateTaxItem(idx, 'igstRate', e.target.value)}
                                  className="w-14 p-1 border border-slate-200 rounded text-center text-xs outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span>{row.igstRate || 0}%</span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {data.taxMode === 'manual' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.igstAmount || row.totalTaxAmount}
                                  onChange={(e) => updateTaxItem(idx, 'igstAmount', e.target.value)}
                                  className="w-full p-1 border border-slate-200 rounded text-right text-xs outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span>₹ {formatIndianCurrency(row.igstAmount || row.totalTaxAmount)}</span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 text-center">
                              {data.taxMode === 'manual' ? (
                                <input
                                  type="number"
                                  value={row.cgstRate}
                                  onChange={(e) => updateTaxItem(idx, 'cgstRate', e.target.value)}
                                  className="w-14 p-1 border border-slate-200 rounded text-center text-xs outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span>{row.cgstRate}%</span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {data.taxMode === 'manual' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.cgstAmount}
                                  onChange={(e) => updateTaxItem(idx, 'cgstAmount', e.target.value)}
                                  className="w-full p-1 border border-slate-200 rounded text-right text-xs outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span>₹ {formatIndianCurrency(row.cgstAmount)}</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {data.taxMode === 'manual' ? (
                                <input
                                  type="number"
                                  value={row.sgstRate}
                                  onChange={(e) => updateTaxItem(idx, 'sgstRate', e.target.value)}
                                  className="w-14 p-1 border border-slate-200 rounded text-center text-xs outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span>{row.sgstRate}%</span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {data.taxMode === 'manual' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.sgstAmount}
                                  onChange={(e) => updateTaxItem(idx, 'sgstAmount', e.target.value)}
                                  className="w-full p-1 border border-slate-200 rounded text-right text-xs outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span>₹ {formatIndianCurrency(row.sgstAmount)}</span>
                              )}
                            </td>
                          </>
                        )}

                        {/* Total Tax Amount */}
                        <td className="p-2 text-right font-bold text-blue-700">
                          ₹ {formatIndianCurrency(row.totalTaxAmount)}
                        </td>

                        {data.taxMode === 'manual' && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeTaxRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>

                  {/* Table Footer Totals */}
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900 text-xs whitespace-nowrap">
                      <td className="p-2 text-right uppercase">Total:</td>
                      <td className="p-2 text-right">₹ {formatIndianCurrency(taxTotals.totalTaxableValue)}</td>
                      {isInterState ? (
                        <>
                          <td></td>
                          <td className="p-2 text-right">
                            ₹ {formatIndianCurrency(taxTotals.totalIgstAmount || taxTotals.totalTaxAmount)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td></td>
                          <td className="p-2 text-right">₹ {formatIndianCurrency(taxTotals.totalCgstAmount)}</td>
                          <td></td>
                          <td className="p-2 text-right">₹ {formatIndianCurrency(taxTotals.totalSgstAmount)}</td>
                        </>
                      )}
                      <td className="p-2 text-right text-blue-700 font-extrabold text-sm">
                        ₹ {formatIndianCurrency(taxTotals.totalTaxAmount)}
                      </td>
                      {data.taxMode === 'manual' && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile Quick Summary Card (visible on mobile < 640px) */}
              <div className="sm:hidden bg-slate-50 p-3 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Tax Summary At A Glance</span>
                  <span className="text-blue-700 font-mono font-extrabold">₹ {formatIndianCurrency(taxTotals.totalTaxAmount)} Tax</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Taxable Value</span>
                    <span className="font-bold text-slate-800">₹ {formatIndianCurrency(taxTotals.totalTaxableValue)}</span>
                  </div>
                  {isInterState ? (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Total IGST</span>
                      <span className="font-bold text-blue-700">₹ {formatIndianCurrency(taxTotals.totalIgstAmount || taxTotals.totalTaxAmount)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">CGST (9%)</span>
                        <span className="font-bold text-blue-700">₹ {formatIndianCurrency(taxTotals.totalCgstAmount)}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">SGST (9%)</span>
                        <span className="font-bold text-blue-700">₹ {formatIndianCurrency(taxTotals.totalSgstAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Round Off Setting */}
            <div className="bg-slate-50/90 p-3 sm:p-4 rounded-xl border border-slate-200 flex items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800">
                    Automatic Round Off (Round to Nearest ₹)
                  </h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                    data.enableRoundOff !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {data.enableRoundOff !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Eliminates decimal paise in Net Payable total on invoice (e.g. ₹ 4,42,290.48 → ₹ 4,42,290.00)
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5 sm:mt-0">
                <input
                  type="checkbox"
                  checked={data.enableRoundOff !== false}
                  onChange={(e) => onChange({ ...data, enableRoundOff: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* In Words & Signatory Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tax Amount in Words */}
              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Tax Amount (in words)
                </label>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-900 break-words leading-relaxed">
                  {autoTaxWords}
                </div>
                <input
                  type="text"
                  value={data.customTaxAmountInWords || ''}
                  onChange={(e) => onChange({ ...data, customTaxAmountInWords: e.target.value })}
                  placeholder="Custom override (Leave blank for automatic)"
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                />
                <p className="text-[10px] text-slate-500">
                  Matches: "INR Six Thousand Thirty Four and Fifty Eight paise Only"
                </p>
              </div>

              {/* Amount Chargeable in Words */}
              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Amount Chargeable (in words)
                </label>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-800 break-words leading-relaxed">
                  {autoAmountWords}
                </div>
                <input
                  type="text"
                  value={data.customAmountInWords || ''}
                  onChange={(e) => onChange({ ...data, customAmountInWords: e.target.value })}
                  placeholder="Custom override (Leave blank for automatic)"
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                />
                <p className="text-[10px] text-slate-500">
                  Matches: "INR Thirty Nine Thousand Five Hundred Sixty Only"
                </p>
              </div>
            </div>

            {/* Declaration & Signatory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Declaration Statement
                </label>
                <textarea
                  rows={3}
                  value={data.declaration}
                  onChange={(e) => onChange({ ...data, declaration: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Authorised Signatory Company Name
                </label>
                <input
                  type="text"
                  value={data.signatoryCompany || ''}
                  onChange={(e) => onChange({ ...data, signatoryCompany: e.target.value })}
                  placeholder={`Defaults to seller name (${data.seller.name || 'BHANU TRADERS'})`}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white font-bold"
                />
                <p className="text-[10px] text-slate-500">
                  Appears as: <span className="font-bold">for {data.signatoryCompany?.trim() || data.seller.name || 'BHANU TRADERS'}</span>
                </p>
              </div>
            </div>

            {/* Bank Details & UPI QR inside Tax tab */}
            <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Company&apos;s Bank Details & Payment QR
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Shows bank account info & QR code directly above Declaration on invoice
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.bankDetails?.showBankDetails !== false}
                    onChange={(e) => updateBankDetails('showBankDetails', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {data.bankDetails?.showBankDetails !== false && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={data.bankDetails?.bankName || ''}
                      onChange={(e) => updateBankDetails('bankName', e.target.value)}
                      placeholder="e.g. State Bank of India, HDFC Bank"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Number (A/c No.)
                    </label>
                    <input
                      type="text"
                      value={data.bankDetails?.accountNo || ''}
                      onChange={(e) => updateBankDetails('accountNo', e.target.value)}
                      placeholder="e.g. 381928371928"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Branch & IFS Code
                    </label>
                    <input
                      type="text"
                      value={data.bankDetails?.branchAndIfsc || ''}
                      onChange={(e) => updateBankDetails('branchAndIfsc', e.target.value)}
                      placeholder="e.g. Main Branch & SBIN0001234"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      UPI ID (Pay) - Generates QR Code
                    </label>
                    <input
                      type="text"
                      value={data.bankDetails?.upiId || ''}
                      onChange={(e) => updateBankDetails('upiId', e.target.value)}
                      placeholder="e.g. yourbusiness@upi"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold text-blue-700 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        Show &quot;SCAN TO PAY&quot; QR Code
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Live UPI QR generated from UPI ID)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={data.bankDetails?.showQrCode !== false}
                      onChange={(e) => updateBankDetails('showQrCode', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 6. SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Document Settings & Declarations
              </h3>
              <p className="text-[11px] text-slate-500">
                Custom titles, tax summary options, and legal declarations
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => onChange({ ...data, title: e.target.value })}
                placeholder="Tax Invoice"
                className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Amount in Words (Leave blank for automatic calculation)
              </label>
              <input
                type="text"
                value={data.customAmountInWords || ''}
                onChange={(e) => onChange({ ...data, customAmountInWords: e.target.value })}
                placeholder="e.g. INR Forty-Four Thousand Two Hundred Ninety Only"
                className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono text-[11px] outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                By default, the Indian numbering system automatically writes out the amount in words.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Show HSN/SAC Tax Summary Table
                </span>
                <span className="text-[11px] text-slate-500">
                  Adds CGST 9% + SGST 9% breakdown row below items
                </span>
              </div>
              <input
                type="checkbox"
                id="showTaxSummary"
                checked={data.showTaxSummary}
                onChange={(e) => onChange({ ...data, showTaxSummary: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Declaration Statement
              </label>
              <textarea
                rows={3}
                value={data.declaration}
                onChange={(e) => onChange({ ...data, declaration: e.target.value })}
                className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Product Master Quick Selection Modal */}
      {showProductMaster && (
        <ProductMasterModal
          isOpen={showProductMaster}
          onClose={() => setShowProductMaster(false)}
          onSelectItem={handleSelectFromLibrary}
        />
      )}

      {/* Customer / Party Master Directory Modal */}
      {showCustomerMaster && (
        <CustomerMasterModal
          isOpen={showCustomerMaster}
          onClose={() => setShowCustomerMaster(false)}
          onSelectCustomer={handleSelectCustomer}
          currentBuyerName={data.buyer.name}
        />
      )}
    </div>
  );
};
