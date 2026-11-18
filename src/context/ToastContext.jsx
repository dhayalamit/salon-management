import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast, showSuccess: (m) => addToast(m, 'success'), showError: (m) => addToast(m, 'error') }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-[20px] border shadow-luxury backdrop-blur-xl transition-all duration-300 transform translate-y-0 ${
              toast.type === 'error'
                ? 'bg-red-500/90 text-white border-red-400/30'
                : toast.type === 'info'
                ? 'bg-dark/90 text-white border-white/20'
                : 'bg-[#1A1A1A] text-white border-[#D4AF37]/40'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={20} className="text-red-300 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info size={20} className="text-blue-300 shrink-0" />
            ) : (
              <CheckCircle2 size={20} className="text-[#D4AF37] shrink-0" />
            )}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      showSuccess: (msg) => console.log('Toast:', msg),
      showError: (msg) => console.error('Error Toast:', msg),
    };
  }
  return context;
}
