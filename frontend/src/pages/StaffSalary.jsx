import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Calendar,
  AlertCircle,
  Check,
  History,
  FileText,
  RotateCcw,
  Sparkles,
  Wallet,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString, getLocalMonthString } from '../utils/dateUtils.js';

export default function StaffSalary() {
  const { showSuccess, showError } = useToast();

  // Current Month State (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => getLocalMonthString());

  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isClearAdvanceModalOpen, setIsClearAdvanceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [payConfirmModal, setPayConfirmModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [staffHistory, setStaffHistory] = useState([]);

  // Form Fields
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(() => getTodayDateString());
  const [paymentNote, setPaymentNote] = useState('');

  // Clear Advance Form State
  const [clearOption, setClearOption] = useState('adjust_salary'); // 'adjust_salary' | 'mark_cleared'
  const [clearAmount, setClearAmount] = useState('');

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const res = await client.get('/salary', {
        params: { month: selectedMonth },
      });
      setPayrolls(res.data.payrolls || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      showError('Failed to load staff salary records');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, direction === 'next' ? m : m - 2, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  // 1. Submit Advance Payout
  const handleRecordAdvance = async (e) => {
    e.preventDefault();
    if (!selectedRecord || !advanceAmount || Number(advanceAmount) <= 0) {
      return showError('Enter Advance Amount (₹)');
    }

    try {
      const res = await client.post('/salary/advance', {
        payrollId: selectedRecord.id,
        staffId: selectedRecord.staff_id,
        month: selectedMonth,
        amount: Number(advanceAmount),
        paymentMode,
        paymentDate,
        note: paymentNote,
      });

      showSuccess(res.data.message || 'Advance salary payment recorded');
      setIsAdvanceModalOpen(false);
      setAdvanceAmount('');
      setPaymentNote('');
      fetchPayrollData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to record advance payment');
    }
  };

  // 2. Submit Clear / Adjust Advance
  const handleClearAdvance = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      const res = await client.post('/salary/clear-advance', {
        staffId: selectedRecord.staff_id,
        month: selectedMonth,
        option: clearOption,
        clearAmount: clearAmount ? Number(clearAmount) : null,
      });

      showSuccess(res.data.message || 'Advance updated successfully');
      setIsClearAdvanceModalOpen(false);
      fetchPayrollData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to clear advance');
    }
  };

  // 3. Submit Pay Remaining Salary & Complete Month
  const handlePayRemaining = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedRecord) return;

    try {
      const res = await client.post('/salary/pay-remaining', {
        payrollId: selectedRecord.id,
        staffId: selectedRecord.staff_id,
        month: selectedMonth,
        paymentMode,
        paymentDate,
        note: paymentNote,
      });

      showSuccess(res.data.message || 'Remaining salary paid and month completed!');
      setIsPayModalOpen(false);
      setPaymentNote('');
      fetchPayrollData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to record salary payout');
    }
  };

  const openAdvanceModal = (record) => {
    setSelectedRecord(record);
    setAdvanceAmount('');
    setPaymentNote('');
    setIsAdvanceModalOpen(true);
  };

  const openClearAdvanceModal = (record) => {
    setSelectedRecord(record);
    setClearOption('adjust_salary');
    setClearAmount(String(record.advance_paid || 0));
    setIsClearAdvanceModalOpen(true);
  };

  const openPayModal = (record) => {
    setSelectedRecord(record);
    setPaymentNote('');
    setIsPayModalOpen(true);
  };

  const openHistoryModal = async (record) => {
    setSelectedRecord(record);
    try {
      const res = await client.get('/salary/history', {
        params: { staffId: record.staff_id },
      });
      setStaffHistory(res.data || []);
      setIsHistoryModalOpen(true);
    } catch (err) {
      showError('Failed to load employee salary history');
    }
  };

  // Format month title (e.g. July 2026)
  const [y, m] = selectedMonth.split('-').map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const filteredPayrolls = payrolls.filter((p) => {
    const term = search.toLowerCase();
    return (p.staff_name || '').toLowerCase().includes(term) || (p.staff_phone || '').includes(term);
  });

  const columns = [
    {
      header: 'Staff Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#A37E1F] font-display text-sm font-bold text-white shadow-sm">
            {row.staff_name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-semibold text-dark">{row.staff_name}</p>
            <p className="text-xs text-dark/40">{row.staff_phone || 'No phone'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Monthly Salary',
      render: (row) => (
        <span className="font-display text-sm font-bold text-dark">
          ₹{Number(row.monthly_salary).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Advance Paid',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-semibold text-amber-700">
            ₹{Number(row.advance_paid).toLocaleString('en-IN')}
          </span>
          {row.excess_advance > 0 && (
            <div className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
              🟣 Carry Forward: ₹{Number(row.excess_advance).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Salary Paid',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-emerald-700">
          ₹{Number(row.salary_paid).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Remaining Balance',
      render: (row) => {
        const rem = Number(row.remaining_salary);
        const overpaid = Number(row.overpaid_amount || 0);

        return (
          <div>
            {overpaid > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle size={12} /> ⚠️ Overpaid by ₹{overpaid.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className={`font-display text-sm font-bold ${rem === 0 ? 'text-emerald-600' : 'text-[#D4AF37]'}`}>
                ₹{rem.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Payroll Status',
      render: (row) => {
        const rem = Number(row.remaining_salary);
        const adv = Number(row.advance_paid);

        let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
        let badgeText = 'Partially Paid';

        if (rem <= 0 && adv > Number(row.monthly_salary)) {
          badgeClass = 'bg-purple-100 text-purple-800 border-purple-300';
          badgeText = '🟣 Advance Overpaid';
        } else if (rem <= 0) {
          badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          badgeText = '🟢 Paid';
        } else if (adv > 0) {
          badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
          badgeText = '🔵 Advance Pending Adjustment';
        } else {
          badgeClass = 'bg-red-100 text-red-800 border-red-300';
          badgeText = '🔴 Pending';
        }

        return (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
            {badgeText}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => {
        const rem = Number(row.remaining_salary);
        const adv = Number(row.advance_paid);

        return (
          <div className="flex flex-wrap items-center gap-2">
            {/* Advance Salary Button */}
            <button
              onClick={() => openAdvanceModal(row)}
              className="px-3 py-1.5 rounded-full bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-all shadow-xs flex items-center gap-1"
            >
              + Advance
            </button>

            {/* Clear / Adjust Advance Button */}
            {adv > 0 && (
              <button
                onClick={() => openClearAdvanceModal(row)}
                className="px-3 py-1.5 rounded-full bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-all shadow-xs flex items-center gap-1"
                title="Clear or Adjust Advance"
              >
                <RotateCcw size={12} /> Clear Advance
              </button>
            )}

            {/* Pay Salary / Pay Remaining Salary Button */}
            {rem > 0 ? (
              <button
                onClick={() => openPayModal(row)}
                className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all shadow-xs flex items-center gap-1"
              >
                💰 {adv > 0 || Number(row.salary_paid || 0) > 0 ? 'Pay Remaining Salary' : 'Pay Salary'}
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-300">
                <Check size={14} /> Paid
              </span>
            )}

            {/* Employee History Button */}
            <button
              onClick={() => openHistoryModal(row)}
              className="p-1.5 rounded-xl bg-[#F4F0E6] text-dark/70 hover:bg-dark hover:text-white transition-colors"
              title="View Employee History"
            >
              <History size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner with Month Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#D4AF37] text-white">
              Enterprise Payroll
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
            Staff Salary & Payroll System
          </h1>
          <p className="text-xs text-dark/50 mt-1">
            Professional month-wise payroll management, advances, negative balance tracking & carry-forward advances
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-[#E8DFCF] shadow-xs">
          <button
            onClick={() => handleMonthChange('prev')}
            className="p-2 rounded-xl hover:bg-[#F4F0E6] text-dark transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="px-3 text-center min-w-[140px]">
            <p className="text-[10px] font-bold uppercase text-dark/40">Payroll Month</p>
            <p className="font-display font-bold text-sm text-dark">{monthName}</p>
          </div>

          <button
            onClick={() => handleMonthChange('next')}
            className="p-2 rounded-xl hover:bg-[#F4F0E6] text-dark transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 6 Real-time Payroll Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase text-dark/50">Monthly Salary</p>
          <h3 className="font-display text-xl font-bold text-dark mt-1">
            ₹{Number(summary.total_monthly_expense || 0).toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase text-dark/50">Salary Paid</p>
          <h3 className="font-display text-xl font-bold text-emerald-600 mt-1">
            ₹{Number(summary.total_salary_paid || 0).toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase text-dark/50">Outstanding Advance</p>
          <h3 className="font-display text-xl font-bold text-amber-600 mt-1">
            ₹{Number(summary.total_advances_paid || 0).toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase text-dark/50">Remaining Salary</p>
          <h3 className="font-display text-xl font-bold text-[#D4AF37] mt-1">
            ₹{Number(summary.total_remaining_to_pay || 0).toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="glass-card p-4">
          <p className="text-[10px] font-bold uppercase text-dark/50">Overpaid Amount</p>
          <h3 className="font-display text-xl font-bold text-purple-600 mt-1">
            ₹{Number(summary.total_overpaid_amount || 0).toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-dark/50">Settled Staff</p>
            <h3 className="font-display text-xl font-bold text-emerald-600 mt-0.5">
              {summary.paid_employees_count || 0}
            </h3>
          </div>
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredPayrolls}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by staff name or phone..."
      />

      {/* MODAL 1: Advance Salary Payout */}
      <Modal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        title={`Record Advance Salary — ${selectedRecord?.staff_name}`}
      >
        <form onSubmit={handleRecordAdvance} className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1 text-amber-800">
              <AlertCircle size={14} /> Employee Current Status
            </p>
            <p>Monthly Base Salary: ₹{Number(selectedRecord?.monthly_salary || 0).toLocaleString('en-IN')}</p>
            <p>Advance Already Paid: ₹{Number(selectedRecord?.advance_paid || 0).toLocaleString('en-IN')}</p>
            <p>Salary Already Paid: ₹{Number(selectedRecord?.salary_paid || 0).toLocaleString('en-IN')}</p>
            <p>Remaining Balance: ₹{Number(selectedRecord?.remaining_salary || 0).toLocaleString('en-IN')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Enter Advance Amount (₹) *</label>
            <input
              type="number"
              required
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              placeholder="Enter Advance Amount (₹)"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="bank_transfer">Bank Transfer / NEFT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Enter Notes (Optional)</label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Enter Notes"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsAdvanceModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 shadow-sm"
            >
              Confirm Advance Payout
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Clear / Adjust Advance Modal */}
      <Modal
        isOpen={isClearAdvanceModalOpen}
        onClose={() => setIsClearAdvanceModalOpen(false)}
        title={`Advance Adjustment — ${selectedRecord?.staff_name}`}
      >
        <form onSubmit={handleClearAdvance} className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1 text-purple-800">
              <RotateCcw size={14} /> Advance Summary
            </p>
            <p>Total Outstanding Advance: ₹{Number(selectedRecord?.advance_paid || 0).toLocaleString('en-IN')}</p>
            <p>Current Remaining Salary: ₹{Number(selectedRecord?.remaining_salary || 0).toLocaleString('en-IN')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Adjustment Option</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 rounded-2xl border border-[#E8DFCF] cursor-pointer hover:bg-[#F4F0E6]/50">
                <input
                  type="radio"
                  name="clearOption"
                  value="adjust_salary"
                  checked={clearOption === 'adjust_salary'}
                  onChange={(e) => setClearOption(e.target.value)}
                  className="accent-[#D4AF37]"
                />
                <div>
                  <p className="text-xs font-bold text-dark">Option 1: Adjust from Next Salary</p>
                  <p className="text-[10px] text-dark/50">Deducts outstanding advance balance against future salary payouts.</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-2xl border border-[#E8DFCF] cursor-pointer hover:bg-[#F4F0E6]/50">
                <input
                  type="radio"
                  name="clearOption"
                  value="mark_cleared"
                  checked={clearOption === 'mark_cleared'}
                  onChange={(e) => setClearOption(e.target.value)}
                  className="accent-[#D4AF37]"
                />
                <div>
                  <p className="text-xs font-bold text-dark">Option 2: Mark Advance as Cleared</p>
                  <p className="text-[10px] text-dark/50">Use when employee returned money separately (resets advance without affecting salary).</p>
                </div>
              </label>
            </div>
          </div>

          {clearOption === 'adjust_salary' && (
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Amount to Adjust (₹)</label>
              <input
                type="number"
                value={clearAmount}
                onChange={(e) => setClearAmount(e.target.value)}
                placeholder="Enter Amount to Adjust (₹)"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsClearAdvanceModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 shadow-sm"
            >
              Apply Advance Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Pay Remaining Salary */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`${Number(selectedRecord?.advance_paid || 0) > 0 || Number(selectedRecord?.salary_paid || 0) > 0 ? 'Pay Remaining Salary' : 'Pay Salary'} — ${selectedRecord?.staff_name}`}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1 text-emerald-800">
              <CheckCircle size={14} /> Settlement Details
            </p>
            <p>Monthly Salary: ₹{Number(selectedRecord?.monthly_salary || 0).toLocaleString('en-IN')}</p>
            <p>Advance Paid: ₹{Number(selectedRecord?.advance_paid || 0).toLocaleString('en-IN')}</p>
            <p>Salary Paid So Far: ₹{Number(selectedRecord?.salary_paid || 0).toLocaleString('en-IN')}</p>
            <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm font-bold">
              <span>Final Salary Payout:</span>
              <span className="font-display text-lg text-emerald-700">
                ₹{Number(selectedRecord?.remaining_salary || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="bank_transfer">Bank Transfer / NEFT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Enter Notes (Optional)</label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Enter Notes"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPayModalOpen(false);
                setPayConfirmModal(true);
              }}
              className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm"
            >
              Pay Salary & Complete Month
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Month-wise Employee Salary History */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Payroll History — ${selectedRecord?.staff_name}`}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {staffHistory.length === 0 ? (
            <p className="text-xs text-dark/50 text-center py-6">No historical payroll records found</p>
          ) : (
            staffHistory.map((hist) => (
              <div key={hist.id} className="p-4 rounded-2xl bg-[#F4F0E6]/50 border border-[#E8DFCF] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-dark">{hist.year_month}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      hist.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : hist.status === 'Partially Paid'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {hist.status}
                  </span>
                </div>
                <div className="text-xs text-dark/70 flex justify-between pt-1">
                  <span>Salary: ₹{Number(hist.monthly_salary).toLocaleString('en-IN')}</span>
                  <span>Advance: ₹{Number(hist.advance_paid).toLocaleString('en-IN')}</span>
                  <span>Paid: ₹{Number(hist.salary_paid).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Confirm Pay Remaining Modal */}
      <ConfirmModal
        isOpen={payConfirmModal}
        onClose={() => setPayConfirmModal(false)}
        onConfirm={(e) => {
          setPayConfirmModal(false);
          handlePayRemaining(e);
        }}
        title="⚠️ Confirm Pay Remaining Salary"
        message={`Are you sure you want to process salary payout of ₹${selectedRecord?.remaining_salary?.toLocaleString('en-IN')} for ${selectedRecord?.staff_name}?`}
        confirmText="Pay Salary & Complete Month"
        variant="warning"
      />
    </div>
  );
}
