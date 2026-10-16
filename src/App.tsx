import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { InvoiceData } from './types/invoice';
import { sampleInvoiceData } from './utils/sampleData';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceHistoryModal } from './components/InvoiceHistoryModal';
import { formatIndianCurrency } from './utils/numberToWords';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Eye,
  Columns,
  Maximize2,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  ExternalLink,
  Edit3,
  ArrowRight,
  History,
} from 'lucide-react';

const DRAFT_STORAGE_KEY = 'gst_invoice_current_draft_v1';

export const App: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.seller && Array.isArray(parsed.items) && parsed.items.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to load draft from localStorage', e);
      }
    }
    return sampleInvoiceData;
  });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'editor';
    }
    return 'split';
  });

  // Calculate optimal zoom level based on container/screen size
  const getOptimalZoom = useCallback((isSplit: boolean = false): number => {
    if (typeof window === 'undefined') return 0.78;
    const width = window.innerWidth;
    if (width < 450) {
      // Mobile screen: fit within available width with margin
      return Math.round(Math.max(0.35, Math.min(0.5, (width - 24) / 794)) * 100) / 100;
    }
    if (width < 768) {
      // Large phone / small tablet
      return Math.round(Math.max(0.45, Math.min(0.7, (width - 32) / 794)) * 100) / 100;
    }
    if (width < 1024) {
      // Tablet portrait
      return Math.round(Math.max(0.65, Math.min(0.85, (width - 48) / 794)) * 100) / 100;
    }
    // Desktop / Laptop
    if (isSplit) {
      const halfWidth = width / 2;
      return Math.round(Math.max(0.6, Math.min(0.9, (halfWidth - 48) / 794)) * 100) / 100;
    }
    return 0.85;
  }, []);

  const [zoomLevel, setZoomLevel] = useState<number>(() => getOptimalZoom(false));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Handle window resize dynamically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'split') {
        setViewMode('editor');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Fit to screen width helper
  const handleFitScreen = () => {
    const optimal = getOptimalZoom(viewMode === 'split');
    setZoomLevel(optimal);
  };

  // Native Print (Best vector crispness, Save as PDF via browser)
  const handlePrint = () => {
    window.print();
  };

  // Direct Client-Side PDF Download & View
  const handleDownloadPdf = async (action: 'download' | 'open' = 'download') => {
    // Look up target element: offscreen unscaled container first, fallback to preview
    let target: HTMLElement | null =
      exportRef.current ||
      (document.querySelector('#invoice-export-container .invoice-a4-page') as HTMLElement) ||
      (document.getElementById('invoice-document') as HTMLElement) ||
      previewRef.current;

    if (!target) {
      alert('Invoice document not found. Please try again.');
      return;
    }

    setIsGeneratingPdf(true);
    setDownloadSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Ensure filename strictly ends with .pdf and has clean alphanumeric characters
      const rawInvoiceNo = invoiceData.dispatch.invoiceNo ? invoiceData.dispatch.invoiceNo.trim() : '74';
      const cleanInvoiceNo = rawInvoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_') || '74';
      const fileName = `Sales_${cleanInvoiceNo}.pdf`;

      // Render high resolution canvas (scale 2 for crisp vector-like output)
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Create A4 jsPDF instance (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      // Fit into single exact A4 page
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      // Generate binary array buffer and wrap into explicit application/pdf Blob
      const pdfArrayBuffer = pdf.output('arraybuffer');
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (action === 'open') {
        window.open(blobUrl, '_blank');
      } else {
        // Direct reliable download via DOM-appended anchor
        // Note: Browsers (Chrome, Edge, Firefox) REQUIRE the anchor element to be in the DOM
        // for the download attribute and filename extension to be properly respected.
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = blobUrl;
        link.download = fileName;
        link.setAttribute('download', fileName);
        link.setAttribute('type', 'application/pdf');
        document.body.appendChild(link);

        link.click();

        setTimeout(() => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          URL.revokeObjectURL(blobUrl);
        }, 3000);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback
      alert('Could not generate PDF canvas. Opening Print dialog instead.');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Live Auto-Save to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(invoiceData));
    } catch (e) {
      console.warn('Failed to auto-save draft to localStorage', e);
    }
  }, [invoiceData]);

  // Restore sample data
  const handleLoadSample = () => {
    if (
      window.confirm(
        'Reset to Sample Invoice? Any unsaved edits in your current invoice will be overwritten.'
      )
    ) {
      setInvoiceData(JSON.parse(JSON.stringify(sampleInvoiceData)));
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}
    }
  };

  // Reset to blank invoice
  const handleReset = () => {
    if (
      window.confirm('Start a new blank invoice? Your current draft will be cleared.')
    ) {
      setInvoiceData({
        title: 'Tax Invoice',
        seller: {
          name: '',
          addressLine1: '',
          addressLine2: '',
          gstin: '',
          stateName: '',
          stateCode: '',
          email: '',
        },
        consignee: {
          name: '',
          address: '',
          stateName: '',
          stateCode: '',
        },
        buyer: {
          name: '',
          address: '',
          stateName: '',
          stateCode: '',
        },
        dispatch: {
          invoiceNo: '',
          invoiceDate: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          }),
          deliveryNote: '',
          modeTermsOfPayment: '',
          referenceNoAndDate: '',
          otherReferences: '',
          buyersOrderNo: '',
          orderDate: '',
          dispatchDocNo: '',
          deliveryNoteDate: '',
          dispatchedThrough: '',
          destination: '',
          termsOfDelivery: '',
        },
        items: [
          {
            id: '1',
            slNo: 1,
            description: '',
            hsnSac: '',
            altQuantity: '',
            quantity: 1,
            unit: 'PC',
            rateInclTax: '',
            rate: 0,
            per: 'PC',
            discountPercent: '',
            amount: 0,
          },
        ],
        declaration:
          'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
        showTaxSummary: true,
        taxMode: 'auto',
        taxType: 'cgst_sgst',
        pricingMode: 'inclusive',
        defaultGstRate: 18,
        enableRoundOff: true,
        customAmountInWords: '',
        customTaxAmountInWords: '',
        bankDetails: {
          showBankDetails: true,
          bankName: '',
          accountNo: '',
          branchAndIfsc: '',
          upiId: '',
          showQrCode: true,
        },
      });
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}
    }
  };

  const rawTotal = invoiceData.items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const totalAmount =
    invoiceData.enableRoundOff !== false ? Math.round(rawTotal) : rawTotal;

  // Render Preview Canvas with mathematically precise scaling wrapper
  const renderPreviewCanvas = (isSplitLayout: boolean = false) => {
    const scaledWidth = Math.round(794 * zoomLevel);
    const scaledHeight = Math.round(1123 * zoomLevel);

    return (
      <div className="w-full h-full flex flex-col">
        {/* Preview Toolbar */}
        <div className="no-print w-full flex items-center justify-between bg-white px-3 sm:px-4 py-2 rounded-t-xl border border-slate-200 border-b-0 shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">
              A4 Proof
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Vector Exact)
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.35, Math.round((z - 0.08) * 100) / 100))}
              className="p-1 hover:bg-white rounded text-slate-600 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono text-slate-700 px-1 min-w-[38px] text-center font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, Math.round((z + 0.08) * 100) / 100))}
              className="p-1 hover:bg-white rounded text-slate-600 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleFitScreen}
              className="px-1.5 py-0.5 hover:bg-white rounded text-slate-700 text-[10px] font-bold transition flex items-center gap-1 border border-slate-200/80 bg-slate-50 cursor-pointer"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3 h-3 text-indigo-600" />
              <span>Fit</span>
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel(1.0)}
              className="hidden sm:inline-block px-1.5 py-0.5 hover:bg-white rounded text-slate-600 text-[10px] font-medium transition cursor-pointer"
              title="Actual 100% Size"
            >
              100%
            </button>
          </div>
        </div>

        {/* Scrollable canvas container with bulletproof centered scale wrapper */}
        <div
          className={`w-full flex-1 bg-slate-200/80 p-2 sm:p-5 rounded-b-xl border border-slate-200 overflow-auto flex flex-col items-center shadow-inner ${
            isSplitLayout ? '' : 'min-h-[500px] sm:min-h-[850px]'
          }`}
        >
          {/* Scaled bounding container that eliminates the CSS transform offset bug */}
          <div
            style={{
              width: `${scaledWidth}px`,
              minHeight: `${scaledHeight}px`,
              position: 'relative',
              margin: '0 auto',
              flexShrink: 0,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                width: '794px',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                transition: 'transform 0.12s ease-out',
              }}
            >
              <InvoicePreview ref={previewRef} data={invoiceData} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col text-slate-800 font-sans pb-16 lg:pb-0">
      {/* ================= TOP RESPONSIVE HEADER ================= */}
      <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-[1780px] mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand - Perfectly single line with whitespace-nowrap */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-sm shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 whitespace-nowrap">
                GST Invoice Studio
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                A4
              </span>
            </div>
          </div>

          {/* Quick Metrics Badge (Desktop / Tablet >= 768px) */}
          <div className="hidden md:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Inv: </span>
              <span className="font-bold text-slate-800">
                #{invoiceData.dispatch.invoiceNo || '—'}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-300"></div>
            <div>
              <span className="text-slate-400 font-medium">Items: </span>
              <span className="font-bold text-slate-800">{invoiceData.items.length}</span>
            </div>
            <div className="h-3 w-px bg-slate-300"></div>
            <div>
              <span className="text-slate-400 font-medium">Gross: </span>
              <span className="font-extrabold text-indigo-700">
                ₹ {formatIndianCurrency(totalAmount)}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-300"></div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold" title="Changes auto-saved to browser storage">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden xl:inline">Auto-Saved</span>
            </div>
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* History Button */}
            <button
              id="btn-invoice-history"
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              title="Open Invoice History & Backups"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* Desktop View Mode Toggle (Hidden on mobile, mobile has top segmented bar) */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Split View: Side-by-side Editor & Preview"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'editor'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Editor Only"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Preview Only"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              id="btn-print-invoice"
              type="button"
              onClick={handlePrint}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
              title="Print directly or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* View PDF Button (Desktop / Tablet) */}
            <button
              id="btn-view-pdf"
              type="button"
              onClick={() => handleDownloadPdf('open')}
              disabled={isGeneratingPdf}
              className="hidden sm:flex px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 items-center gap-1.5 border border-slate-300 transition shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              title="Open generated PDF in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>View</span>
            </button>

            {/* Download PDF Button */}
            <button
              id="btn-download-pdf"
              type="button"
              onClick={() => handleDownloadPdf('download')}
              disabled={isGeneratingPdf}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer active:scale-95"
              title="Download PDF"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : downloadSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden xs:inline sm:inline">
                {isGeneratingPdf ? 'Saving...' : downloadSuccess ? 'Saved!' : 'Download PDF'}
              </span>
              <span className="inline xs:hidden sm:hidden">
                {isGeneratingPdf ? '...' : downloadSuccess ? 'Done' : 'PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* ================= MOBILE VIEW SWITCHER (VISIBLE ON SCREENS < 1024px) ================= */}
        <div className="lg:hidden border-t border-slate-200 bg-slate-50/90 px-3 py-1.5 flex items-center justify-center gap-2">
          <div className="w-full max-w-md grid grid-cols-2 bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Invoice</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                {invoiceData.items.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>A4 Preview</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= WORKSPACE BODY ================= */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto p-2.5 sm:p-4 flex flex-col">
        {/* SPLIT VIEW (DESKTOP / LAPTOP DEFAULT) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
            {/* Left 6 cols: Editor */}
            <div className="no-print lg:col-span-6 h-auto lg:h-[calc(100vh-84px)] lg:sticky lg:top-[68px]">
              <InvoiceForm
                data={invoiceData}
                onChange={setInvoiceData}
                onLoadSample={handleLoadSample}
                onReset={handleReset}
              />
            </div>

            {/* Right 6 cols: Preview Workbench */}
            <div className="lg:col-span-6 h-auto lg:h-[calc(100vh-84px)] lg:sticky lg:top-[68px] flex flex-col">
              {renderPreviewCanvas(true)}
            </div>
          </div>
        )}

        {/* EDITOR ONLY VIEW */}
        {viewMode === 'editor' && (
          <div className="max-w-5xl w-full mx-auto flex-1 min-h-[calc(100vh-120px)]">
            <InvoiceForm
              data={invoiceData}
              onChange={setInvoiceData}
              onLoadSample={handleLoadSample}
              onReset={handleReset}
            />
          </div>
        )}

        {/* PREVIEW ONLY VIEW */}
        {viewMode === 'preview' && (
          <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col items-center">
            {renderPreviewCanvas(false)}
          </div>
        )}
      </main>

      {/* ================= MOBILE STICKY BOTTOM ACTION BAR (VISIBLE ON SCREENS < 1024px) ================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-slate-500 font-medium">Total Amount:</span>
          <span className="text-sm font-extrabold text-indigo-700 truncate">
            ₹ {formatIndianCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {viewMode === 'editor' ? (
            <button
              type="button"
              onClick={() => {
                setViewMode('preview');
                // Auto adjust zoom for preview
                handleFitScreen();
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5 shadow-2xs hover:bg-indigo-100 transition cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview A4</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5 shadow-2xs hover:bg-slate-200 transition cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Back to Edit</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDownloadPdf('download')}
            disabled={isGeneratingPdf}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isGeneratingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Offscreen unscaled invoice container for 100% crisp, zero-transform PDF export */}
      <div
        id="invoice-export-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '794px',
          backgroundColor: '#ffffff',
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 1,
        }}
        aria-hidden="true"
      >
        <InvoicePreview ref={exportRef} data={invoiceData} />
      </div>

      {/* Dedicated container for native print (window.print) - prints at 100% vector quality */}
      <div id="invoice-print-container" style={{ display: 'none' }}>
        <InvoicePreview data={invoiceData} />
      </div>

      {/* Invoice History & Backup Modal */}
      {isHistoryModalOpen && (
        <InvoiceHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          currentInvoice={invoiceData}
          onLoadInvoice={(loadedData) => setInvoiceData(loadedData)}
        />
      )}
    </div>
  );
};

export default App;
