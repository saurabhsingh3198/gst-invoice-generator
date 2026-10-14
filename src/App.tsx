import React, { useRef, useState } from 'react';
import type { InvoiceData } from './types/invoice';
import { sampleInvoiceData } from './utils/sampleData';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceForm } from './components/InvoiceForm';
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
} from 'lucide-react';

export const App: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(sampleInvoiceData);
  const [zoomLevel, setZoomLevel] = useState<number>(0.78);
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Native Print (Best vector crispness, Save as PDF via browser)
  const handlePrint = () => {
    window.print();
  };

  // Direct Client-Side PDF Download & View
  const handleDownloadPdf = async (action: 'download' | 'open' = 'download') => {
    // Always capture from dedicated offscreen export container to guarantee 100% unscaled capture
    let target = exportRef.current || document.getElementById('invoice-export-document');
    if (!target) {
      target = previewRef.current || document.getElementById('invoice-document');
    }
    if (!target) {
      alert('Invoice document not found. Please try again.');
      return;
    }

    setIsGeneratingPdf(true);
    setDownloadSuccess(false);

    try {
      // Small delay to ensure all fonts and DOM layout are settled
      await new Promise((resolve) => setTimeout(resolve, 80));

      const rawInvoiceNo = invoiceData.dispatch.invoiceNo ? invoiceData.dispatch.invoiceNo.trim() : '74';
      const cleanInvoiceNo = rawInvoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Sales_${cleanInvoiceNo}.pdf`;

      // Render high resolution canvas (scale 2.5 for crisp 240-300dpi output)
      const canvas = await html2canvas(target, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Create A4 jsPDF instance (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      // Single exact A4 page
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const pdfBlob = pdf.output('blob');

      if (action === 'open') {
        // Open PDF in new tab
        const fileUrl = URL.createObjectURL(pdfBlob);
        window.open(fileUrl, '_blank');
      } else {
        // Direct browser file download with explicit .pdf MIME and filename
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(file);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.setAttribute('download', fileName);
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          URL.revokeObjectURL(downloadUrl);
        }, 1500);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3500);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to native print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Restore sample data
  const handleLoadSample = () => {
    setInvoiceData(JSON.parse(JSON.stringify(sampleInvoiceData)));
  };

  // Reset to blank invoice
  const handleReset = () => {
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
      showTaxSummary: false,
      customAmountInWords: '',
    });
  };

  const totalAmount = invoiceData.items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col text-slate-800 font-sans">
      {/* ================= TOP CLASSIC EXECUTIVE HEADER ================= */}
      <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-[1780px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-sm">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900">
                  GST Invoice Studio
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tally A4 Exact
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Professional Tax Invoice Designer with Vector PDF Export
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="hidden md:flex items-center gap-3.5 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Invoice: </span>
              <span className="font-bold text-slate-800">
                #{invoiceData.dispatch.invoiceNo || '—'}
              </span>
            </div>
            <div className="h-3.5 w-px bg-slate-300"></div>
            <div>
              <span className="text-slate-400 font-medium">Items: </span>
              <span className="font-bold text-slate-800">{invoiceData.items.length}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-300"></div>
            <div>
              <span className="text-slate-400 font-medium">Gross Total: </span>
              <span className="font-extrabold text-indigo-700">
                ₹ {formatIndianCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                  viewMode === 'split'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Split View: Editor & Preview"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                  viewMode === 'editor'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Full Editor View"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                  viewMode === 'preview'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Full A4 Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>

            {/* Print / Save as PDF Button */}
            <button
              id="btn-print-invoice"
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 transition shadow-xs"
              title="Print directly or select 'Save as PDF' in print dialog for 100% crisp vector quality"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* View PDF in new tab Button */}
            <button
              id="btn-view-pdf"
              type="button"
              onClick={() => handleDownloadPdf('open')}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 border border-slate-300 transition shadow-xs disabled:opacity-50"
              title="Open generated PDF in a new browser tab to view and inspect"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">View PDF</span>
            </button>

            {/* Download PDF Button */}
            <button
              id="btn-download-pdf"
              type="button"
              onClick={() => handleDownloadPdf('download')}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
              title="Download Tax_Invoice_74.pdf directly to your computer"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : downloadSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Generating...' : downloadSuccess ? 'Saved!' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= WORKSPACE BODY ================= */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto p-3 sm:p-4 flex flex-col">
        {/* SPLIT VIEW */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
            {/* Left 6 cols: Editor (hidden on print) */}
            <div className="no-print lg:col-span-6 h-[calc(100vh-84px)] sticky top-[68px]">
              <InvoiceForm
                data={invoiceData}
                onChange={setInvoiceData}
                onLoadSample={handleLoadSample}
                onReset={handleReset}
              />
            </div>

            {/* Right 6 cols: Preview Workbench */}
            <div className="lg:col-span-6 h-[calc(100vh-84px)] sticky top-[68px] flex flex-col">
              {/* Preview Workbench Bar */}
              <div className="no-print w-full flex items-center justify-between bg-white px-4 py-2 rounded-t-xl border border-slate-200 border-b-0 shadow-2xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-800">
                    A4 Paper Proof
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (100% Vector Quality)
                  </span>
                </div>

                {/* Floating Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.08))}
                    className="p-1 hover:bg-white rounded text-slate-600 transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-700 px-1.5 min-w-[42px] text-center font-bold">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.08))}
                    className="p-1 hover:bg-white rounded text-slate-600 transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(0.78)}
                    className="p-1 hover:bg-white rounded text-slate-600 transition"
                    title="Fit A4 View"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Workbench canvas with independent scrolling */}
              <div className="w-full flex-1 bg-slate-200/80 p-3 sm:p-5 rounded-b-xl border border-slate-200 overflow-auto flex justify-center shadow-inner">
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out',
                  }}
                >
                  <InvoicePreview ref={previewRef} data={invoiceData} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDITOR ONLY VIEW */}
        {viewMode === 'editor' && (
          <div className="max-w-6xl w-full mx-auto flex-1 min-h-[calc(100vh-100px)]">
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
          <div className="flex flex-col items-center w-full">
            {/* Toolbar */}
            <div className="no-print w-full max-w-[210mm] flex items-center justify-between bg-white px-4 py-2 rounded-t-xl border border-slate-200 border-b-0 shadow-2xs mb-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-800">
                  Full Page A4 Preview
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.08))}
                    className="p-1 hover:bg-white rounded text-slate-600 transition"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-700 px-1.5 min-w-[42px] text-center font-bold">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.08))}
                    className="p-1 hover:bg-white rounded text-slate-600 transition"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1 hover:bg-white rounded text-slate-600 transition"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-200/70 p-4 sm:p-8 rounded-b-xl border border-slate-200 overflow-x-auto flex justify-center shadow-inner min-h-[850px]">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
              >
                <InvoicePreview ref={previewRef} data={invoiceData} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Offscreen unscaled invoice container for 100% crisp, zero-transform PDF export */}
      <div
        id="invoice-export-container"
        style={{
          position: 'fixed',
          top: '-10000px',
          left: '-10000px',
          width: '210mm',
          backgroundColor: '#ffffff',
          zIndex: -10000,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <InvoicePreview ref={exportRef} data={invoiceData} />
      </div>

      {/* Dedicated container for native print (window.print) - prints at 100% vector quality */}
      <div id="invoice-print-container" style={{ display: 'none' }}>
        <InvoicePreview data={invoiceData} />
      </div>
    </div>
  );
};

export default App;
