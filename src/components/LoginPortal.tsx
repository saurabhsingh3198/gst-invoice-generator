import React, { useState } from 'react';
import {
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileSpreadsheet,
  Lock,
  Building2,
  User,
  Mail,
  Briefcase,
  Key,
  ChevronDown,
  Zap,
  Receipt,
  QrCode,
  Calculator,
} from 'lucide-react';
import { authApi } from '../services/api';
import type { UserSession } from '../services/api';

interface LoginPortalProps {
  onLoginSuccess: (session: UserSession) => void;
  onContinueAsGuest: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Invoicing Registration fields
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [businessType, setBusinessType] = useState('Building Materials & Hardware');
  const [gstin, setGstin] = useState('');
  const stateName = 'Uttar Pradesh';
  const stateCode = '09';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your mobile number or email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.sendOtp(identifier.trim());
      setOtpSent(true);
      setSuccessMsg(res.message || 'OTP sent successfully to your email/phone.');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError('Please enter the 6-digit OTP code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const session = await authApi.verifyOtp(identifier.trim(), otpCode.trim());
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please enter the valid OTP sent to your device.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupPhone.trim() || !shopName.trim()) {
      setError('Shop / Trade Name and Mobile Number are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const session = await authApi.signup({
        phone: signupPhone.trim(),
        shopName: shopName.trim(),
        gstin: gstin.trim(),
        stateName,
        stateCode,
      });
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Failed to register shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-[#fafafa] text-slate-900 flex flex-col justify-between selection:bg-red-600 selection:text-white relative overflow-hidden font-sans">
      {/* Subtle dotted matrix background matching reference */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Subtle ambient light gradient blur on the edges */}
      <div className="absolute top-[10%] right-[-5%] w-[420px] h-[500px] rounded-full bg-rose-200/35 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[0%] left-[-5%] w-[320px] h-[320px] rounded-full bg-red-100/30 blur-[100px] pointer-events-none" />

      {/* TOP HEADER (COMPACT, NO-SCROLL) */}
      <header className="relative z-10 max-w-[1380px] mx-auto w-full px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-xs shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm sm:text-base tracking-tight text-slate-900">
              GST Studio
            </span>
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Tally A4
            </span>
            <span className="text-[11px] text-slate-500 hidden md:inline border-l border-slate-200 pl-2">
              Fast, Accurate & Professional GST Billing
            </span>
          </div>
        </div>

        {/* Quick Demo Access Button */}
        <button
          type="button"
          onClick={onContinueAsGuest}
          className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <span>Open Demo Studio</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#DC2626]" />
        </button>
      </header>

      {/* MAIN CONTAINER (COMPACT, FITS EXACTLY IN VIEWPORT WITHOUT SCROLLING) */}
      <main className="relative z-10 max-w-[1380px] mx-auto w-full px-4 sm:px-8 py-2 sm:py-4 flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 overflow-hidden">

        {/* LEFT COLUMN: HERO HEADLINE, STEPS, INVOICE CARDS & METRICS */}
        <div className="w-full lg:w-1/2 flex flex-col items-start justify-center h-full">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-800 mb-2.5 sm:mb-3">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
            <span>100% TALLY-EXACT GST TAX INVOICING</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-[1.14] text-slate-950 mb-2 font-sans">
            Create Professional & Compliant <br className="hidden sm:block" />
            <span className="text-[#DC2626] relative inline-block underline decoration-[#DC2626] decoration-[3px] underline-offset-4">
              GST Tax Invoices
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed mb-3 sm:mb-4">
            Generate authentic A4 tax invoices in seconds with auto-calculated CGST, SGST & IGST. Print instantly, export vector PDF, or share WhatsApp payment summaries.
          </p>

          {/* 3-Step Stepper Switcher */}
          <div className="w-full max-w-lg bg-slate-100/90 p-1 rounded-xl border border-slate-200 flex items-center justify-between gap-1 mb-3.5 shadow-2xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveStepTab(1)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeStepTab === 1
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Add Items
              </button>
              <button
                type="button"
                onClick={() => setActiveStepTab(2)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeStepTab === 2
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Auto GST & HSN
              </button>
              <button
                type="button"
                onClick={() => setActiveStepTab(3)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeStepTab === 3
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                3. Print & Share
              </button>
            </div>

            {/* Stepper Dots Indicator */}
            <div className="hidden sm:flex items-center gap-1 px-2 shrink-0">
              <span className={`h-1.5 rounded-full transition-all ${activeStepTab === 1 ? 'w-4 bg-[#DC2626]' : 'w-1.5 bg-slate-300'}`}></span>
              <span className={`h-1.5 rounded-full transition-all ${activeStepTab === 2 ? 'w-4 bg-[#DC2626]' : 'w-1.5 bg-slate-300'}`}></span>
              <span className={`h-1.5 rounded-full transition-all ${activeStepTab === 3 ? 'w-4 bg-[#DC2626]' : 'w-1.5 bg-slate-300'}`}></span>
            </div>
          </div>

          {/* 4 Invoicing Feature Cards (2x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full mb-3.5">
            <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold text-slate-800 leading-snug">
                10-Second Invoicing: Quick line item entry with live totals
              </p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold text-slate-800 leading-snug">
                Tally Exact A4 Standard: Strict 210 × 297 mm compliant print
              </p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold text-slate-800 leading-snug">
                Bank & UPI QR Code: Dynamic scan-to-pay printed on invoice
              </p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold text-slate-800 leading-snug">
                Instant HSN Tax Breakdown: Auto CGST/SGST 9%+9% or IGST
              </p>
            </div>
          </div>

          {/* 3 Metrics Row & Direct Button */}
          <div className="flex items-center justify-between max-w-lg w-full pt-2 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-lg sm:text-xl font-black text-slate-950">100%</div>
                <div className="text-[10px] text-slate-500 font-medium">GST Compliant</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-[#DC2626]">₹ 0</div>
                <div className="text-[10px] text-slate-500 font-medium">Free To Use</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-emerald-600">A4 PDF</div>
                <div className="text-[10px] text-slate-500 font-medium">Vector Exact</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onContinueAsGuest}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition cursor-pointer active:scale-95 shrink-0"
            >
              <span>OPEN STUDIO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: FLOATING INPUT FORM CARD (COMPACT, NO-SCROLL) */}
        <div className="w-full lg:w-[460px] xl:w-[490px] shrink-0 my-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/90 relative">

            {/* Header: EXPRESS ACCESS with red highlight & FREE CLOUD pill */}
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-tight font-sans">
                  EXPRESS{' '}
                  <span className="text-[#DC2626] relative inline-block underline decoration-[#DC2626] decoration-[2.5px] underline-offset-4">
                    ACCESS
                  </span>
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#DC2626] text-[9px] font-extrabold tracking-wider uppercase shrink-0">
                FREE CLOUD
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-3.5">
              Activate your shop workspace to auto-fill GSTIN, save company profile, and track invoices.
            </p>

            {/* Mode Switcher: Register vs Quick OTP Login */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 mb-3.5 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🏬 Register Shop Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                📱 Mobile / OTP Login
              </button>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SHOP REGISTRATION (INVOICING SPECIFIC) */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-2.5">
                {/* Row 1: Company Name & Owner Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Company Name (Highlighted in Red border) */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#DC2626] mb-1 uppercase tracking-wider">
                      COMPANY / TRADE NAME <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#DC2626]">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Acme Forgings Ltd."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#DC2626] focus:border-[#b91c1c] focus:ring-2 focus:ring-red-500/10 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition shadow-2xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Owner Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Owner Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Mobile with +91 Country Pill & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Phone with Country Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="flex rounded-xl border border-slate-200 focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-red-500/10 overflow-hidden bg-white shadow-2xs transition">
                      <div className="flex items-center gap-1 px-2 py-2 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-800 shrink-0">
                        <span>🇮🇳</span>
                        <span>+91</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="9876543210"
                        maxLength={10}
                        className="w-full px-2.5 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Billing Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        placeholder="billing@shop.com"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Business Category & GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Business Type
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full pl-9 pr-7 py-2 bg-white border border-slate-200 focus:border-[#DC2626] rounded-xl text-xs font-semibold text-slate-800 outline-none appearance-none shadow-2xs cursor-pointer"
                      >
                        <option value="Building Materials & Hardware">Building Materials & Hardware</option>
                        <option value="Wholesale Trader">Wholesale Trader</option>
                        <option value="Retail Store">Retail Store</option>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Electricals & Electronics">Electricals & Electronics</option>
                        <option value="FMCG & Groceries">FMCG & Groceries</option>
                        <option value="Services / Contractor">Services / Contractor</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* GSTIN / UIN */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      GSTIN (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Key className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="e.g. 09FELPS6664L1ZE"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-xs uppercase font-mono font-bold text-slate-900 placeholder:normal-case placeholder:font-sans outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Big Red Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1.5 py-3 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>LAUNCH GST INVOICE STUDIO</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: MOBILE / OTP LOGIN */}
            {activeTab === 'login' && (
              <div className="space-y-3.5">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Registered Mobile or Email <span className="text-[#DC2626]">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g. 9876543210 or shop@example.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 transition outline-none shadow-2xs"
                          autoFocus
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        A 6-digit login verification OTP will be sent to your device.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>SEND LOGIN OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Enter 6-Digit OTP <span className="text-[#DC2626]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode('');
                          }}
                          className="text-[11px] text-[#DC2626] font-bold hover:underline cursor-pointer"
                        >
                          Change Number
                        </button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="● ● ● ● ● ●"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-slate-900 text-base font-mono tracking-widest text-center transition outline-none shadow-2xs font-black"
                          autoFocus
                          required
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Didn&apos;t receive code?</span>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading}
                          className="text-[11px] font-bold text-[#DC2626] hover:underline cursor-pointer disabled:opacity-50"
                        >
                          Resend Code
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>VERIFY & OPEN STUDIO</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Trust Footer Badges */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Data Isolation</span>
              </div>
              <span>•</span>
              <span>Instant Vector PDF Printing</span>
            </div>

            {/* Bottom Guest Option Link */}
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-[11px] text-slate-400 hover:text-slate-700 transition inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Want to test invoice generator first?</span>
                <span className="text-[#DC2626] font-bold underline">Guest Preview Studio</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER (COMPACT, NO-SCROLL) */}
      <footer className="relative z-10 max-w-[1380px] mx-auto w-full px-4 sm:px-8 py-2 text-center text-[11px] text-slate-400 border-t border-slate-200/80 bg-white/60 shrink-0">
        <p>© 2026 GST Studio • Professional GST Billing & Cloud Ledger • Made for Indian Retailers & Traders</p>
      </footer>
    </div>
  );
};
