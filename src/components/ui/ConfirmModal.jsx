import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Info, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'success' | 'info'
  loading = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 size={24} className="text-red-500" />,
    warning: <AlertTriangle size={24} className="text-amber-500" />,
    success: <CheckCircle2 size={24} className="text-emerald-500" />,
    info: <Info size={24} className="text-blue-500" />,
  };

  const bgMap = {
    danger: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    success: 'bg-emerald-50 border-emerald-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const btnMap = {
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md p-6 glass-modal shadow-luxury space-y-5 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-dark/40 hover:text-dark hover:bg-black/5 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border ${bgMap[variant]} shrink-0`}>
            {iconMap[variant]}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-dark">{title}</h3>
            <p className="text-xs text-dark/60 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E8DFCF]">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-full font-semibold text-xs transition-colors flex items-center gap-2 ${btnMap[variant]}`}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
