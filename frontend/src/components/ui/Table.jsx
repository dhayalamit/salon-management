import React from 'react';
import { Search, Inbox } from 'lucide-react';
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
          <Search size={16} className="absolute left-1 top-1/2 -translate-y-1/2 text-[#6C6863]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-7 pr-4 py-2 bg-transparent border-b border-[#1A1A1A] text-xs text-[#1A1A1A] placeholder:italic placeholder:font-display placeholder:text-[#6C6863] focus:outline-none focus:border-[#D4AF37] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {filterComponent}
          {actionButton}
        </div>
      </div>

      {/* Glass Table Shell */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1A1A1A] bg-[#EBE5DE]">
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={`px-6 py-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/10 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, r) => (
                  <tr key={r} className="animate-pulse">
                    {columns.map((_, c) => (
                      <td key={c} className="px-6 py-4">
                        <div className="h-4 bg-[#EBE5DE] rounded-none w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-[#6C6863]">
                      <Inbox size={36} className="text-[#D4AF37]" />
                      <p className="font-display font-medium text-lg text-[#1A1A1A]">No records found</p>
                      <p className="text-xs text-[#6C6863]">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-[#EBE5DE]/40 transition-colors">
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
        <div className="px-6 pb-4 pt-2">
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
