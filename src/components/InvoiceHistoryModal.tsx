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
import { recordLastInvoiceNo } from '../utils/invoiceSequence';

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

    const now = new Date();
    const formattedSavedAt = `${now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} ${now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newRecord: SavedInvoiceRecord = {
      id: `inv_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceNo: currentInvoice.dispatch.invoiceNo || 'DRAFT',
      invoiceDate: currentInvoice.dispatch.invoiceDate || new Date().toISOString().split('T')[0],
      buyerName: currentInvoice.buyer.name || 'Unnamed Customer',
      sellerName: currentInvoice.seller.name || 'My Business',
      totalAmount: rawTotal,
      itemCount: currentInvoice.items.length,
      savedAt: formattedSavedAt,
      data: JSON.parse(JSON.stringify(currentInvoice)),
    };

    // Keep highest sequence tracked
    if (currentInvoice.dispatch.invoiceNo) {
      recordLastInvoiceNo(currentInvoice.dispatch.invoiceNo);
    }

    const updated = [newRecord, ...records.filter((r) => r.invoiceNo !== newRecord.invoiceNo || r.invoiceDate !== newRecord.invoiceDate)];
    saveRecordsToStorage(updated);
    setSaveSuccessMessage(`Invoice #${newRecord.invoiceNo} saved to history!`);
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this invoice from history?')) {
      const updated = records.filter((r) => r.id !== id);
      saveRecordsToStorage(updated);
    }
  };

  // Export all saved invoices as a single JSON file
  const handleExportJson = () => {
    if (records.length === 0) {
      alert('No invoice records to export!');
      return;
    }
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gst_invoices_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);
        if (Array.isArray(imported)) {
          // Merge avoiding exact duplicates by id
          const existingIds = new Set(records.map((r) => r.id));
          const newOnes = imported.filter((item: any) => item && item.id && !existingIds.has(item.id));
          const merged = [...newOnes, ...records];
          saveRecordsToStorage(merged);
          setSaveSuccessMessage(`Successfully imported ${newOnes.length} invoices!`);
          setTimeout(() => setSaveSuccessMessage(''), 3000);
        } else {
          alert('Invalid backup file format. Expected a JSON array of invoice records.');
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('Could not parse the selected backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = records.filter((rec) => {
    const q = searchTerm.toLowerCase();
    return (
      rec.invoiceNo.toLowerCase().includes(q) ||
      rec.buyerName.toLowerCase().includes(q) ||
      rec.invoiceDate.includes(q) ||
      rec.sellerName.toLowerCase().includes(q)
    );
  });

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white text-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-slate-200 overflow-hidden relative z-[101]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
              <History className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">Invoice History & Backups</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden xs:block truncate">
                Save, recall, and export/import previous GST invoices
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

        {/* Action Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50/50">
          <button
            onClick={handleSaveCurrent}
            className="px-3.5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Save Current (#{currentInvoice.dispatch.invoiceNo || 'New'})</span>
          </button>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleExportJson}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Download backup file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs">
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
          <div className="mx-3 sm:mx-4 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
              className="w-full text-xs pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl outline-none focus:border-blue-500 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pt-1 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto opacity-50" />
              <p className="text-xs font-semibold text-slate-700">No saved invoices found</p>
              <p className="text-[11px] text-slate-500">
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
                className="group p-3 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 bg-white shadow-2xs"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg font-mono shrink-0">
                      #{record.invoiceNo}
                    </span>
                    <span className="text-xs font-bold text-slate-900 break-words">
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
                    <span className="text-[10px] text-blue-600 font-semibold group-hover:underline">
                      Click to Open →
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(record.id, e)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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
