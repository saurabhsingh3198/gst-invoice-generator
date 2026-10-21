import React, { useState } from 'react';
import {
  X,
  Phone,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  ChevronDown,
  Lock,
  Key,
} from 'lucide-react';
import { authApi } from '../services/api';
import type { UserSession } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Signup fields
  const [shopName, setShopName] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [stateCode, setStateCode] = useState('09');

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter a valid mobile number or email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.sendOtp(identifier.trim());
      setOtpSent(true);
      setSuccessMsg(res.message || 'OTP sent successfully to your email/phone.');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const session = await authApi.verifyOtp(identifier.trim(), otpCode.trim());
      onLoginSuccess(session);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !shopName.trim()) {
      setError('Mobile number and Shop Name are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const session = await authApi.signup({
        phone: identifier.trim(),
        shopName: shopName.trim(),
        gstin: gstin.trim(),
        stateName,
        stateCode,
      });
      onLoginSuccess(session);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto font-sans">
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header with EXPRESS ACCESS & EARLY ACCESS badge */}
        <div className="p-5 sm:p-6 pb-3 flex items-start justify-between border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                EXPRESS{' '}
                <span className="text-[#DC2626] relative inline-block underline decoration-[#DC2626] decoration-[2.5px] underline-offset-4">
                  ACCESS
                </span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#DC2626] text-[9px] font-black tracking-wider uppercase">
                EARLY ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Submit business details to activate your official cloud workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-950 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🏬 Create Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-950 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📱 Mobile / OTP Login
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number or Email <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. 9876543210 or shop@gmail.com"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 font-medium outline-none placeholder:text-slate-400 shadow-2xs"
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    We will send a 6-digit verification code to this device.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Sending OTP...' : 'SEND VERIFICATION OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Enter 6-digit OTP <span className="text-[#DC2626]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-[#DC2626] font-bold hover:underline cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="● ● ● ● ● ●"
                      className="w-full pl-10 pr-4 py-2.5 text-center tracking-widest text-lg font-mono font-black bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 outline-none shadow-2xs"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                    <span>Sent to: <strong className="text-slate-700">{identifier}</strong></span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-[#DC2626] font-bold hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'VERIFY & LAUNCH STUDIO'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSignup} className="space-y-3.5">
              {/* Company Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#DC2626] mb-1 uppercase tracking-wider">
                  COMPANY NAME <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-[#DC2626]" />
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Acme Forgings Ltd."
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-white text-slate-900 border border-[#DC2626] rounded-xl focus:border-[#b91c1c] focus:ring-2 focus:ring-red-500/10 font-bold outline-none placeholder:text-slate-400 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Mobile with +91 Country Flag Pill */}
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
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none"
                    required
                  />
                </div>
              </div>

              {/* GSTIN / Core Objectives */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  GSTIN (GST Number)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 09FELPS6664L1ZE"
                    className="w-full pl-10 pr-3 py-2.5 text-xs uppercase font-mono font-bold bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 outline-none placeholder:normal-case placeholder:font-sans shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State Name</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] outline-none shadow-2xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State Code</label>
                  <input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold bg-white text-slate-900 border border-slate-200 rounded-xl focus:border-[#DC2626] outline-none shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-500/25 transition active:scale-95 disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'REQUEST PROFILE CREATION'}
              </button>
            </form>
          )}

          {/* Trust Badges */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
            <div className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Enterprise Verified Identity</span>
            </div>
            <span>•</span>
            <span>Priority Fast-Track Activation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
