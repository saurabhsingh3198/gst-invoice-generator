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
} from 'lucide-react';
import { formatIndianCurrency, numberToIndianWords, taxNumberToIndianWords } from '../utils/numberToWords';
import {
  computeTaxSummaryFromItems,
  getEffectiveTaxSummary,
  getTaxTotals,
  isInterStateTax,
} from '../utils/taxCalculation';

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
  const [itemsViewMode, setItemsViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  // Helper updates
  const updateSeller = (key: keyof InvoiceData['seller'], val: string) => {
    onChange({
      ...data,
      seller: { ...data.seller, [key]: val },
    });
  };

  const updateConsignee = (key: keyof InvoiceData['consignee'], val: string) => {
    onChange({
      ...data,
      consignee: { ...data.consignee, [key]: val },
    });
  };

  const updateBuyer = (key: keyof InvoiceData['buyer'], val: string) => {
    onChange({
      ...data,
      buyer: { ...data.buyer, [key]: val },
    });
  };

  const updateDispatch = (key: keyof InvoiceData['dispatch'], val: string) => {
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

  const updateBankDetails = (key: keyof NonNullable<InvoiceData['bankDetails']>, val: any) => {
    const current = data.bankDetails || {
      showBankDetails: true,
      bankName: 'STATE BANK OF INDIA',
      accountNo: '381928371928',
      branchAndIfsc: 'NAUSAD GORAKHPUR & SBIN0001234',
      upiId: '8896925131@naviaxis',
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
      rateInclTax: '',
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

  const updateItem = (index: number, key: keyof InvoiceItem, val: any) => {
    const updated = [...data.items];
    const current = { ...updated[index], [key]: val };

    // Auto calculate amount when rate or quantity or discount changes
    if (key === 'rate' || key === 'quantity' || key === 'discountPercent') {
      const q = key === 'quantity' ? Number(val) || 0 : Number(current.quantity) || 0;
      const r = key === 'rate' ? Number(val) || 0 : Number(current.rate) || 0;
      const disc = key === 'discountPercent' ? Number(val) || 0 : Number(current.discountPercent) || 0;
      let calculated = q * r;
      if (disc > 0) {
        calculated = calculated - (calculated * disc) / 100;
      }
      current.amount = Math.round(calculated * 100) / 100;
    }

    updated[index] = current;
    onChange({
      ...data,
      items: updated,
    });
  };

  const totalAmount = data.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

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

  const autoTaxWords = taxNumberToIndianWords(taxTotals.totalTaxAmount);
  const autoAmountWords = numberToIndianWords(totalAmount);

  const syncTaxFromItems = () => {
    const computed = computeTaxSummaryFromItems(data);
    onChange({
      ...data,
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 flex flex-col h-full overflow-hidden">
      {/* Top Header Card - Classic Executive Styling */}
      <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Invoice Editor
              </h2>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Sync
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden xs:block sm:block">Tally A4 GST Tax Invoice Designer</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
            title="Load sample invoice from photo"
          >
            <Sparkles className="w-3 h-3 text-indigo-200" />
            <span>Sample</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center gap-1 transition border border-slate-700 cursor-pointer active:scale-95"
            title="Clear all fields"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar - Sleek, Classic, Perfectly Spaced */}
      <div className="bg-slate-50 border-b border-slate-200 px-1.5 sm:px-2 py-1 flex items-center gap-1 overflow-x-auto text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'items'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5 shrink-0" />
          <span>Items</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
              activeTab === 'items'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {data.items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seller')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'seller'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span>Seller</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parties')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'parties'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>Buyer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'dispatch'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5 shrink-0" />
          <span>Dispatch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'tax'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-3.5 h-3.5 shrink-0" />
          <span>Tax & GST</span>
          {data.showTaxSummary && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Tax Table Active"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Body - Clean, Smooth Touch Scrolling */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* ================= 1. LINE ITEMS TAB ================= */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            {/* Classic Action Bar: Zero Jagged Wrapping, Perfectly Symmetrical */}
            <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
              {/* Row 1 on mobile, Left on desktop */}
              <div className="flex items-center justify-between sm:justify-start gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Product Items
                  </h3>
                  <span className="text-[10px] font-extrabold text-slate-600 bg-slate-200/80 px-1.5 py-0.2 rounded-full">
                    {data.items.length}
                  </span>
                </div>

                {/* View Switcher: Cards vs Table */}
                <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg border border-slate-300/80 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setItemsViewMode('cards')}
                    className={`px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer ${
                      itemsViewMode === 'cards'
                        ? 'bg-white text-indigo-700 font-bold shadow-2xs'
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
                        ? 'bg-white text-indigo-700 font-bold shadow-2xs'
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
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAdvancedColumns(!showAdvancedColumns)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer text-center flex items-center justify-center gap-1 ${
                    showAdvancedColumns
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Toggle Tax Rate and Discount columns"
                >
                  <span>{showAdvancedColumns ? '− Tax/Disc' : '+ Tax / Disc'}</span>
                </button>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            {/* DUAL-MODE 1: TOUCH-FRIENDLY CARDS LIST (DEFAULT ON MOBILE) */}
            {itemsViewMode === 'cards' && (
              <div className="space-y-3">
                {data.items.map((item, index) => {
                  const firstLineDesc = item.description ? item.description.split('\n')[0] : '';
                  return (
                    <div
                      key={item.id || index}
                      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition overflow-hidden"
                    >
                      {/* Card Header Bar */}
                      <div className="bg-slate-50/90 px-3 py-2 border-b border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-800 truncate">
                            {firstLineDesc || `Item #${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-xs text-indigo-700 bg-indigo-50/80 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                            ₹ {(Number(item.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
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
                            className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg font-mono text-slate-700 focus:border-indigo-500 outline-none"
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
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-indigo-500 outline-none"
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
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg font-bold text-slate-900 focus:border-indigo-500 outline-none"
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
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-center uppercase font-bold text-slate-800 focus:border-indigo-500 outline-none"
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
                              className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:border-indigo-500 outline-none"
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
                                className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-center font-bold text-slate-800 outline-none focus:border-indigo-500"
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
                                className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-indigo-500"
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
                                className="w-full text-sm sm:text-xs p-2 border border-slate-200 rounded-lg text-center text-slate-600 outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Amount summary row */}
                        <div className="bg-slate-50/80 p-2 rounded-lg flex items-center justify-between border border-slate-200/70">
                          <span className="text-[11px] font-medium text-slate-500">
                            Amount (Qty × Rate):
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateItem(index, 'amount', Number(e.target.value) || 0)}
                              className="w-32 text-right font-extrabold text-xs sm:text-sm text-indigo-700 bg-white border border-indigo-200 rounded px-2 py-1 focus:border-indigo-500 outline-none"
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
                  className="w-full py-3 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Line Item</span>
                </button>
              </div>
            )}

            {/* DUAL-MODE 2: SPREADSHEET DATA GRID (FOR TABLET / LAPTOP / DESKTOP) */}
            {itemsViewMode === 'table' && (
              <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 text-[11px] font-semibold">
                      <th className="p-2 w-7 text-center">#</th>
                      <th className="p-2 min-w-[140px]">Description of Goods</th>
                      <th className="p-2 w-20">HSN/SAC</th>
                      <th className="p-2 w-24">Alt. Qty</th>
                      <th className="p-2 w-16">Qty</th>
                      <th className="p-2 w-14">Unit</th>
                      <th className="p-2 w-20">Rate (₹)</th>
                      {showAdvancedColumns && (
                        <>
                          <th className="p-2 w-16 text-center">GST %</th>
                          <th className="p-2 w-24">Rate(Incl.Tax)</th>
                          <th className="p-2 w-16">Disc%</th>
                        </>
                      )}
                      <th className="p-2 w-24 text-right font-bold text-indigo-700">Amount (₹)</th>
                      <th className="p-2 w-9 text-center"></th>
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
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold text-slate-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
                          />
                        </td>

                        {/* HSN/SAC */}
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.hsnSac}
                            onChange={(e) => updateItem(index, 'hsnSac', e.target.value)}
                            placeholder="721420"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono text-slate-700 focus:border-indigo-500"
                          />
                        </td>

                        {/* Alt. Qty */}
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.altQuantity}
                            onChange={(e) => updateItem(index, 'altQuantity', e.target.value)}
                            placeholder="208.560 KG"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded text-slate-800 font-medium focus:border-indigo-500"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            placeholder="1"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-bold text-slate-900 focus:border-indigo-500"
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
                            className="w-full text-xs p-1.5 border border-slate-200 rounded text-center uppercase font-medium focus:border-indigo-500"
                          />
                        </td>

                        {/* Rate */}
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', e.target.value)}
                            placeholder="100"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold text-slate-900 focus:border-indigo-500"
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
                                className="w-full text-xs p-1.5 border border-slate-200 rounded text-center font-bold text-slate-800 focus:border-indigo-500"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.rateInclTax || ''}
                                onChange={(e) => updateItem(index, 'rateInclTax', e.target.value)}
                                placeholder="3,956.00"
                                className="w-full text-xs p-1.5 border border-slate-200 rounded text-slate-600 focus:border-indigo-500"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.discountPercent || ''}
                                onChange={(e) => updateItem(index, 'discountPercent', e.target.value)}
                                placeholder="%"
                                className="w-full text-xs p-1.5 border border-slate-200 rounded text-center text-slate-600 focus:border-indigo-500"
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
                            className="w-full text-xs p-1.5 border border-indigo-200 bg-indigo-50/40 rounded font-bold text-right text-indigo-900 focus:border-indigo-500"
                          />
                        </td>

                        {/* Delete */}
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={data.items.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition disabled:opacity-20 cursor-pointer"
                            title="Delete line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-800 border-t border-slate-200 text-xs">
                      <td colSpan={2} className="p-2.5 text-slate-600">
                        Total ({data.items.length} items)
                      </td>
                      <td></td>
                      <td className="p-2.5 text-slate-700 whitespace-nowrap">
                        {totalAltQtyFormatted}
                      </td>
                      <td className="p-2.5 text-slate-800">
                        {totalQuantityCount}
                      </td>
                      <td colSpan={showAdvancedColumns ? 4 : 2}></td>
                      <td className="p-2.5 text-right font-extrabold text-indigo-700 text-sm whitespace-nowrap">
                        ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Total Summary Banner (Shared between Card & Table view) - Classic Balanced Layout */}
            <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-800 space-y-3">
              {/* Row 1: 3 balanced metric columns */}
              <div className="grid grid-cols-3 gap-2 text-center pb-2.5 border-b border-slate-800">
                <div className="bg-slate-800/60 rounded-lg py-2 px-1 border border-slate-700/50">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    Total Items
                  </span>
                  <span className="font-extrabold text-white text-xs sm:text-sm">
                    {data.items.length}
                  </span>
                </div>

                <div className="bg-slate-800/60 rounded-lg py-2 px-1 border border-slate-700/50">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    Total Qty
                  </span>
                  <span className="font-extrabold text-white text-xs sm:text-sm">
                    {totalQuantityCount}
                  </span>
                </div>

                <div className="bg-slate-800/60 rounded-lg py-2 px-1 border border-slate-700/50">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    Total Weight
                  </span>
                  <span className="font-extrabold text-indigo-300 text-xs sm:text-sm truncate block">
                    {totalAltQtyFormatted}
                  </span>
                </div>
              </div>

              {/* Row 2: Gross Total full width, balanced left and right */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Gross Invoice Total
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    All Taxes & Charges Incl.
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-base sm:text-xl tracking-tight">
                    ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. SELLER / COMPANY TAB ================= */}
        {activeTab === 'seller' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Company / Biller Profile
                </h3>
                <p className="text-[11px] text-slate-500">
                  Seller details appearing on the top left of the invoice
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Active Biller
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Trade Name (Bold on Invoice)
                </label>
                <input
                  type="text"
                  value={data.seller.name}
                  onChange={(e) => updateSeller('name', e.target.value)}
                  placeholder="BHANU TRADERS"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
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
                  placeholder="NAUSAD, CHAURAHA NEAR HP PETROL"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
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
                  placeholder="PUMP BAGAHA GADA, GORAKHPUR"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN / UIN Number
                </label>
                <input
                  type="text"
                  value={data.seller.gstin}
                  onChange={(e) => updateSeller('gstin', e.target.value)}
                  placeholder="09FELPS6664L1ZE"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={data.seller.email}
                  onChange={(e) => updateSeller('email', e.target.value)}
                  placeholder="sharadsri82@gmail.com"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
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
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
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
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>
            </div>

            {/* Bank Details & Payment QR Section in Seller Tab */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between pb-2 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
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
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
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
                      placeholder="STATE BANK OF INDIA"
                      className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-white"
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
                      placeholder="381928371928"
                      className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-white"
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
                      placeholder="NAUSAD GORAKHPUR & SBIN0001234"
                      className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-white"
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
                      placeholder="8896925131@naviaxis"
                      className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none bg-white"
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
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
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
                className="px-2.5 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md flex items-center gap-1.5 transition font-semibold cursor-pointer active:scale-95"
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
                  <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
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
                    placeholder="MANAV UTTHAN SEWA SAMITI"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:border-indigo-500"
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
                    placeholder="KUSHINAGAR"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-indigo-500"
                  />
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
                      placeholder="Uttar Pradesh"
                      className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
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
                      className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer (Bill to) */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    Buyer (Bill to)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    value={data.buyer.name}
                    onChange={(e) => updateBuyer('name', e.target.value)}
                    placeholder="MANAV UTTHAN SEWA SAMITI"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:border-indigo-500"
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
                    placeholder="KUSHINAGAR"
                    className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-indigo-500"
                  />
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
                      className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
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
                      className="w-full text-sm sm:text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold outline-none focus:border-indigo-500"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={data.dispatch.invoiceNo}
                  onChange={(e) => updateDispatch('invoiceNo', e.target.value)}
                  placeholder="74"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Dated
                </label>
                <input
                  type="text"
                  value={data.dispatch.invoiceDate}
                  onChange={(e) => updateDispatch('invoiceDate', e.target.value)}
                  placeholder="14-Oct-26"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:border-indigo-500"
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
                  placeholder="THELA"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg uppercase font-bold text-slate-900 outline-none focus:border-indigo-500"
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
                  placeholder="Site-KUSHINAGAR"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg uppercase font-bold text-slate-900 outline-none focus:border-indigo-500"
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
                  placeholder="74"
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-indigo-500"
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
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
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
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
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
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
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
                  className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. TAX & GST TAB ================= */}
        {activeTab === 'tax' && (
          <div className="space-y-4">
            {/* Main Header / Enable Tax Table Switch */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      HSN/SAC Tax Breakdown Table
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        data.showTaxSummary
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-700/60 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {data.showTaxSummary ? 'Active on Invoice' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Renders CGST + SGST (or IGST) tax analysis table below items matching GST & Tally standards
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  id="toggle-show-tax-summary"
                  checked={data.showTaxSummary}
                  onChange={(e) => onChange({ ...data, showTaxSummary: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Quick Tax Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. Tax Calculation Mode */}
              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Calculation Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxMode: 'auto' })}
                    className={`py-1.5 px-2 rounded-md transition cursor-pointer text-center ${
                      data.taxMode !== 'manual'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Auto (Live Sync)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxMode: 'manual', taxSummary: effectiveTaxRows })}
                    className={`py-1.5 px-2 rounded-md transition cursor-pointer text-center ${
                      data.taxMode === 'manual'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
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
              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Tax Structure
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxType: 'cgst_sgst' })}
                    className={`py-1.5 px-1.5 rounded-md transition cursor-pointer text-center text-[11px] ${
                      data.taxType === 'cgst_sgst' || !data.taxType
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Central GST + State GST (Intra-state, e.g. UP to UP)"
                  >
                    CGST+SGST
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxType: 'igst' })}
                    className={`py-1.5 px-1.5 rounded-md transition cursor-pointer text-center text-[11px] ${
                      data.taxType === 'igst'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Integrated GST (Inter-state sales)"
                  >
                    IGST
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, taxType: 'auto' })}
                    className={`py-1.5 px-1.5 rounded-md transition cursor-pointer text-center text-[11px] ${
                      data.taxType === 'auto'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Auto-detect based on state codes"
                  >
                    Auto State
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {isInterState ? 'Inter-state: Integrated Tax (IGST)' : 'Intra-state: CGST (9%) + SGST (9%) matching screenshot'}
                </p>
              </div>

              {/* 3. Pricing Mode (Inclusive vs Exclusive) */}
              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-1.5 sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Item Price Basis
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, pricingMode: 'inclusive' })}
                    className={`py-1.5 px-2 rounded-md transition cursor-pointer text-center ${
                      data.pricingMode === 'inclusive' || !data.pricingMode
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Inclusive (MRP)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, pricingMode: 'exclusive' })}
                    className={`py-1.5 px-2 rounded-md transition cursor-pointer text-center ${
                      data.pricingMode === 'exclusive'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
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
            <div className="bg-white p-3 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Default GST Rate:</span>
                <span className="text-[11px] text-slate-500">Applied to items without custom GST %</span>
              </div>
              <div className="flex items-center gap-1.5">
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
                        ? 'bg-indigo-600 text-white shadow-2xs'
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
              <div className="bg-slate-50 px-3 sm:px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    HSN/SAC Breakdown Entries
                  </h4>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                    {effectiveTaxRows.length} {effectiveTaxRows.length === 1 ? 'row' : 'rows'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={syncTaxFromItems}
                    className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                    title="Recalculate summary live from items table"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-600" />
                    <span>Sync from Items</span>
                  </button>
                  {data.taxMode === 'manual' && (
                    <button
                      type="button"
                      onClick={addTaxRow}
                      className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add HSN Row</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table / Row List */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[11px] font-semibold">
                      <th className="p-2 min-w-[90px]">HSN/SAC</th>
                      <th className="p-2 text-right min-w-[110px]">Taxable Value (₹)</th>
                      {isInterState ? (
                        <>
                          <th className="p-2 text-center w-20">IGST Rate</th>
                          <th className="p-2 text-right min-w-[95px]">IGST Amt (₹)</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 text-center w-16">CGST %</th>
                          <th className="p-2 text-right min-w-[95px]">CGST Amt (₹)</th>
                          <th className="p-2 text-center w-16">SGST %</th>
                          <th className="p-2 text-right min-w-[95px]">SGST Amt (₹)</th>
                        </>
                      )}
                      <th className="p-2 text-right min-w-[110px] font-bold text-indigo-700">Total Tax (₹)</th>
                      {data.taxMode === 'manual' && <th className="p-2 w-10 text-center"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                              className="w-full p-1 border border-slate-200 rounded font-mono font-bold text-slate-800 text-xs outline-none focus:border-indigo-500"
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
                              className="w-full p-1 border border-slate-200 rounded text-right font-semibold text-slate-800 text-xs outline-none focus:border-indigo-500"
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
                                  className="w-14 p-1 border border-slate-200 rounded text-center text-xs outline-none focus:border-indigo-500"
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
                                  className="w-full p-1 border border-slate-200 rounded text-right text-xs outline-none focus:border-indigo-500"
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
                                  className="w-14 p-1 border border-slate-200 rounded text-center text-xs outline-none focus:border-indigo-500"
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
                                  className="w-full p-1 border border-slate-200 rounded text-right text-xs outline-none focus:border-indigo-500"
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
                                  className="w-14 p-1 border border-slate-200 rounded text-center text-xs outline-none focus:border-indigo-500"
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
                                  className="w-full p-1 border border-slate-200 rounded text-right text-xs outline-none focus:border-indigo-500"
                                />
                              ) : (
                                <span>₹ {formatIndianCurrency(row.sgstAmount)}</span>
                              )}
                            </td>
                          </>
                        )}

                        {/* Total Tax Amount */}
                        <td className="p-2 text-right font-bold text-indigo-700">
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
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
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
                      <td className="p-2 text-right text-indigo-700 font-extrabold text-sm">
                        ₹ {formatIndianCurrency(taxTotals.totalTaxAmount)}
                      </td>
                      {data.taxMode === 'manual' && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* In Words & Signatory Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tax Amount in Words */}
              <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Tax Amount (in words)
                </label>
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-bold text-indigo-900">
                  {autoTaxWords}
                </div>
                <input
                  type="text"
                  value={data.customTaxAmountInWords || ''}
                  onChange={(e) => onChange({ ...data, customTaxAmountInWords: e.target.value })}
                  placeholder="Custom override (Leave blank for automatic)"
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
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
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-800">
                  {autoAmountWords}
                </div>
                <input
                  type="text"
                  value={data.customAmountInWords || ''}
                  onChange={(e) => onChange({ ...data, customAmountInWords: e.target.value })}
                  placeholder="Custom override (Leave blank for automatic)"
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
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
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
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
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white font-bold"
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
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
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
                      placeholder="STATE BANK OF INDIA"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-indigo-500 bg-white"
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
                      placeholder="381928371928"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 bg-white"
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
                      placeholder="NAUSAD GORAKHPUR & SBIN0001234"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-indigo-500 bg-white"
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
                      placeholder="8896925131@naviaxis"
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 outline-none focus:border-indigo-500 bg-white"
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
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
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
                className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-bold outline-none focus:border-indigo-500"
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
                className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg font-mono text-[11px] outline-none focus:border-indigo-500"
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
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
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
                className="w-full text-sm sm:text-xs p-2.5 sm:p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
