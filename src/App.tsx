import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { InvoiceData } from './types/invoice';
import { sampleInvoiceData } from './utils/sampleData';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceHistoryModal } from './components/InvoiceHistoryModal';
import { formatIndianCurrency } from './utils/numberToWords';
import { getEffectiveTaxSummary, getTaxTotals } from './utils/taxCalculation';
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
  DownloadCloud,
  Zap,
  TrendingUp,
  Store,
  LogIn,
  LogOut,
  ChevronDown,
  MoreVertical,
  Menu,
  X,
  Sparkles,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { getNextInvoiceNo, recordLastInvoiceNo } from './utils/invoiceSequence';
import { usePwa } from './utils/usePwa';
import { AuthModal } from './components/AuthModal';
import { DailySalesModal } from './components/DailySalesModal';
import { LoginPortal } from './components/LoginPortal';
import { getStoredUserSession, authApi } from './services/api';
import type { UserSession } from './services/api';

const DRAFT_STORAGE_KEY = 'gst_invoice_current_draft_v1';

export const App: React.FC = () => {
  const { isInstallable, isOffline, installApp } = usePwa();
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.seller && Array.isArray(parsed.items) && parsed.items.length > 0) {
            // Clean up legacy hardcoded sample values if present so calculation is immediately dynamic
            if (parsed.customAmountInWords === 'INR Thirty Nine Thousand Five Hundred Sixty Only') {
              parsed.customAmountInWords = '';
            }
            if (
              parsed.customTaxAmountInWords ===
              'INR Six Thousand Thirty Four and Fifty Eight paise Only'
            ) {
              parsed.customTaxAmountInWords = '';
            }
            if (
              parsed.taxMode === 'manual' &&
              (parsed.taxSummary?.[0]?.taxableValue === 33525.4 || !parsed.taxSummary || parsed.taxSummary.length === 0)
            ) {
              parsed.taxMode = 'auto';
              parsed.taxSummary = [];
            }
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
  const [userSession, setUserSession] = useState<UserSession | null>(() => getStoredUserSession());
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isDailySalesModalOpen, setIsDailySalesModalOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#shop-menu-container')) {
        setIsShopMenuOpen(false);
      }
      if (!target.closest('#more-menu-container')) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    setIsGuestMode(false);
    if (session.shopName) {
      setInvoiceData((prev) => ({
        ...prev,
        seller: {
          ...prev.seller,
          name: session.shopName,
          gstin: session.gstin || prev.seller.gstin,
          phone: session.phone || prev.seller.phone,
        },
        signatoryCompany: session.shopName,
      }));
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setUserSession(null);
    setIsGuestMode(false);
    setIsShopMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsMobileDrawerOpen(false);
  };

  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'editor';
    }
    return 'split';
  });

  // Responsive layout sync on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode((current) => (current === 'split' ? 'editor' : current));
      } else {
        setViewMode((current) => (current !== 'split' ? 'split' : current));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      recordLastInvoiceNo(rawInvoiceNo);
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
        onclone: (clonedDoc) => {
          const exportContainer = clonedDoc.getElementById('invoice-export-container');
          if (exportContainer) {
            exportContainer.style.setProperty('position', 'fixed', 'important');
            exportContainer.style.setProperty('left', '0px', 'important');
            exportContainer.style.setProperty('top', '0px', 'important');
            exportContainer.style.setProperty('visibility', 'visible', 'important');
            exportContainer.style.setProperty('opacity', '1', 'important');
            exportContainer.style.setProperty('z-index', '9999', 'important');
          }
        },
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

      if (action === 'open') {
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
      } else {
        // Direct reliable download: Use jsPDF's built-in save method with multi-layer fallback
        try {
          pdf.save(fileName);
        } catch (saveErr) {
          console.warn('pdf.save failed, falling back to manual anchor download', saveErr);
          const pdfBlob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.setAttribute('download', fileName);
          // Never use display: 'none' as Chromium drops programmatic clicks on unrendered nodes
          link.style.position = 'fixed';
          link.style.top = '-9999px';
          link.style.left = '-9999px';
          link.style.opacity = '0';
          document.body.appendChild(link);

          const clickEvt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          link.dispatchEvent(clickEvt);

          setTimeout(() => {
            if (link.parentNode) {
              link.parentNode.removeChild(link);
            }
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);

      // Auto-save generated invoice to history records so reports & backups are immediately updated
      try {
        const rawHistory = localStorage.getItem('gst_invoices_history_records');
        const list = rawHistory ? JSON.parse(rawHistory) : [];
        const invNo = invoiceData.dispatch.invoiceNo || 'Draft';
        const rawTotal = invoiceData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const rounded = invoiceData.enableRoundOff !== false ? Math.round(rawTotal) : rawTotal;
        const newRecord = {
          id: `inv-${Date.now()}`,
          invoiceNo: invNo,
          invoiceDate: invoiceData.dispatch.invoiceDate || new Date().toLocaleDateString('en-GB'),
          buyerName: invoiceData.buyer.name || 'Unnamed Buyer',
          sellerName: invoiceData.seller.name || 'Seller',
          totalAmount: rounded,
          itemCount: invoiceData.items.length,
          savedAt: new Date().toLocaleString('en-IN'),
          data: JSON.parse(JSON.stringify(invoiceData)),
        };
        const existingIdx = list.findIndex(
          (r: any) => (r.invoiceNo || '').trim().toLowerCase() === invNo.trim().toLowerCase()
        );
        if (existingIdx >= 0) {
          list[existingIdx] = newRecord;
        } else {
          list.unshift(newRecord);
        }
        localStorage.setItem('gst_invoices_history_records', JSON.stringify(list));
      } catch (saveHistoryErr) {
        console.warn('Auto-save to history failed', saveHistoryErr);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback
      alert('Could not generate PDF canvas. Opening Print dialog instead.');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 1-Click WhatsApp Invoice Share
  const handleShareWhatsApp = () => {
    const rawNo = invoiceData.dispatch?.invoiceNo || 'Draft';
    const totalFormatted = formatIndianCurrency(totalAmount);
    const seller = invoiceData.seller?.name || userSession?.shopName || 'Our Shop';
    const buyer = invoiceData.buyer?.name || 'Valued Customer';
    const itemsCount = invoiceData.items.length;

    const text = 
`🧾 *TAX INVOICE - ${seller}*
---------------------------------------
*Invoice No:* #${rawNo}
*Date:* ${invoiceData.dispatch.invoiceDate || 'Today'}
*Billed To:* ${buyer}
*Total Items:* ${itemsCount}
*Grand Total:* ₹ ${totalFormatted}
---------------------------------------
Your GST Tax Invoice has been generated.
Thank you for your business! 🙏`;

    let phone = '';
    const nameMatch = invoiceData.buyer?.name?.match(/\b[6-9]\d{9}\b/);
    if (nameMatch) {
      phone = nameMatch[0];
    } else {
      const input = window.prompt(
        'Please enter Customer\'s 10-digit WhatsApp number:',
        ''
      );
      if (input === null) return;
      phone = input.replace(/[^0-9]/g, '');
    }

    const encoded = encodeURIComponent(text);
    const url = phone && phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
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
      } catch (e) { }
    }
  };

  // Reset to blank invoice
  const handleReset = () => {
    if (
      window.confirm('Start a new blank invoice? Your current draft will be cleared.')
    ) {
      let defaultSeller = {
        name: '',
        addressLine1: '',
        addressLine2: '',
        gstin: '',
        stateName: '',
        stateCode: '',
        email: '',
      };
      let defaultBankDetails = {
        showBankDetails: true,
        bankName: '',
        accountNo: '',
        branchAndIfsc: '',
        upiId: '',
        showQrCode: true,
      };
      let defaultSignatory = '';

      try {
        const savedProfile = localStorage.getItem('saved_user_company_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.seller) defaultSeller = parsed.seller;
          if (parsed.bankDetails) defaultBankDetails = parsed.bankDetails;
          if (parsed.signatoryCompany) defaultSignatory = parsed.signatoryCompany;
        }
      } catch (e) { }

      // Automatically compute next sequence invoice number (e.g. 74 -> 75, or INV/089 -> INV/090)
      const currentNo = invoiceData.dispatch?.invoiceNo;
      if (currentNo) {
        recordLastInvoiceNo(currentNo);
      }
      const nextInvoiceNo = getNextInvoiceNo(currentNo);

      setInvoiceData({
        title: 'Tax Invoice',
        seller: defaultSeller,
        signatoryCompany: defaultSignatory,
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
          invoiceNo: nextInvoiceNo,
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
        bankDetails: defaultBankDetails,
      });
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) { }
    }
  };

  const isInclusive = invoiceData.pricingMode !== 'exclusive';
  const itemsSubtotal = invoiceData.items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const taxRows = getEffectiveTaxSummary(invoiceData);
  const taxTotals = getTaxTotals(taxRows);
  const rawTotal = isInclusive
    ? itemsSubtotal
    : itemsSubtotal + taxTotals.totalTaxAmount;
  const totalAmount =
    invoiceData.enableRoundOff !== false ? Math.round(rawTotal) : Math.round(rawTotal * 100) / 100;

  // Render Preview Canvas with mathematically precise scaling wrapper
  const renderPreviewCanvas = (isSplitLayout: boolean = false) => {
    const scaledWidth = Math.round(794 * zoomLevel);
    const scaledHeight = Math.round(1123 * zoomLevel);

    return (
      <div className="w-full h-full flex flex-col">
        {/* Preview Toolbar - Classic Executive Styling */}
        <div className="no-print w-full flex items-center justify-between bg-white text-slate-800 px-3.5 sm:px-4 py-2.5 rounded-t-2xl border border-slate-200 border-b-0 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-xs shadow-blue-500/50"></span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                A4 Document Studio
              </span>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full hidden sm:inline border border-slate-200">
                210 × 297 mm • Vector Exact
              </span>
            </div>
          </div>

          {/* Zoom controls - Pill Segmented Stepper */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.35, Math.round((z - 0.08) * 100) / 100))}
              className="p-1 sm:p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer active:scale-90"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono font-bold text-slate-800 px-1.5 min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, Math.round((z + 0.08) * 100) / 100))}
              className="p-1 sm:p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer active:scale-90"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="h-3 w-px bg-slate-200 mx-0.5"></div>

            <button
              type="button"
              onClick={handleFitScreen}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3 h-3 text-white" />
              <span>Fit</span>
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel(1.0)}
              className="hidden sm:inline-block px-2 py-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 text-[10px] font-semibold transition cursor-pointer active:scale-95"
              title="Actual 100% Size"
            >
              100%
            </button>
          </div>
        </div>

        {/* Scrollable canvas container with bulletproof centered scale wrapper & Studio Canvas */}
        <div
          className={`w-full flex-1 bg-studio-canvas p-3 sm:p-6 rounded-b-2xl border border-slate-200 overflow-auto flex flex-col items-center shadow-inner ${isSplitLayout ? '' : 'min-h-[520px] sm:min-h-[880px]'
            }`}
        >
          {/* Scaled bounding container with realistic paper shadow */}
          <div
            style={{
              width: `${scaledWidth}px`,
              minHeight: `${scaledHeight}px`,
              position: 'relative',
              margin: '0 auto',
              flexShrink: 0,
            }}
            className="shadow-paper rounded-[2px] transition-shadow duration-300"
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

  // Gatekeeper: If user is not logged in and not in guest mode, show the Login Portal
  if (!userSession && !isGuestMode) {
    return (
      <LoginPortal
        onLoginSuccess={(session) => {
          handleLoginSuccess(session);
          setIsGuestMode(false);
        }}
        onContinueAsGuest={() => setIsGuestMode(true)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 flex flex-col text-slate-900 font-sans pb-20 lg:pb-0">
      {/* Guest Mode Banner - Fully Responsive */}
      {isGuestMode && !userSession && (
        <div className="no-print bg-amber-500/10 border-b border-amber-200 px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-amber-900 w-full max-w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
            <span className="font-semibold truncate sm:whitespace-normal">
              Guest Demo Mode: Invoices not synced to cloud database.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsGuestMode(false)}
            className="px-2.5 sm:px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] sm:text-[11px] shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            Shop Login
          </button>
        </div>
      )}

      {/* ================= TOP MODERN CLEAN HEADER ================= */}
      <header className="no-print sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md w-full max-w-full">
        <div className="max-w-[1780px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 w-full">

          {/* ZONE 1 (LEFT): BRAND IDENTITY & ACTIVE SHOP BADGE */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                  GST Studio
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline">
                  Tally A4
                </span>
                {isOffline && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span className="hidden md:inline">Offline</span>
                  </span>
                )}
              </div>
            </div>

            {/* Shop Badge & Dropdown */}
            {userSession ? (
              <div className="relative" id="shop-menu-container">
                <button
                  type="button"
                  onClick={() => setIsShopMenuOpen(!isShopMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-2.5 py-1 text-xs transition cursor-pointer shadow-2xs group text-white"
                  title="Shop Details & Profile"
                >
                  <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-bold text-white max-w-[110px] sm:max-w-[160px] truncate">
                    {userSession.shopName}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition" />
                </button>

                {/* Shop Menu Dropdown */}
                {isShopMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 mb-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Shop Profile</p>
                      <p className="font-extrabold text-sm text-white truncate mt-0.5">{userSession.shopName}</p>
                      <p className="text-xs text-blue-400 font-mono mt-0.5">📞 +91 {userSession.phone}</p>
                      {userSession.gstin && (
                        <p className="text-[11px] text-slate-300 font-mono mt-0.5">GST: {userSession.gstin}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDailySalesModalOpen(true);
                        setIsShopMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                      <span>Daily Sales & Stock Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHistoryModalOpen(true);
                        setIsShopMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-blue-400" />
                      <span>Invoice History & Backups</span>
                    </button>

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Logout Shop</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsGuestMode(false)}
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Shop Login</span>
              </button>
            )}
          </div>

          {/* ZONE 2 (CENTER): CLEAN VIEW SWITCHER (LG+ SCREENS) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs font-medium shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'split'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                  }`}
                title="Split View: Side-by-side Editor & Preview"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'editor'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                  }`}
                title="Editor View Only"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                  }`}
                title="Preview View Only"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {/* Gross total pill */}
            <div className="hidden xl:flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-xl text-xs font-medium text-slate-300">
              <span>Gross:</span>
              <span className="font-extrabold text-emerald-400">₹ {formatIndianCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* ZONE 3 (RIGHT): PRIMARY ACTIONS */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Sales Report Button (hidden on mobile, accessible in mobile drawer) */}
            <button
              id="btn-daily-sales"
              type="button"
              onClick={() => setIsDailySalesModalOpen(true)}
              className="hidden sm:flex px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              title="Daily Sales & Product Turnover Analytics"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Sales Report</span>
            </button>

            {/* History Button (hidden on mobile, in drawer) */}
            <button
              id="btn-invoice-history"
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="hidden sm:flex px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              title="Open Invoice History & Backups"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>History</span>
            </button>

            {/* WhatsApp Share Button (hidden on mobile, in drawer) */}
            <button
              id="btn-whatsapp-share"
              type="button"
              onClick={handleShareWhatsApp}
              className="hidden md:flex px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition cursor-pointer active:scale-95"
              title="Share Invoice summary with customer on WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span>WhatsApp</span>
            </button>

            {/* Primary Action: Download PDF (hidden on mobile, mobile has sticky bottom PDF button) */}
            <button
              id="btn-download-pdf"
              type="button"
              onClick={() => handleDownloadPdf('download')}
              disabled={isGeneratingPdf}
              className="hidden sm:flex px-3 sm:px-4 py-1.5 text-xs font-extrabold rounded-xl bg-blue-600 hover:bg-blue-700 text-white items-center gap-1.5 shadow-md shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer active:scale-95"
              title="Download PDF"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : downloadSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>{isGeneratingPdf ? 'Saving...' : downloadSuccess ? 'Saved!' : 'Download PDF'}</span>
            </button>

            {/* Mobile Quick PDF Button (< sm) */}
            <button
              type="button"
              onClick={() => handleDownloadPdf('download')}
              disabled={isGeneratingPdf}
              className="sm:hidden p-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
              title="Download PDF"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
            </button>

            {/* Clean More Actions Dropdown (hidden on mobile, in drawer) */}
            <div className="hidden sm:block relative" id="more-menu-container">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-1.5 sm:p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition cursor-pointer active:scale-95 shadow-2xs"
                title="More Options (Print, View, Install, Reset)"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      handleShareWhatsApp();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handlePrint();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Print Direct A4</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadPdf('open');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Open PDF in Tab</span>
                  </button>

                  {isInstallable && (
                    <button
                      type="button"
                      onClick={() => {
                        installApp();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <DownloadCloud className="w-3.5 h-3.5 text-blue-400" />
                      <span>Install Offline App</span>
                    </button>
                  )}

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    type="button"
                    onClick={() => {
                      handleLoadSample();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Load Sample Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleReset();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reset Blank Invoice</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Drawer Trigger (< lg screens) */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition cursor-pointer active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MOBILE VIEW SWITCHER (< 1024px) */}
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-3 py-1.5 flex items-center justify-center gap-2">
          <div className="w-full max-w-md grid grid-cols-2 bg-slate-950 p-1 rounded-xl text-xs font-semibold border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                viewMode !== 'preview'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Invoice</span>
              <span className="text-[10px] bg-slate-800 text-blue-300 border border-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {invoiceData.items.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('preview');
                handleFitScreen();
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>A4 Preview</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-72 bg-slate-900 text-white border-l border-slate-800 h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-sm text-white">GST Studio</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Shop info if logged in */}
              {userSession ? (
                <div className="my-4 p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Logged in Shop</p>
                  <p className="font-extrabold text-sm text-white truncate mt-0.5">{userSession.shopName}</p>
                  <p className="text-xs text-blue-400 font-mono mt-0.5">📞 +91 {userSession.phone}</p>
                </div>
              ) : (
                <div className="my-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGuestMode(false);
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <LogIn className="w-4 h-4 text-white" />
                    <span>Shop Login / Register</span>
                  </button>
                </div>
              )}

              <div className="space-y-1 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDailySalesModalOpen(true);
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Daily Sales Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleShareWhatsApp();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2.5 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsHistoryModalOpen(true);
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                >
                  <History className="w-4 h-4 text-blue-400" />
                  <span>Invoice History & Backups</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePrint();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span>Print Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPdf('open');
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>View PDF in New Tab</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleLoadSample();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Load Sample Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/20 flex items-center gap-2.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Reset to Blank Invoice</span>
                </button>
              </div>
            </div>

            {userSession && (
              <div className="pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout Shop</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= WORKSPACE BODY ================= */}
      <main className="flex-1 max-w-[1780px] w-full min-w-0 max-w-full overflow-x-hidden mx-auto p-2 sm:p-4 flex flex-col">
        {/* SPLIT VIEW (DESKTOP / LAPTOP ONLY, >= 1024px) */}
        {viewMode === 'split' && (
          <div className="hidden lg:grid grid-cols-12 gap-4 flex-1 items-start">
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

        {/* EDITOR VIEW (ALWAYS WHEN IN EDITOR OR ON MOBILE WHEN NOT PREVIEW) */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'lg:hidden ' : ''}max-w-5xl w-full mx-auto flex-1 min-h-[calc(100vh-120px)]`}>
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Gross Total</span>
          <span className="text-base font-extrabold text-emerald-400 truncate">
            ₹ {formatIndianCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {viewMode === 'preview' ? (
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-700 transition cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit Form</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setViewMode('preview');
                handleFitScreen();
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-700 transition cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>A4 Proof</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDownloadPdf('download')}
            disabled={isGeneratingPdf}
            className="px-4 py-2 text-xs font-extrabold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isGeneratingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-white" />
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
          left: '-9999px',
          width: '794px',
          backgroundColor: '#ffffff',
          zIndex: -9999,
          pointerEvents: 'none',
          visibility: 'hidden',
          opacity: 0,
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

      {/* Shop Owner Authentication Modal (Mobile OTP & Shop Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Daily Sales & Stock Breakdown Modal */}
      <DailySalesModal
        isOpen={isDailySalesModalOpen}
        onClose={() => setIsDailySalesModalOpen(false)}
      />
    </div>
  );
};

export default App;
