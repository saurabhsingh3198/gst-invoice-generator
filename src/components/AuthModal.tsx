import React, { useState } from 'react';
import {
  X,
  Phone,
  Store,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { authApi } from '../services/api';
import type { UserSession } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-50 p-4 sm:p-5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                {mode === 'login' ? 'Shop Owner Login' : 'Register New Shop'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'login' ? 'Login via Mobile OTP to access your billing' : 'Create dedicated shop account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mobile / OTP Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register New Shop
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number or Email
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. 9876543210 or shop@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-white text-slate-900 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium outline-none placeholder:text-slate-400 shadow-2xs"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    We will send a 6-digit verification code to this number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Enter 6-digit OTP</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="● ● ● ● ● ●"
                    className="w-full px-3 py-2 text-center tracking-widest text-lg font-mono font-bold bg-white text-slate-900 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-2xs"
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                    <span>Sent to: <strong className="text-slate-700">{identifier}</strong></span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-blue-600 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Login'}
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop / Business Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Bhanu Traders"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium outline-none placeholder:text-slate-400 shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium outline-none placeholder:text-slate-400 shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN (GST Number)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 09FELPS8884L1ZE"
                    className="w-full pl-9 pr-3 py-2 text-sm uppercase font-mono bg-white text-slate-900 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium outline-none placeholder:text-slate-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State Name</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State Code</label>
                  <input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white text-slate-900 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Register Shop & Start'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
