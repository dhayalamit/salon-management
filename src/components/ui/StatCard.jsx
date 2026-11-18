import React from "react";

export default function StatCard({
  label,
  value,
  sublabel,
  accent,
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[28px] border backdrop-blur-3xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl ${
        accent
          ? "border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/20 via-white/10 to-white/5"
          : "border-white/10 bg-white/10"
      } p-6`}
    >
      {/* Glow */}
      <div
        className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-all duration-500 ${
          accent ? "bg-[#D4AF37]/30" : "bg-white/10"
        } group-hover:scale-125`}
      />

      {/* Top Accent */}
      {accent && (
        <div className="absolute left-6 right-6 top-0 h-[3px] rounded-full bg-gradient-to-r from-[#D4AF37] via-[#FFE08A] to-[#D4AF37]" />
      )}

      {/* Label */}
      <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
        {label}
      </p>

      {/* Value */}
      <h2 className="relative mt-4 font-display text-4xl font-semibold text-white">
        {value}
      </h2>

      {/* Subtitle */}
      {sublabel && (
        <p className="relative mt-3 text-sm text-white/50">
          {sublabel}
        </p>
      )}

      {/* Bottom Shine */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}