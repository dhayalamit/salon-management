import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRight, Lock, Mail, MapPin, Sparkles, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear credentials fields on mount for security & clean input
    setEmail('');
    setPassword('');
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.ok) navigate('/');
    else setError(res.error);
  }

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
              <Sparkles size={14} className="text-[#D4AF37]" /> Exclusive Management Portal
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
              Welcome back
            </h2>
            <p className="text-xs text-white/50">
              Sign in to access your salon command portal.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Email Address</label>
              <div className="relative group/input">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-[#D4AF37] transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-black/70 focus:outline-none transition-all shadow-inner"
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
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-black/70 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/30 text-xs text-red-300 animate-shake">
                {error}
              </div>
            )}

            {/* Luxury CTA Gold Gradient Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59F2E] text-black font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2 group/btn cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Continue'}</span>
              {!loading && (
                <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform duration-300" />
              )}
            </button>
          </form>

          {/* Mobile Footer Address Badge */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2.5 text-[11px] text-white/50 lg:hidden">
            <MapPin size={14} className="text-[#D4AF37] shrink-0" />
            <span>Piprali Road, Near MBA Chai Wala, Sikar 332001</span>
          </div>

          {/* Default Credentials Hint */}
          <p className="mt-6 text-center text-[11px] text-white/40 font-light">
            Default credentials: <span className="font-medium text-white/70">admin@salon.com / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
