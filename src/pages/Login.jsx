import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ArrowRight,
  Lock,
  Mail,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Loader2,
  Crown,
  Scissors,
  User,
} from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';
import { getDb } from '../services/mockStorage.js';

export default function Login() {
  const { login, sendPasswordResetEmail, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active Login Mode: 'admin' (Admin / Owner) or 'staff' (Staff Portal)
  const [activeTab, setActiveTab] = useState('admin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');

  useEffect(() => {
    // Clear on load
    setEmail('');
    setPassword('');
    setError('');
  }, [activeTab]);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError('');

    if (!email) {
      return setError(
        activeTab === 'admin'
          ? 'Please enter your Admin/Owner email address.'
          : 'Please enter your Staff email or phone.'
      );
    }
    if (!password) {
      return setError('Please enter your password.');
    }

    try {
      setFormLoading(true);
      const res = await login(email, password, activeTab);
      if (res.ok) {
        navigate('/');
      } else {
        setError(res.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setFormLoading(false);
    }
  }

  // 1-Click Quick Demo Login handler for GitHub reviewers & portfolio visitors
  async function handleQuickDemo(type) {
    setError('');
    const demoEmail = type === 'admin' ? 'admin@salon.com' : 'staff@salon.com';
    const demoPass = type === 'admin' ? 'admin123' : 'staff123';
    setActiveTab(type);
    setEmail(demoEmail);
    setPassword(demoPass);

    try {
      setFormLoading(true);
      const res = await login(demoEmail, demoPass, type);
      if (res.ok) {
        navigate('/');
      } else {
        setError(res.error || 'Demo login failed.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSendResetLink(e) {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    if (!forgotEmail) {
      return setForgotErrorMsg('Please enter a valid registered email address.');
    }

    try {
      setForgotLoading(true);
      const res = await sendPasswordResetEmail(forgotEmail);
      if (res.ok) {
        setForgotSuccessMsg(res.message || 'Password reset link sent.');
      } else {
        setForgotErrorMsg(res.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setForgotErrorMsg(err.message || 'An error occurred while sending the reset link.');
    } finally {
      setForgotLoading(false);
    }
  }

  const isBusy = authLoading || formLoading;

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient Luxury Golden Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#d4af37]/15 via-[#a37e1f]/8 to-transparent blur-[140px]" />
        <div className="absolute -bottom-40 -right-32 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#d4af37]/12 via-[#a37e1f]/6 to-transparent blur-[160px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#d4af37]/4 blur-[120px]" />
      </div>

      {/* Main Grid Content */}
      <div className="relative z-10 grid min-h-screen lg:grid-cols-12 flex-1">
        {/* ================= LEFT SECTION — Brand Showcase (7 Cols) ================= */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 lg:p-16 border-r border-[#d4af37]/10 bg-[#090909]/40 backdrop-blur-xs">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-[#d4af37]/30 blur-md group-hover:bg-[#d4af37]/50 transition duration-500" />
              <div className="relative h-16 w-16 rounded-2xl bg-[#0d0d0d] p-2 ring-1 ring-[#d4af37]/60 shadow-[0_0_25px_rgba(212,175,55,0.25)] flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="TRIO Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-[0.08em] text-[#f7eedc]">
                TRIO THE POSH
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] mt-0.5">
                LUXURY UNISEX SALON
              </p>
            </div>
          </div>

          {/* Hero Tagline & Address */}
          <div className="space-y-8 max-w-xl my-auto py-12">
            <div className="flex items-center gap-2.5">
              <div className="h-[1.5px] w-8 bg-[#d4af37]" />
              <Sparkles size={13} className="text-[#d4af37]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">
                ENTERPRISE MANAGEMENT COMMAND
              </span>
            </div>

            <h2 className="font-display text-5xl sm:text-6xl font-medium leading-[1.12] tracking-tight text-[#f3e7ce]">
              &ldquo;Redefining Beauty<br />&amp; Elegance&rdquo;
            </h2>

            {/* Location Pill Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#121214]/80 border border-zinc-800/80 backdrop-blur-xl max-w-md shadow-2xl">
              <div className="h-11 w-11 rounded-xl bg-[#211b10] border border-[#d4af37]/35 flex items-center justify-center text-[#d4af37] shrink-0">
                <MapPin size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#f5eedb] tracking-wide">
                  TRIO The Posh Salon
                </p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate font-normal">
                  Piprali Road, Near MBA Chai Wala, Sikar 332001
                </p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-6 border-t border-zinc-800/60">
            <p>&copy; 2026 TRIO THE POSH. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-[#d4af37] font-medium">
              <ShieldCheck size={14} />
              <span>Enterprise Security Enforced</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION — Centered Luxury Login Card (5 Cols) ================= */}
        <div className="relative z-10 lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 min-h-screen">
          {/* Mobile Header Brand Display */}
          <div className="mb-8 flex items-center gap-3.5 lg:hidden">
            <div className="h-12 w-12 rounded-xl bg-[#0d0d0d] p-1.5 ring-1 ring-[#d4af37]/60 shadow-md flex items-center justify-center">
              <img src="/logo.png" alt="TRIO Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white tracking-wide">
                TRIO THE POSH
              </h2>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                Luxury Unisex Salon
              </p>
            </div>
          </div>

          {/* The Luxury Rounded Login Card */}
          <div className="w-full max-w-[440px] rounded-[32px] bg-[#0f0f10]/95 border border-[#382d18] backdrop-blur-2xl p-7 sm:p-9 shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
            {/* Subtle Top Gold Highlight */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />

            {/* Segmented Toggle Control: Admin / Owner vs Staff Portal */}
            <div className="rounded-full bg-[#18181a] p-1 border border-zinc-800 flex items-center mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex-1 py-2.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-[#edd391] via-[#d4af37] to-[#c59f2e] text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Crown size={14} className={activeTab === 'admin' ? 'text-black' : 'text-zinc-400'} />
                <span>Admin / Owner</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className={`flex-1 py-2.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-gradient-to-r from-[#edd391] via-[#d4af37] to-[#c59f2e] text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Scissors size={14} className={activeTab === 'staff' ? 'text-black' : 'text-zinc-400'} />
                <span>Staff Portal</span>
              </button>
            </div>

            {/* Role Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2a2211] border border-[#d4af37]/40 text-[#edd391] text-[10px] font-bold tracking-widest uppercase mb-2">
              {activeTab === 'admin' ? (
                <>
                  <Crown size={12} className="text-[#d4af37]" />
                  <span>EXECUTIVE MANAGEMENT</span>
                </>
              ) : (
                <>
                  <Scissors size={12} className="text-[#d4af37]" />
                  <span>STAFF PORTAL ACCESS</span>
                </>
              )}
            </div>

            {/* Form Title & Subtitle */}
            <h2 className="font-display text-3xl font-bold text-white tracking-tight">
              {activeTab === 'admin' ? 'Admin / Owner Login' : 'Staff Portal Login'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 mb-6 leading-relaxed">
              {activeTab === 'admin'
                ? 'Full command: staff salary, commission, salon expenses, reports, settings & financial analytics.'
                : 'Access work register, attendance, service history, clients & personal commissions.'}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5 animate-shake">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Email / Identifier */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  {activeTab === 'admin' ? 'Admin / Owner Email' : 'Staff Email or Phone'}
                </label>
                <div className="relative group/input">
                  {activeTab === 'admin' ? (
                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-[#d4af37] transition-colors"
                    />
                  ) : (
                    <User
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-[#d4af37] transition-colors"
                    />
                  )}
                  <input
                    type={activeTab === 'admin' ? 'email' : 'text'}
                    required
                    disabled={isBusy}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activeTab === 'admin'
                        ? 'Enter admin email address'
                        : 'Enter staff email or mobile number'
                    }
                    className="w-full pl-11 pr-4 py-3 bg-[#151517] border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/40 transition-all shadow-inner disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Password
                </label>
                <div className="relative group/input">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-[#d4af37] transition-colors"
                  />
                  <input
                    type="password"
                    required
                    disabled={isBusy}
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-4 py-3 bg-[#151517] border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/40 transition-all shadow-inner disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isBusy}
                className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#e7be65] via-[#d4af37] to-[#ba9230] text-black font-bold text-sm tracking-wide shadow-[0_8px_25px_rgba(212,175,55,0.3)] hover:shadow-[0_12px_35px_rgba(212,175,55,0.45)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group/btn"
              >
                {formLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin text-black" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeTab === 'admin'
                        ? 'Login as Admin & Owner'
                        : 'Login to Staff Portal'}
                    </span>
                    <ArrowRight
                      size={17}
                      className="group-hover/btn:translate-x-1 transition-transform duration-200"
                    />
                  </>
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || 'admin@salon.com');
                    setForgotSuccessMsg('');
                    setForgotErrorMsg('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-[#d4af37] hover:text-[#edd391] hover:underline transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </form>

            {/* Quick 1-Click Demo Login Bar (For Evaluators, Recruiters & GitHub Visitors) */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#d4af37]" /> Quick Demo Access (1-Click)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Instant Entry</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleQuickDemo('admin')}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-[#d4af37]/15 border border-[#d4af37]/25 hover:border-[#d4af37] text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-[#d4af37] flex items-center gap-1">
                      👑 Admin Demo
                    </span>
                    <ArrowRight size={12} className="text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-mono">admin@salon.com</p>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleQuickDemo('staff')}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-[#d4af37]/15 border border-[#d4af37]/25 hover:border-[#d4af37] text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-[#d4af37] flex items-center gap-1">
                      ✂️ Staff Demo
                    </span>
                    <ArrowRight size={12} className="text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-mono">staff@salon.com</p>
                </button>
              </div>

              <p className="text-[10px] text-center text-zinc-500 mt-2 font-mono">
                Credentials: <span className="text-zinc-400">admin@salon.com</span> / <span className="text-zinc-400">admin123</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= FORGOT PASSWORD MODAL ======================= */}
      <Modal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} title="Reset Password">
        <form onSubmit={handleSendResetLink} className="space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <KeyRound size={22} className="text-[#D4AF37] shrink-0" />
            <p className="text-xs leading-relaxed font-medium">
              Enter your registered email address below to receive a secure password reset link.
            </p>
          </div>

          {forgotSuccessMsg && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-medium flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{forgotSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  navigate(`/reset-password?email=${encodeURIComponent(forgotEmail)}`);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#D4AF37] text-white font-bold text-xs hover:bg-[#C59F2E] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>🔗 Open Password Reset Page</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {forgotErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-xs text-red-800 font-medium flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{forgotErrorMsg}</span>
            </div>
          )}

          {!forgotSuccessMsg && (
            <div>
              <label className="block font-bold text-dark/70 mb-1">Registered Email Address *</label>
              <input
                type="email"
                required
                disabled={forgotLoading}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="e.g. admin@salon.com"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            {!forgotSuccessMsg && (
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold hover:bg-[#C59F2E] flex items-center gap-1.5 disabled:opacity-50"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
