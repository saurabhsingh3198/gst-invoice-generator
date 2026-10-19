import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Package,
  Plus,
  Trash2,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  getSavedProducts,
  saveProductToLibrary,
  deleteProductFromLibrary,
} from '../utils/productMaster';
import type { ProductTemplate } from '../utils/productMaster';
import { formatIndianCurrency } from '../utils/numberToWords';

interface ProductMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (template: ProductTemplate) => void;
}

export const ProductMasterModal: React.FC<ProductMasterModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New item form state
  const [newDesc, setNewDesc] = useState<string>('');
  const [newHsn, setNewHsn] = useState<string>('721420');
  const [newUnit, setNewUnit] = useState<string>('PC');
  const [newAltQty, setNewAltQty] = useState<string>('0.000 KG');
  const [newRate, setNewRate] = useState<number>(100);
  const [newGstRate, setNewGstRate] = useState<number>(18);
  const [newCategory, setNewCategory] = useState<string>('General');

  useEffect(() => {
    if (isOpen) {
      setProducts(getSavedProducts());
      setShowAddForm(false);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category || 'General')))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hsnSac.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const rateInc = Math.round(newRate * (1 + newGstRate / 100) * 100) / 100;

    const updated = saveProductToLibrary({
      description: newDesc.trim().toUpperCase(),
      hsnSac: newHsn.trim(),
      unit: newUnit.trim().toUpperCase(),
      altQuantityDefault: newAltQty.trim(),
      rate: Number(newRate) || 0,
      rateInclTax: rateInc.toFixed(2),
      gstRate: Number(newGstRate) || 18,
      category: newCategory.trim() || 'General',
    });

    setProducts(updated);
    setShowAddForm(false);
    setNewDesc('');
    setNewRate(100);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this product from your library?')) {
      const updated = deleteProductFromLibrary(id);
      setProducts(updated);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white text-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-slate-200 overflow-hidden relative z-[101]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                Product & Item Library
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden xs:block truncate">
                Pick saved products or manage your shop catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar & Category Filter */}
        <div className="p-3 sm:p-4 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products or HSN..."
                className="w-full text-xs pl-9 pr-4 py-2 bg-white text-slate-800 border border-slate-300 rounded-xl outline-none focus:border-blue-500 placeholder-slate-400"
              />
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{showAddForm ? 'Close Form' : 'New Product'}</span>
            </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Add Product Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleAddNewProduct}
            className="p-3 sm:p-4 bg-blue-50/50 border-b border-blue-100 space-y-3 animate-in slide-in-from-top-2 overflow-y-auto max-h-[50vh]"
          >
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Add New Product to Library</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Description / Item Name
                </label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. JSW NEO STEEL 12MM"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 uppercase font-semibold placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  required
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  placeholder="721420"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 font-mono font-bold placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Unit
                </label>
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="PC / KG / BAG"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 uppercase font-bold placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Base Rate (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  placeholder="450"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 font-bold placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  GST Rate (%)
                </label>
                <select
                  value={newGstRate}
                  onChange={(e) => setNewGstRate(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 font-bold"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Default Alt Qty (Optional)
                </label>
                <input
                  type="text"
                  value={newAltQty}
                  onChange={(e) => setNewAltQty(e.target.value)}
                  placeholder="e.g. 50.000 KG"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 font-bold placeholder-slate-400"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Category
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Steel & TMT, Cement"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-95"
              >
                Save to Library
              </button>
            </div>
          </form>
        )}

        {/* Product Cards List */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-1">
              <Package className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs font-semibold text-slate-600">No products found matching &quot;{searchTerm}&quot;</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="group p-3 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white shadow-2xs"
              >
                {/* Product Info (Top on Mobile, Left on Desktop) */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition break-words">
                      {item.description}
                    </span>
                    {item.category && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium shrink-0">
                        {item.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="font-mono">HSN: <strong className="text-slate-700">{item.hsnSac}</strong></span>
                    <span>•</span>
                    <span>Unit: <strong className="text-slate-700">{item.unit}</strong></span>
                    <span>•</span>
                    <span>GST: <strong className="text-slate-700">{item.gstRate}%</strong></span>
                    {item.altQuantityDefault && (
                      <>
                        <span>•</span>
                        <span className="truncate">Alt: {item.altQuantityDefault}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price & Actions (Bottom on Mobile, Right on Desktop) */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      ₹ {formatIndianCurrency(item.rate)} <span className="text-slate-500 font-normal">/ {item.unit}</span>
                    </div>
                    {item.rateInclTax && (
                      <div className="text-[10px] text-slate-400">
                        Incl. Tax: ₹{item.rateInclTax}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-3 py-1.5 sm:py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 sm:p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between px-3 sm:px-5">
          <span>{filtered.length} products available</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
