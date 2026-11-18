import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRight, Lock, Mail, MapPin, Sparkles, ShieldCheck, CheckCircle, AlertCircle, KeyRound, Loader2, UserPlus, Crown } from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';
import { getDb } from '../services/mockStorage.js';

export default function Login() {
  const { login, loginWithGoogle, registerOwnerAccount, sendPasswordResetEmail, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Account Picker Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [authorizedAccounts, setAuthorizedAccounts] = useState([]);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isCustomGoogleAccount, setIsCustomGoogleAccount] = useState(false);

  // Initial Salon Owner Setup Modal State (For Client Handover)
  const [showOwnerRegisterModal, setShowOwnerRegisterModal] = useState(false);
  const [ownerRegisterName, setOwnerRegisterName] = useState('');
  const [ownerRegisterEmail, setOwnerRegisterEmail] = useState('');
  const [ownerRegisterPassword, setOwnerRegisterPassword] = useState('');
  const [ownerRegisterLoading, setOwnerRegisterLoading] = useState(false);
  const [ownerRegisterError, setOwnerRegisterError] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  useEffect(() => {
    if (showGoogleModal) {
      try {
        const db = getDb();
        setAuthorizedAccounts(db.authorized_users || []);
      } catch (e) {
        setAuthorizedAccounts([
          { id: 'auth_owner', email: 'admin@salon.com', name: 'TRIO Salon Owner', role: 'owner' },
          { id: 'auth_admin2', email: 'amitdhayal6138@gmail.com', name: 'Amit Dhayal', role: 'admin' },
        ]);
      }
    }
  }, [showGoogleModal]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      return setError('Please enter a valid email address.');
    }
    if (!password) {
      return setError('Please enter your password.');
    }

    try {
      setFormLoading(true);
      const res = await login(email, password);
      if (res.ok) {
        navigate('/');
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setFormLoading(false);
    }
  }

  async function executeGoogleSignIn(accEmail, accName) {
    setError('');
    try {
      setGoogleLoading(true);
      setShowGoogleModal(false);
      const res = await loginWithGoogle(accEmail, accName);
      if (res.ok) {
        navigate('/');
      } else {
        setError(res.error || 'Google authentication was cancelled or failed.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Google Authentication.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleCustomGoogleSubmit(e) {
    e.preventDefault();
    if (!customGoogleEmail || !customGoogleEmail.includes('@')) {
      return setError('Please enter a valid Google email address.');
    }
    await executeGoogleSignIn(customGoogleEmail, customGoogleName);
  }

  async function handleOwnerRegisterSubmit(e) {
    e.preventDefault();
    setOwnerRegisterError('');

    if (!ownerRegisterEmail || !ownerRegisterEmail.includes('@')) {
      return setOwnerRegisterError('Please enter a valid Salon Owner Email Address.');
    }
    if (!ownerRegisterPassword || ownerRegisterPassword.length < 4) {
      return setOwnerRegisterError('Password must be at least 4 characters long.');
    }

    try {
      setOwnerRegisterLoading(true);
      const res = await registerOwnerAccount(ownerRegisterName, ownerRegisterEmail, ownerRegisterPassword);
      if (res.ok) {
        setShowOwnerRegisterModal(false);
        navigate('/');
      } else {
        setOwnerRegisterError(res.error || 'Failed to register Salon Owner.');
      }
    } catch (err) {
      setOwnerRegisterError(err.message || 'An error occurred during registration.');
    } finally {
      setOwnerRegisterLoading(false);
    }
  }

  async function handleSendResetLink(e) {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    if (!forgotEmail || !forgotEmail.includes('@')) {
      return setForgotErrorMsg('Please enter a valid registered email address.');
    }

    try {
      setForgotLoading(true);
      const res = await sendPasswordResetEmail(forgotEmail);
      if (res.ok) {
        setForgotSuccessMsg(res.message || 'Password reset link sent. Please check your email.');
      } else {
        setForgotErrorMsg(res.error || 'Failed to send reset link. Please check your email address.');
      }
    } catch (err) {
      setForgotErrorMsg(err.message || 'An error occurred while sending the reset link.');
    } finally {
      setForgotLoading(false);
    }
  }

  const isBusy = authLoading || formLoading || googleLoading;

  return (
    <div className="grid min-h-screen lg:grid-cols-12 bg-[#090909] text-white font-sans overflow-hidden select-none">
      {/* Ambient Floating Luxury Golden Orbs Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#D4AF37]/20 via-[#A37E1F]/10 to-transparent blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-[#D4AF37]/15 via-[#A37E1F]/10 to-transparent blur-[150px]" />
        <div className="absolute top-1/2 left-1/3 w-[350px] h-[350px] rounded-full bg-[#D4AF37]/5 blur-[110px]" />
      </div>

      {/* LEFT SECTION — Luxury Brand Showcase (col-span-7) */}
      <div className="relative z-10 hidden lg:flex lg:col-span-7 flex-col justify-between p-12 lg:p-16 border-r border-[#D4AF37]/15 bg-[#0D0D0D]/70 backdrop-blur-md">
        {/* Brand Header & Logo */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] rounded-2xl blur-sm opacity-50 group-hover:opacity-80 transition duration-500" />
            <img
              src="/logo.png"
              alt="TRIO Logo"
              className="relative h-16 w-16 rounded-2xl object-contain bg-black p-2 ring-2 ring-[#D4AF37]/60 shadow-[0_0_30px_rgba(212,175,55,0.25)]"
            />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wider text-white">
              TRIO THE POSH
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
              Luxury Unisex Salon
            </p>
          </div>
        </div>

        {/* Brand Hero & Tagline */}
        <div className="space-y-8 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-12 bg-gradient-to-r from-[#D4AF37] to-transparent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]/80 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#D4AF37]" /> Enterprise Management Command
            </span>
          </div>

          <h2 className="font-display text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF] via-[#F3E5AB] to-[#D4AF37]">
            "Redefining Beauty & Elegance"
          </h2>

          {/* Address Badge */}
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.04] border border-[#D4AF37]/25 backdrop-blur-xl shadow-2xl transition-all hover:border-[#D4AF37]/40">
            <div className="p-3 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] shrink-0 border border-[#D4AF37]/30">
              <MapPin size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-white font-display">TRIO The Posh Salon</p>
              <p className="text-xs text-white/60 mt-0.5 font-light leading-relaxed">
                Piprali Road, Near MBA Chai Wala, Sikar 332001
              </p>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="flex items-center justify-between text-xs text-white/40 pt-6 border-t border-white/10">
          <p>© {new Date().getFullYear()} TRIO THE POSH. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-[#D4AF37]/80 font-medium">
            <ShieldCheck size={14} /> Enterprise Security Enforced
          </div>
        </div>
      </div>

      {/* RIGHT SECTION — Perfectly Centered Luxury Glass Login Card (col-span-5) */}
      <div className="relative z-10 lg:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12 min-h-screen">
        {/* Floating Glassmorphism Login Card */}
        <div className="w-full max-w-md rounded-[28px] bg-black/60 border border-[#D4AF37]/35 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden group">
          {/* Subtle Golden Glow Line Top Border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

          {/* Mobile Header Brand Display */}
          <div className="mb-8 flex items-center gap-3.5 lg:hidden">
            <img
              src="/logo.png"
              alt="TRIO Logo"
              className="h-12 w-12 rounded-xl object-contain bg-black p-1.5 ring-1 ring-[#D4AF37]/50 shadow-md"
            />
            <div>
              <h2 className="font-display text-xl font-bold text-white">TRIO THE POSH</h2>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                Luxury Unisex Salon
              </p>
            </div>
          </div>

          {/* Card Header */}
          <div className="space-y-1">
            <h2 className="font-display text-3xl font-bold text-white tracking-tight">
              Login
            </h2>
            <p className="text-xs text-white/50">
              Sign in to access your salon management portal.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. GOOGLE AUTHENTICATION BUTTON */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => {
                setIsCustomGoogleAccount(false);
                setShowGoogleModal(true);
              }}
              disabled={isBusy}
              className="w-full py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-[#D4AF37]/50 disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin text-[#D4AF37]" />
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* DIVIDER: ---------------- OR ---------------- */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/15" />
            </div>
            <div className="relative bg-[#090909] px-4 text-[11px] uppercase font-bold tracking-widest text-white/40">
              OR
            </div>
          </div>

          {/* 2. EMAIL + PASSWORD LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Email</label>
              <div className="relative group/input">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-[#D4AF37] transition-colors" />
                <input
                  type="email"
                  required
                  disabled={isBusy}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-black/70 focus:outline-none transition-all shadow-inner disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Password</label>
              <div className="relative group/input">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-[#D4AF37] transition-colors" />
                <input
                  type="password"
                  required
                  disabled={isBusy}
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-black/70 focus:outline-none transition-all shadow-inner disabled:opacity-50"
                />
              </div>
            </div>

            {/* 3. LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isBusy}
              className="w-full mt-2 py-4 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59F2E] text-black font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2 group/btn cursor-pointer disabled:opacity-50"
            >
              {formLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-black" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                </>
              )}
            </button>

            {/* 4. FORGOT PASSWORD LINK */}
            <div className="pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email || 'admin@salon.com');
                  setForgotSuccessMsg('');
                  setForgotErrorMsg('');
                  setShowForgotModal(true);
                }}
                className="text-[#D4AF37] hover:text-[#F3E5AB] hover:underline font-medium transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ======================= GOOGLE ACCOUNT PICKER MODAL ======================= */}
      <Modal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} title="Sign in with Google">
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E8DFCF] shadow-xs">
            <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
            </svg>
            <div>
              <h4 className="font-bold text-dark text-sm">Choose a Google Account</h4>
              <p className="text-[11px] text-dark/50">to continue to TRIO The Posh Salon</p>
            </div>
          </div>

          {!isCustomGoogleAccount ? (
            <div className="space-y-2">
              {authorizedAccounts.map((acc) => {
                const isOwnerRole = acc.role === 'owner' || acc.email.toLowerCase() === 'admin@salon.com';
                const roleBadgeText = isOwnerRole ? 'Owner' : 'Admin';
                const roleBadgeStyle = isOwnerRole
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                  : 'bg-blue-100 text-blue-800 border-blue-300 font-bold';

                return (
                  <button
                    key={acc.id || acc.email}
                    type="button"
                    onClick={() => executeGoogleSignIn(acc.email, acc.name)}
                    className="w-full p-3 rounded-2xl bg-[#F4F0E6] hover:bg-white border border-[#E8DFCF] text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-full font-bold flex items-center justify-center text-sm text-white shadow-xs ${
                          isOwnerRole ? 'bg-[#D4AF37]' : 'bg-blue-600'
                        }`}
                      >
                        {acc.name ? acc.name.charAt(0).toUpperCase() : 'G'}
                      </div>
                      <div>
                        <p className="font-bold text-dark text-xs group-hover:text-[#D4AF37] transition-colors">{acc.name}</p>
                        <p className="text-[11px] text-dark/50">{acc.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${roleBadgeStyle}`}>
                      {roleBadgeText}
                    </span>
                  </button>
                );
              })}

              {/* Account: Enter another Google Email */}
              <button
                type="button"
                onClick={() => setIsCustomGoogleAccount(true)}
                className="w-full p-3 rounded-2xl bg-white hover:bg-[#F4F0E6] border border-[#E8DFCF] text-left transition-all flex items-center gap-3 text-dark font-semibold text-xs cursor-pointer"
              >
                <div className="h-9 w-9 rounded-full bg-slate-100 text-dark/60 font-bold flex items-center justify-center border border-slate-300">
                  <UserPlus size={16} />
                </div>
                <span>Use another Google Account...</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block font-bold text-dark/70 mb-1">Google Email Address *</label>
                <input
                  type="email"
                  required
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Display Name (Optional)</label>
                <input
                  type="text"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#E8DFCF]">
                <button
                  type="button"
                  onClick={() => setIsCustomGoogleAccount(false)}
                  className="text-xs text-dark/60 hover:text-dark font-medium underline"
                >
                  ← Back to account list
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold hover:bg-[#C59F2E] flex items-center gap-1.5"
                >
                  <span>Sign In with Google</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ======================= REGISTER MASTER SALON OWNER MODAL (CLIENT HANDOVER) ======================= */}
      <Modal isOpen={showOwnerRegisterModal} onClose={() => setShowOwnerRegisterModal(false)} title="Register Master Salon Owner Account">
        <form onSubmit={handleOwnerRegisterSubmit} className="space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <Crown size={22} className="text-[#D4AF37] shrink-0" />
            <p className="text-xs leading-relaxed font-medium">
              Register the official Salon Owner Account. This email address will receive Master Owner privileges to control access for staff members in Settings.
            </p>
          </div>

          {ownerRegisterError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-xs text-red-800 font-medium flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{ownerRegisterError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-dark/70 mb-1">Salon Owner Full Name *</label>
            <input
              type="text"
              required
              disabled={ownerRegisterLoading}
              value={ownerRegisterName}
              onChange={(e) => setOwnerRegisterName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-bold text-dark/70 mb-1">Owner Official Email Address *</label>
            <input
              type="email"
              required
              disabled={ownerRegisterLoading}
              value={ownerRegisterEmail}
              onChange={(e) => setOwnerRegisterEmail(e.target.value)}
              placeholder="e.g. owner@triotheposh.com"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-bold text-dark/70 mb-1">Set Account Password *</label>
            <input
              type="password"
              required
              disabled={ownerRegisterLoading}
              value={ownerRegisterPassword}
              onChange={(e) => setOwnerRegisterPassword(e.target.value)}
              placeholder="At least 4 characters..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setShowOwnerRegisterModal(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={ownerRegisterLoading}
              className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold hover:bg-[#C59F2E] flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {ownerRegisterLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register & Grant Owner Access</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

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
