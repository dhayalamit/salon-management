import React from 'react';
import { Search, SlidersHorizontal, Inbox } from 'lucide-react';
import Pagination from './Pagination';

export default function Table({
  columns,
  data = [],
  loading = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  actionButton,
  filterComponent,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
}) {
  return (
    <div className="space-y-4">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-[#E8DFCF] rounded-full text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          {filterComponent}
          {actionButton}
        </div>
      </div>

      {/* Glass Table Shell */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFCF] bg-[#F4F0E6]/50">
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark/60 ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFCF]/60 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, r) => (
                  <tr key={r} className="animate-pulse">
                    {columns.map((_, c) => (
                      <td key={c} className="px-6 py-4">
                        <div className="h-4 bg-[#E8DFCF]/50 rounded-full w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-dark/40">
                      <Inbox size={36} className="text-[#D4AF37]/60" />
                      <p className="font-medium text-base text-dark/60">No records found</p>
                      <p className="text-xs text-dark/40">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-white/60 transition-colors">
                    {columns.map((col, cIndex) => (
                      <td key={cIndex} className={`px-6 py-4 ${col.className || ''}`}>
                        {col.render ? col.render(row, index) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 pb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </div>
  );
}
