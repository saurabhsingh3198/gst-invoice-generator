import React, { useState } from 'react';
import {
  Store,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  Lock,
  Building2,
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
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Signup fields
  const [shopName, setShopName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateName, setStateName] = useState('Uttar Pradesh');
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
      setError('Both mobile number and shop name are required');
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background ambient accents in classic executive tones */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-3.5 sm:px-6 py-3.5 sm:py-5 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-white">
                GST Invoice Studio
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60">
                Cloud
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              India's Modern GST Billing, Stock & Multi-Tenant Shop Portal
            </p>
          </div>
        </div>

        {/* Quick Guest Access Button */}
        <button
          type="button"
          onClick={onContinueAsGuest}
          className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition flex items-center gap-1 sm:gap-1.5 cursor-pointer backdrop-blur-md shadow-2xs shrink-0"
        >
          <span>Demo Mode</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
        </button>
      </header>

      {/* Main Content Hero + Auth Card */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-10 flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 lg:gap-14">
        {/* Mobile Hero Brief */}
        <div className="w-full lg:hidden text-center pt-1 pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-800/50 text-blue-400 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Multi-Shop Cloud Portal</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Smart Cloud <span className="text-blue-400">GST Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Login with your mobile number or email to open your shop workspace.
          </p>
        </div>

        {/* Auth Card: Placed FIRST on mobile for instant access */}
        <div className="w-full max-w-md lg:max-w-none lg:w-[460px] order-1 lg:order-2 shrink-0">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-7 lg:p-8 shadow-2xl relative">
            {/* Tab Switcher: Login vs Register */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 mb-5 sm:mb-6 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📱 Mobile / OTP Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏬 Register Shop
              </button>
            </div>

            {/* Error / Success Alerts */}
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

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Shop Owner Mobile Number or Email
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
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 transition outline-none shadow-2xs"
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        A 6-digit verification code will be sent to your mobile or email.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Enter 6-Digit OTP Code
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode('');
                          }}
                          className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
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
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-slate-900 text-lg font-mono tracking-widest text-center transition outline-none shadow-2xs"
                          autoFocus
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Didn't receive OTP?</span>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                        >
                          Resend Code
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Open My Shop</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* SIGNUP FORM */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shop / Business Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Store className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Bhanu Traders"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-slate-900 text-xs outline-none shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-slate-900 text-xs outline-none shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="09FELPS8884L1ZE"
                      className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-slate-900 text-xs uppercase outline-none shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State Name
                    </label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-slate-900 text-xs outline-none shadow-2xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      <span>Register Shop & Start Free</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Guest Option Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span>Want to test invoice generation first?</span>
                <span className="text-blue-600 font-semibold underline">Guest Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Value Proposition & Highlights (Order 2 on mobile, Order 1 on desktop) */}
        <div className="w-full lg:w-1/2 order-2 lg:order-1 flex flex-col items-start space-y-4 sm:space-y-6 pt-4 lg:pt-0">
          <div className="hidden lg:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>Multi-Shop Secure Cloud Billing Portal</span>
          </div>

          <h2 className="hidden lg:block text-3xl sm:text-5xl lg:text-[44px] font-black tracking-tight leading-[1.15] text-white">
            Smart Cloud <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              GST Billing Studio
            </span>{' '}
            & Inventory Manager
          </h2>

          <p className="hidden lg:block text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            A multi-tenant cloud billing platform for modern businesses. Securely manage GST tax invoices, customer directories, inventory, and daily sales reports with complete data privacy and isolation.
          </p>

          <div className="w-full pt-1">
            <div className="lg:hidden text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">
              Platform Features & Cloud Security
            </div>
            {/* Key Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-xl">
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3 hover:border-slate-700 transition">
                <div className="p-2 rounded-lg bg-blue-600/15 text-blue-400 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">100% Multi-Shop Isolation</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Each shop retains an independent, encrypted workspace.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3 hover:border-slate-700 transition">
                <div className="p-2 rounded-lg bg-blue-600/15 text-blue-400 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Daily Sales & Stock Report</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Date-wise items, quantity, tax split, and turnover analytics.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3 hover:border-slate-700 transition">
                <div className="p-2 rounded-lg bg-blue-600/15 text-blue-400 shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Tally A4 Vector Invoices</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Standard Indian GST format, QR code, and dynamic words.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3 hover:border-slate-700 transition">
                <div className="p-2 rounded-lg bg-blue-600/15 text-blue-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Mobile & Email OTP Login</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Passwordless authentication via verified Mobile / Email OTP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <p>© 2026 GST Invoice Studio • Multi-Shop Cloud Billing Architecture • Made for Indian Retailers & Traders</p>
      </footer>
    </div>
  );
};
