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
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-full text-sm text-[#0F172A] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 transition-all shadow-xs"
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
              <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]/80">
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={`px-6 py-4 font-mono text-xs font-semibold uppercase tracking-wider text-[#0F172A] ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, r) => (
                  <tr key={r} className="animate-pulse">
                    {columns.map((_, c) => (
                      <td key={c} className="px-6 py-4">
                        <div className="h-4 bg-[#E2E8F0] rounded-full w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-[#64748B]">
                      <Inbox size={36} className="text-[#0052FF]/60" />
                      <p className="font-medium text-base text-[#0F172A]">No records found</p>
                      <p className="text-xs text-[#64748B]">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-[#EFF4FF]/50 transition-colors">
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
