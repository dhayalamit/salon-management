import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, ArrowRight, CheckCircle, ShieldCheck, KeyRound, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get('email') || 'admin@salon.com';
  const [targetEmail, setTargetEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      return setErrorMsg('New password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg('Passwords do not match. Please verify both fields.');
    }

    try {
      setSubmitting(true);
      const res = await updatePassword(targetEmail, newPassword);

      if (res.ok) {
        setSuccessMsg(res.message || 'Your password has been updated securely! Redirecting to login...');
        showSuccess('Password updated successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 1800);
      } else {
        setErrorMsg(res.error || 'Failed to update password. Please try again.');
        showError(res.error || 'Password reset failed.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-12 bg-[#090909] text-white font-sans overflow-hidden select-none">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#D4AF37]/20 via-[#A37E1F]/10 to-transparent blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-[#D4AF37]/15 via-[#A37E1F]/10 to-transparent blur-[150px]" />
      </div>

      {/* Left Branding Section (Desktop) */}
      <div className="relative z-10 hidden lg:flex lg:col-span-6 flex-col justify-between p-12 lg:p-16 border-r border-[#D4AF37]/15 bg-[#0D0D0D]/70 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <img
            src="/logo.png"
            alt="TRIO Logo"
            className="h-16 w-16 rounded-2xl object-contain bg-black p-2 ring-2 ring-[#D4AF37]/60 shadow-[0_0_30px_rgba(212,175,55,0.25)]"
          />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wider text-white">TRIO THE POSH</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Luxury Unisex Salon</p>
          </div>
        </div>

        <div className="space-y-6 max-w-lg">
          <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] w-fit border border-[#D4AF37]/30">
            <KeyRound size={28} />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F3E5AB] to-[#D4AF37]">
            Set New Password
          </h2>
          <p className="text-sm text-white/60 font-light leading-relaxed">
            Create a new password for your TRIO The Posh Salon account ({targetEmail}). Once saved, you can log in immediately with your updated password.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#D4AF37]/80 font-medium">
          <ShieldCheck size={16} /> Encrypted Local Password Reset Engine
        </div>
      </div>

      {/* Right Reset Password Form Card */}
      <div className="relative z-10 lg:col-span-6 flex items-center justify-center p-6 sm:p-10 min-h-screen">
        <div className="w-full max-w-md rounded-[28px] bg-black/60 border border-[#D4AF37]/35 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

          {/* Header */}
          <div className="space-y-2 mb-8">
            <h2 className="font-display text-3xl font-bold text-white tracking-tight">Set New Password</h2>
            <p className="text-xs text-white/50">Enter and confirm your new account password below.</p>
          </div>

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/70 border border-red-500/40 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Account Email</label>
              <div className="relative group/input">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-[#D4AF37] transition-colors" />
                <input
                  type="email"
                  required
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-sm text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-black/70 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">New Password *</label>
              <div className="relative group/input">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-[#D4AF37] transition-colors" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-black/70 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Confirm New Password *</label>
              <div className="relative group/input">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-[#D4AF37] transition-colors" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:bg-black/70 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-4 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59F2E] text-black font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_10px_30px_rgba(212,175,55,0.35)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{submitting ? 'Updating Password...' : 'Save & Set Password'}</span>
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-[#D4AF37] hover:underline font-semibold cursor-pointer"
            >
              ← Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
