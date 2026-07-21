import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems = 0, itemsPerPage = 10 }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#E8DFCF]/60 text-xs text-dark/60 font-medium">
      <div>
        Showing <span className="font-semibold text-dark">{startItem}</span> to{' '}
        <span className="font-semibold text-dark">{endItem}</span> of{' '}
        <span className="font-semibold text-dark">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-[#E8DFCF] bg-white/60 hover:bg-white text-dark disabled:opacity-30 disabled:hover:bg-white/60 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-xl font-semibold transition-all ${
              currentPage === page
                ? 'bg-[#D4AF37] text-white shadow-sm'
                : 'border border-[#E8DFCF] bg-white/60 hover:bg-white text-dark/70'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-[#E8DFCF] bg-white/60 hover:bg-white text-dark disabled:opacity-30 disabled:hover:bg-white/60 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
