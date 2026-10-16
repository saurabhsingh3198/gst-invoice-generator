import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { InvoiceData } from '../types/invoice';
import {
  X,
  History,
  Download,
  Upload,
  Trash2,
  FolderOpen,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { formatIndianCurrency } from '../utils/numberToWords';

export interface SavedInvoiceRecord {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  buyerName: string;
  sellerName: string;
  totalAmount: number;
  itemCount: number;
  savedAt: string;
  data: InvoiceData;
}

interface InvoiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInvoice: InvoiceData;
  onLoadInvoice: (data: InvoiceData) => void;
}

const STORAGE_KEY = 'gst_invoices_history_records';

export const InvoiceHistoryModal: React.FC<InvoiceHistoryModalProps> = ({
  isOpen,
  onClose,
  currentInvoice,
  onLoadInvoice,
}) => {
  const [records, setRecords] = useState<SavedInvoiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

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

  const loadRecordsFromStorage = (): SavedInvoiceRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading invoice history:', e);
    }
    return [];
  };

  const saveRecordsToStorage = (list: SavedInvoiceRecord[]) => {
    setRecords(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save invoice records to storage', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setRecords(loadRecordsFromStorage());
      setSaveSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Save current invoice as a new record or update existing
  const handleSaveCurrent = () => {
    const rawTotal = currentInvoice.items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const rounded = currentInvoice.enableRoundOff !== false ? Math.round(rawTotal) : rawTotal;

    const invNo = currentInvoice.dispatch.invoiceNo || 'Draft';
    const newRecord: SavedInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNo: invNo,
      invoiceDate: currentInvoice.dispatch.invoiceDate || new Date().toLocaleDateString('en-GB'),
      buyerName: currentInvoice.buyer.name || 'Unnamed Buyer',
      sellerName: currentInvoice.seller.name || 'Seller',
      totalAmount: rounded,
      itemCount: currentInvoice.items.length,
      savedAt: new Date().toLocaleString('en-IN'),
      data: JSON.parse(JSON.stringify(currentInvoice)),
    };

    const existingIndex = records.findIndex(
      (r) => r.invoiceNo.trim().toLowerCase() === invNo.trim().toLowerCase()
    );

    let updated: SavedInvoiceRecord[];
    if (existingIndex >= 0) {
      updated = [...records];
      updated[existingIndex] = newRecord;
    } else {
      updated = [newRecord, ...records];
    }

    saveRecordsToStorage(updated);
    setSaveSuccessMessage(`Invoice #${invNo} saved to history!`);
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this invoice from history?')) {
      const updated = records.filter((r) => r.id !== id);
      saveRecordsToStorage(updated);
    }
  };

  const handleExportJson = () => {
    if (records.length === 0) {
      alert('No invoice history to export!');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gst_invoices_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Merge with existing avoiding duplicate IDs
            const existingIds = new Set(records.map((r) => r.id));
            const newRecords = parsed.filter((r) => r && r.id && !existingIds.has(r.id));
            const combined = [...newRecords, ...records];
            saveRecordsToStorage(combined);
            alert(`Successfully imported ${newRecords.length} invoices!`);
          } else {
            alert('Invalid backup JSON format.');
          }
        } catch (err) {
          alert('Failed to parse backup JSON file.');
        }
      };
    }
  };

  const filtered = records.filter(
    (r) =>
      r.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoiceDate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-slate-200 overflow-hidden relative z-[101]">
        {/* Header */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">Invoice History & Backups</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden xs:block truncate">
                Save, recall, and export/import previous GST invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white">
          <button
            onClick={handleSaveCurrent}
            className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Save Current (#{currentInvoice.dispatch.invoiceNo || 'New'})</span>
          </button>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleExportJson}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Download backup file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Notifications */}
        {saveSuccessMessage && (
          <div className="mx-3 sm:mx-4 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Search */}
        <div className="p-3 sm:p-4 pb-1 sm:pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice number, buyer name, or date..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pt-1 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto opacity-50" />
              <p className="text-xs font-semibold">No saved invoices found</p>
              <p className="text-[11px] text-slate-400">
                Click &quot;Save Current&quot; to store your invoice in history.
              </p>
            </div>
          ) : (
            filtered.map((record) => (
              <div
                key={record.id}
                onClick={() => {
                  if (
                    window.confirm(
                      `Load Invoice #${record.invoiceNo} into editor? Current changes will be replaced.`
                    )
                  ) {
                    onLoadInvoice(record.data);
                    onClose();
                  }
                }}
                className="group p-3 sm:p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 bg-white shadow-2xs"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono shrink-0">
                      #{record.invoiceNo}
                    </span>
                    <span className="text-xs font-bold text-slate-800 break-words">
                      {record.buyerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {record.invoiceDate}
                    </span>
                    <span>•</span>
                    <span className="shrink-0">{record.itemCount} items</span>
                    <span>•</span>
                    <span className="text-slate-400 truncate">Saved: {record.savedAt}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      ₹ {formatIndianCurrency(record.totalAmount)}
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline">
                      Click to Open →
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(record.id, e)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete invoice from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 sm:p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between px-3 sm:px-5">
          <span>Total Saved: {records.length} invoices</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition text-xs cursor-pointer"
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
