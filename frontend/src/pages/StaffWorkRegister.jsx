import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  UserCheck,
  Calendar,
  DollarSign,
  Filter,
  CheckCircle,
  FileText,
  User,
  Clock,
  Sparkles,
  TrendingUp,
  Scissors,
  Eye,
  Award,
  CalendarCheck,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString } from '../utils/dateUtils.js';

export default function StaffWorkRegister() {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [entries, setEntries] = useState([]);
  const [totalWorkAmount, setTotalWorkAmount] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [completedServicesCount, setCompletedServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterStaffId, setFilterStaffId] = useState('');
  const [filterDate, setFilterDate] = useState(() => getTodayDateString());
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filterStaffId, filterDate, filterMonth]);

  const fetchStaff = async () => {
    try {
      const res = await client.get('/staff');
      setStaffList(res.data || []);
    } catch (err) {
      showError('Failed to load staff list');
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStaffId) params.staffId = filterStaffId;
      if (filterDate) params.date = filterDate;
      if (filterMonth) params.month = filterMonth;

      const res = await client.get('/staff-work', { params });
      setEntries(res.data.entries || []);
      setTotalWorkAmount(res.data.totalWorkAmount || 0);
      setTotalCommission(res.data.totalCommission || 0);
      setCompletedServicesCount(res.data.completedServicesCount || 0);
    } catch (err) {
      showError('Failed to load staff work register');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterStaffId('');
    setFilterDate('');
    setFilterMonth('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <FileText size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-emerald-700 text-white">
                Automated System Log
              </span>
              <span className="text-xs text-dark/40 font-medium">Single Source of Truth</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              Staff Work Register
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Automatically recorded work entries from Customer Visits. Staff work count, revenue, and commissions update instantly.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/visits')}
          className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2 self-end sm:self-auto"
        >
          <CalendarCheck size={16} /> Create Customer Visit
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Services Performed
            </span>
            <h3 className="font-display text-2xl font-bold text-dark">{completedServicesCount}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
            <Scissors size={22} />
          </div>
        </div>

        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Total Work Value
            </span>
            <h3 className="font-display text-2xl font-bold text-emerald-800">
              ₹{totalWorkAmount.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Total Commission
            </span>
            <h3 className="font-display text-2xl font-bold text-[#D4AF37]">
              ₹{totalCommission.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-[#D4AF37] border border-amber-100">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card p-4 border border-[#E8DFCF] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#D4AF37]" />
          <span className="font-bold text-dark uppercase tracking-wider text-[11px]">Filter Work Register</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Staff Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-dark/50 font-medium">Stylist:</span>
            <select
              value={filterStaffId}
              onChange={(e) => setFilterStaffId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="">All Team Members</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-dark/50 font-medium">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setFilterMonth('');
              }}
              className="px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-dark/50 font-medium">Month:</span>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setFilterDate('');
              }}
              className="px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {(filterStaffId || filterDate || filterMonth) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-dark/70 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Staff Work Register Table */}
      <div className="glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-4 mb-4">
          <h3 className="font-display text-base font-bold text-dark flex items-center gap-2">
            <Scissors size={18} className="text-[#D4AF37]" /> Registered Services History
          </h3>
          <span className="text-xs text-dark/50">
            Showing <strong className="text-dark">{entries.length}</strong> work entries
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-dark/40 italic">
            Loading automatic staff work register...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs text-dark/50 font-medium">No completed staff work entries found for the selected filter.</p>
            <p className="text-[11px] text-dark/40">Work entries are created automatically when Customer Visits are saved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8DFCF] text-dark/50 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-3">Visit # & Time</th>
                  <th className="pb-3 px-3">Stylist / Staff</th>
                  <th className="pb-3 px-3">Client Name</th>
                  <th className="pb-3 px-3">Service Performed</th>
                  <th className="pb-3 px-3 text-right">Price (₹)</th>
                  <th className="pb-3 px-3 text-right">Commission (₹)</th>
                  <th className="pb-3 px-3">Payment Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFCF]/60">
                {entries.map((entry) => {
                  const createdDate = new Date(entry.created_at || entry.date);
                  const timeFormatted = createdDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const dateFormatted = createdDate.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={entry.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-dark block">
                          {entry.visit_number || 'VIS-AUTO'}
                        </span>
                        <span className="text-[10px] text-dark/40 flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> {dateFormatted} at {timeFormatted}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-dark">{entry.staff_name || 'Staff Member'}</span>
                        <span className="text-[10px] text-dark/40 block">{entry.staff_phone || ''}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-dark">{entry.customer_name || 'Walk-in Client'}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-dark">{entry.service_name || entry.description || 'Hair & Beauty Service'}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-dark text-sm">
                        ₹{Number(entry.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-[#D4AF37]">
                        ₹{Number(entry.commission_amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            (entry.display_payment_status || entry.payment_status || 'Paid') === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : (entry.display_payment_status || entry.payment_status) === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {entry.display_payment_status || entry.payment_status || 'Paid'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {entry.visit_id && (
                          <button
                            onClick={() => navigate(`/visits/${entry.visit_id}`)}
                            className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-[#D4AF37] hover:text-white text-dark/70 transition-all font-semibold text-[11px] inline-flex items-center gap-1"
                            title="View Linked Visit"
                          >
                            <Eye size={12} /> Visit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
