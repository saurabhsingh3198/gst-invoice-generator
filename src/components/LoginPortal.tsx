import React, { useState } from 'react';
import {
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileSpreadsheet,
  TrendingUp,
  Lock,
  Building2,
  User,
  Mail,
  Briefcase,
  Target,
  Key,
  Globe,
  Layers,
  MessageSquare,
  ChevronDown,
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
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Signup fields matching screenshot reference
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [businessType, setBusinessType] = useState('Wholesale Trader');
  const [industrySector, setIndustrySector] = useState('Building Materials & Steel');
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
      setError('Company / Shop Name and Mobile Number are required');
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
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col justify-between selection:bg-red-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Subtle dotted grid backdrop & soft pinkish blush matching reference */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-[20%] right-[-5%] w-[480px] h-[580px] rounded-full bg-rose-200/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-5%] w-[380px] h-[380px] rounded-full bg-red-100/30 blur-[120px] pointer-events-none" />

      {/* Top Header Navbar */}
      <header className="relative z-10 max-w-[1380px] mx-auto w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-md shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                GST Studio
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Tally Exact A4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              India&apos;s Modern Verified B2B GST Billing & Cloud Ledger
            </p>
          </div>
        </div>

        {/* Quick Demo Mode Button */}
        <button
          type="button"
          onClick={onContinueAsGuest}
          className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-1.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <span>Demo Studio</span>
          <ArrowRight className="w-4 h-4 text-[#DC2626]" />
        </button>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="relative z-10 max-w-[1380px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-12 flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-14">

        {/* LEFT COLUMN: HERO HEADLINE, STEPS, VALUE CARDS, STATS & CTA BUTTON */}
        <div className="w-full lg:w-1/2 flex flex-col items-start pt-2">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-extrabold tracking-wider uppercase text-slate-800 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
            <span>VERIFIED COMMERCIAL PASSPORT</span>
          </div>

          {/* High-Impact Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-[50px] font-black tracking-tight leading-[1.12] text-slate-950 mb-4">
            Put Your Business in Front of{' '}
            <span className="text-[#DC2626] relative inline-block underline decoration-[#DC2626] decoration-[3px] underline-offset-6">
              Verified Invoicing
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed mb-6 font-normal">
            Your verified B2B GST Studio. Replace static PDFs with live digital invoices, locked HSN tax slabs, UPI payment QR codes, and direct customer phonebook sync.
          </p>

          {/* 3-Step Segmented Pills with Stepper Indicator */}
          <div className="w-full max-w-xl bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-1 mb-6 shadow-2xs">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveStepTab(1)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeStepTab === 1
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Direct Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveStepTab(2)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeStepTab === 2
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Trust & Verification
              </button>
              <button
                type="button"
                onClick={() => setActiveStepTab(3)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeStepTab === 3
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                3. Speed & Payouts
              </button>
            </div>

            {/* Stepper Dots Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 shrink-0">
              <span className={`h-1.5 rounded-full transition-all ${activeStepTab === 1 ? 'w-5 bg-[#DC2626]' : 'w-1.5 bg-slate-300'}`}></span>
              <span className={`h-1.5 rounded-full transition-all ${activeStepTab === 2 ? 'w-5 bg-[#DC2626]' : 'w-1.5 bg-slate-300'}`}></span>
              <span className={`h-1.5 rounded-full transition-all ${activeStepTab === 3 ? 'w-5 bg-[#DC2626]' : 'w-1.5 bg-slate-300'}`}></span>
            </div>
          </div>

          {/* 4 Feature Cards (2x2 Grid) with Green Circular Icons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl w-full mb-7">
            {/* Card 1 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                0% sales commission with zero middleman broker fees
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                Direct binding RFQs straight from verified enterprise buyers
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                Tiered wholesale MOQ slabs to drive bulk order volume
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                Pan-India buyer discovery across major industrial hubs
              </p>
            </div>
          </div>

          {/* 3 Stats Metrics Row */}
          <div className="grid grid-cols-3 gap-3 max-w-xl w-full py-4 border-t border-b border-slate-200 mb-7">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                24 Hours
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Express Activation
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#DC2626] tracking-tight">
                0%
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Listing Commission
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                100%
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Verified Registry Check
              </div>
            </div>
          </div>

          {/* Solid Black Executive Button */}
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
          >
            <span>EXPLORE BIZFRONT CAPABILITIES</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* RIGHT COLUMN: FLOATING INPUT FORM CARD (EXACT SCREENSHOT REFERENCE) */}
        <div className="w-full lg:w-[490px] xl:w-[530px] shrink-0">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 relative">

            {/* Header: EXPRESS INTEREST with red highlight and EARLY ACCESS pill */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-950 uppercase leading-tight font-sans">
                  EXPRESS{' '}
                  <span className="text-[#DC2626] relative inline-block underline decoration-[#DC2626] decoration-[3px] underline-offset-4">
                    INTEREST
                  </span>
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-extrabold tracking-wider uppercase shrink-0">
                EARLY ACCESS
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Submit your business details to activate your official{' '}
              <span className="text-[#DC2626] font-bold">Commercial Passport</span> & digital BizFront.
            </p>

            {/* Mode Switcher: Register vs Quick OTP Login */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 mb-5 gap-1">
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
                🏬 Create Profile
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
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGNUP / PROFILE CREATION (Matches exact input layout of screenshot) */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3.5">
                {/* Row 1: Full Name & Company Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#DC2626] mb-1 uppercase tracking-wider">
                      COMPANY NAME <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#DC2626]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Acme Forgings Ltd."
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#DC2626] focus:border-[#b91c1c] focus:ring-2 focus:ring-red-500/10 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition shadow-2xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Work Email & Mobile with +91 Flag Pill */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Work Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Work Email <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        placeholder="Work Email"
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Phone with Country Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="flex rounded-xl border border-slate-200 focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-red-500/10 overflow-hidden bg-white shadow-2xs transition">
                      <div className="flex items-center gap-1 px-2.5 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-800 shrink-0">
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
                        className="w-full px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Business Type & Industry Sector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Business Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Business Type <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 focus:border-[#DC2626] rounded-xl text-xs font-semibold text-slate-800 outline-none appearance-none shadow-2xs cursor-pointer"
                      >
                        <option value="Wholesale Trader">Wholesale Trader</option>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Retail Store">Retail Store</option>
                        <option value="Distributor">Distributor / Supplier</option>
                        <option value="Services / Contractor">Services / Contractor</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Industry Sector */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#DC2626] mb-1">
                      Industry Sector <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#DC2626]">
                        <Target className="w-4 h-4" />
                      </div>
                      <select
                        value={industrySector}
                        onChange={(e) => setIndustrySector(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-white border border-[#DC2626] focus:border-[#b91c1c] rounded-xl text-xs font-semibold text-slate-800 outline-none appearance-none shadow-2xs cursor-pointer"
                      >
                        <option value="Building Materials & Steel">Building Materials & Steel</option>
                        <option value="Engineering & Forgings">Engineering & Forgings</option>
                        <option value="Electricals & Electronics">Electricals & Electronics</option>
                        <option value="FMCG & Groceries">FMCG & Groceries</option>
                        <option value="Automotive & Spare Parts">Automotive & Spare Parts</option>
                        <option value="Textiles & Garments">Textiles & Garments</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#DC2626] absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 4: Core Objectives & GSTIN */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    GSTIN / Core Objectives (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 09FELPS6664L1ZE or B2B Tax Invoicing"
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-xs uppercase font-mono font-medium text-slate-900 placeholder:normal-case placeholder:font-sans outline-none transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Big Red Vibrant CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>REQUEST PROFILE CREATION</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: MOBILE / OTP LOGIN */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Shop Mobile Number or Email <span className="text-[#DC2626]">*</span>
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
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 transition outline-none shadow-2xs"
                          autoFocus
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        A 6-digit verification code will be sent to your device.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>SEND VERIFICATION OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Enter 6-Digit OTP Code <span className="text-[#DC2626]">*</span>
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
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 rounded-xl text-slate-900 text-lg font-mono tracking-widest text-center transition outline-none shadow-2xs font-black"
                          autoFocus
                          required
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
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
                      className="w-full py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition cursor-pointer active:scale-98 disabled:opacity-50"
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
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enterprise Verified Identity</span>
              </div>
              <span>•</span>
              <span>Priority Fast-Track Activation</span>
            </div>

            {/* Bottom Guest Option Link */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs text-slate-400 hover:text-slate-700 transition inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Want to test invoice generation first?</span>
                <span className="text-[#DC2626] font-bold underline">Guest Preview</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-[1380px] mx-auto w-full px-4 sm:px-8 py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/60">
        <p>© 2026 GST Studio • Verified Commercial Passport & Cloud Billing Ledger • Made for Indian Retailers & Traders</p>
      </footer>
    </div>
  );
};
