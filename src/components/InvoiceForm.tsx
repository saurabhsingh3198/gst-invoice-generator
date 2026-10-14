import React, { useState } from 'react';
import type { InvoiceData, InvoiceItem } from '../types/invoice';
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
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'items' | 'seller' | 'parties' | 'dispatch' | 'settings'>('items');
  const [showAdvancedColumns, setShowAdvancedColumns] = useState<boolean>(false);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 flex flex-col h-full overflow-hidden">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Invoice Editor
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded border border-indigo-400/20 font-medium">
                Live Sync
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Tally Standard A4 GST Tax Invoice</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="px-2.5 py-1.5 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center gap-1.5 transition shadow-xs"
            title="Load sample invoice from photo"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Sample Invoice</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md flex items-center gap-1 transition border border-slate-700"
            title="Clear all fields"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar - Completely Fixed Line-Height & No Clipping */}
      <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'items'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Line Items</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
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
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'seller'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Seller / Company</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parties')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'parties'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Buyer & Consignee</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'dispatch'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Dispatch & Dates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Body - Clean, Classic & Functional */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= 1. SPREADSHEET-STYLE LINE ITEMS ================= */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Product / Goods Table
                </h3>
                <p className="text-[11px] text-slate-500">
                  Spreadsheet mode: edit directly or add rows below
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedColumns(!showAdvancedColumns)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
                    showAdvancedColumns
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Toggle Tax Rate and Discount columns"
                >
                  {showAdvancedColumns ? '− Hide Tax/Disc' : '+ Tax / Disc'}
                </button>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </div>

            {/* Spreadsheet Data Grid */}
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

                      {/* Description (multiline text) */}
                      <td className="p-1.5">
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="e.g. TATA TISCON&#10;550 SD 8MM"
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
                          placeholder="44"
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
                          placeholder="420"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold text-slate-900 focus:border-indigo-500"
                        />
                      </td>

                      {/* Optional Advanced Columns */}
                      {showAdvancedColumns && (
                        <>
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
                          placeholder="18480"
                          className="w-full text-xs p-1.5 border border-indigo-200 bg-indigo-50/40 rounded font-bold text-right text-indigo-900 focus:border-indigo-500"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={data.items.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition disabled:opacity-20"
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
                    <td className="p-2.5 text-slate-700">
                      {/* Auto Alt Qty sum */}
                      {data.items
                        .reduce((acc, i) => {
                          const m = (i.altQuantity || '').match(/([0-9.,]+)/);
                          return acc + (m ? parseFloat(m[1].replace(/,/g, '')) || 0 : 0);
                        }, 0)
                        .toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}{' '}
                      KG
                    </td>
                    <td className="p-2.5 text-slate-800">
                      {data.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Company / Trade Name (Bold on Invoice)
                </label>
                <input
                  type="text"
                  value={data.seller.name}
                  onChange={(e) => updateSeller('name', e.target.value)}
                  placeholder="BHANU TRADERS"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={data.seller.addressLine1}
                  onChange={(e) => updateSeller('addressLine1', e.target.value)}
                  placeholder="NAUSAD, CHAURAHA NEAR HP PETROL"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Address Line 2 (City / Landmark)
                </label>
                <input
                  type="text"
                  value={data.seller.addressLine2}
                  onChange={(e) => updateSeller('addressLine2', e.target.value)}
                  placeholder="PUMP BAGAHA GADA, GORAKHPUR"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  GSTIN / UIN Number
                </label>
                <input
                  type="text"
                  value={data.seller.gstin}
                  onChange={(e) => updateSeller('gstin', e.target.value)}
                  placeholder="09FELPS6664L1ZE"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold uppercase focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={data.seller.email}
                  onChange={(e) => updateSeller('email', e.target.value)}
                  placeholder="sharadsri82@gmail.com"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  State Name
                </label>
                <input
                  type="text"
                  value={data.seller.stateName}
                  onChange={(e) => updateSeller('stateName', e.target.value)}
                  placeholder="Uttar Pradesh"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  value={data.seller.stateCode}
                  onChange={(e) => updateSeller('stateCode', e.target.value)}
                  placeholder="09"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. PARTIES TAB ================= */}
        {activeTab === 'parties' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
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
                className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md flex items-center gap-1 transition"
                title="Copy Consignee details to Buyer"
              >
                <Copy className="w-3 h-3" />
                <span>Sync Consignee → Buyer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Consignee (Ship to) */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Consignee (Ship to)
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Consignee Name
                  </label>
                  <input
                    type="text"
                    value={data.consignee.name}
                    onChange={(e) => updateConsignee('name', e.target.value)}
                    placeholder="MANAV UTTHAN SEWA SAMITI"
                    className="w-full text-xs p-1.5 border border-slate-300 rounded font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Shipping Address
                  </label>
                  <textarea
                    rows={2}
                    value={data.consignee.address}
                    onChange={(e) => updateConsignee('address', e.target.value)}
                    placeholder="KUSHINAGAR"
                    className="w-full text-xs p-1.5 border border-slate-300 rounded text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      State Name
                    </label>
                    <input
                      type="text"
                      value={data.consignee.stateName}
                      onChange={(e) => updateConsignee('stateName', e.target.value)}
                      placeholder="Uttar Pradesh"
                      className="w-full text-xs p-1.5 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      State Code
                    </label>
                    <input
                      type="text"
                      value={data.consignee.stateCode}
                      onChange={(e) => updateConsignee('stateCode', e.target.value)}
                      placeholder="09"
                      className="w-full text-xs p-1.5 border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer (Bill to) */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Buyer (Bill to)
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    value={data.buyer.name}
                    onChange={(e) => updateBuyer('name', e.target.value)}
                    placeholder="MANAV UTTHAN SEWA SAMITI"
                    className="w-full text-xs p-1.5 border border-slate-300 rounded font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Billing Address
                  </label>
                  <textarea
                    rows={2}
                    value={data.buyer.address}
                    onChange={(e) => updateBuyer('address', e.target.value)}
                    placeholder="KUSHINAGAR"
                    className="w-full text-xs p-1.5 border border-slate-300 rounded text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      State Name
                    </label>
                    <input
                      type="text"
                      value={data.buyer.stateName}
                      onChange={(e) => updateBuyer('stateName', e.target.value)}
                      placeholder="Uttar Pradesh"
                      className="w-full text-xs p-1.5 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      State Code
                    </label>
                    <input
                      type="text"
                      value={data.buyer.stateCode}
                      onChange={(e) => updateBuyer('stateCode', e.target.value)}
                      placeholder="09"
                      className="w-full text-xs p-1.5 border border-slate-300 rounded font-mono font-bold"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={data.dispatch.invoiceNo}
                  onChange={(e) => updateDispatch('invoiceNo', e.target.value)}
                  placeholder="74"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Invoice Dated
                </label>
                <input
                  type="text"
                  value={data.dispatch.invoiceDate}
                  onChange={(e) => updateDispatch('invoiceDate', e.target.value)}
                  placeholder="14-Oct-26"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Dispatched Through
                </label>
                <input
                  type="text"
                  value={data.dispatch.dispatchedThrough}
                  onChange={(e) => updateDispatch('dispatchedThrough', e.target.value)}
                  placeholder="THELA"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg uppercase font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Destination (Site / City)
                </label>
                <input
                  type="text"
                  value={data.dispatch.destination}
                  onChange={(e) => updateDispatch('destination', e.target.value)}
                  placeholder="Site-KUSHINAGAR"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg uppercase font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Dispatch Document No.
                </label>
                <input
                  type="text"
                  value={data.dispatch.dispatchDocNo}
                  onChange={(e) => updateDispatch('dispatchDocNo', e.target.value)}
                  placeholder="74"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Delivery Note Date
                </label>
                <input
                  type="text"
                  value={data.dispatch.deliveryNoteDate}
                  onChange={(e) => updateDispatch('deliveryNoteDate', e.target.value)}
                  placeholder=""
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Buyer's Order No.
                </label>
                <input
                  type="text"
                  value={data.dispatch.buyersOrderNo}
                  onChange={(e) => updateDispatch('buyersOrderNo', e.target.value)}
                  placeholder=""
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Order Dated
                </label>
                <input
                  type="text"
                  value={data.dispatch.orderDate}
                  onChange={(e) => updateDispatch('orderDate', e.target.value)}
                  placeholder=""
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Terms of Delivery
                </label>
                <textarea
                  rows={2}
                  value={data.dispatch.termsOfDelivery}
                  onChange={(e) => updateDispatch('termsOfDelivery', e.target.value)}
                  placeholder="Delivery terms..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. SETTINGS TAB ================= */}
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
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => onChange({ ...data, title: e.target.value })}
                placeholder="Tax Invoice"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Custom Amount in Words (Leave blank for automatic Lakhs / Crores calculation)
              </label>
              <input
                type="text"
                value={data.customAmountInWords || ''}
                onChange={(e) => onChange({ ...data, customAmountInWords: e.target.value })}
                placeholder="e.g. INR Forty-Four Thousand Two Hundred Ninety Only"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                By default, the Indian numbering system automatically writes out amount in words.
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
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Declaration Statement
              </label>
              <textarea
                rows={3}
                value={data.declaration}
                onChange={(e) => onChange({ ...data, declaration: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
