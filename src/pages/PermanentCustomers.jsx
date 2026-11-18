import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  UserCheck,
  Plus,
  Search,
  Wallet,
  Phone,
  Calendar,
  Sparkles,
  ArrowUpRight,
  DollarSign,
  UserPlus,
  CheckCircle,
  Eye,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function PermanentCustomers() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    gender: 'female',
    birthday: '',
    initialDeposit: '',
    notes: '',
  });
  const [submittingReg, setSubmittingReg] = useState(false);

  // Add Advance Deposit Modal State
  const [depositTarget, setDepositTarget] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('cash');
  const [depositNotes, setDepositNotes] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  useEffect(() => {
    fetchPermanentCustomers();
  }, []);

  const fetchPermanentCustomers = async () => {
    try {
      setLoading(true);
      const res = await client.get('/permanent-customers');
      setCustomers(res.data || []);
    } catch (err) {
      showError('Failed to load permanent customer database');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regData.name || !regData.name.trim()) {
      return showError('Customer full name is required');
    }

    try {
      setSubmittingReg(true);
      const res = await client.post('/permanent-customers', regData);
      showSuccess(`Permanent Customer "${res.data.name}" registered successfully!`);
      setIsRegisterOpen(false);
      setRegData({
        name: '',
        phone: '',
        alternatePhone: '',
        gender: 'female',
        birthday: '',
        initialDeposit: '',
        notes: '',
      });
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchPermanentCustomers();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to register permanent customer');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleAddAdvanceDeposit = async (e) => {
    e.preventDefault();
    if (!depositTarget || !depositAmount || Number(depositAmount) <= 0) {
      return showError('Please enter a valid advance deposit amount');
    }

    try {
      setSubmittingDeposit(true);
      await client.post(`/permanent-customers/${depositTarget.id}/advance`, {
        amount: Number(depositAmount),
        paymentMethod: depositMethod,
        notes: depositNotes,
      });
      showSuccess(`₹${Number(depositAmount).toLocaleString('en-IN')} advance added to ${depositTarget.name}'s wallet`);
      setDepositTarget(null);
      setDepositAmount('');
      setDepositNotes('');
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchPermanentCustomers();
    } catch (err) {
      showError('Failed to add advance deposit');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.alternate_phone && c.alternate_phone.includes(search))
  );

  const totalAdvancePool = customers.reduce((sum, c) => sum + Number(c.advance_balance || 0), 0);
  const totalAdvanceDeposited = customers.reduce((sum, c) => sum + Number(c.total_advance_deposited || 0), 0);
  const totalAdvanceUsed = customers.reduce((sum, c) => sum + Number(c.total_advance_used || 0), 0);

  const itemsPerPage = 8;
  const paginatedData = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Customer Name',
      render: (row) => (
        <div
          onClick={() => navigate(`/permanent-customers/${row.id}`)}
          className="cursor-pointer group flex items-center gap-2.5"
        >
          <div className="p-2 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-all">
            <UserCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-dark text-sm group-hover:text-[#D4AF37] transition-colors">
                {row.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-100 text-amber-800">
                Permanent
              </span>
            </div>
            <span className="text-[11px] text-dark/40 block mt-0.5 capitalize">Gender: {row.gender || 'Not specified'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Mobile Number',
      render: (row) => (
        <div>
          <span className="text-xs text-dark font-medium block">📞 {row.phone || 'No mobile'}</span>
          {row.alternate_phone && (
            <span className="text-[10px] text-dark/40 block">Alt: {row.alternate_phone}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Current Advance Balance',
      render: (row) => (
        <div>
          <span className="font-display text-base font-bold text-emerald-800 block">
            ₹{Number(row.advance_balance || 0).toLocaleString('en-IN')}
          </span>
          {Number(row.advance_balance || 0) < 500 && (
            <span className="text-[10px] text-amber-700 font-bold block">Low Balance Warning</span>
          )}
        </div>
      ),
    },
    {
      header: 'Last Visit',
      render: (row) => (
        <span className="text-xs text-dark/70">
          {row.last_visit_date
            ? new Date(row.last_visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'No visits yet'}
        </span>
      ),
    },
    {
      header: 'Total Visits',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-dark px-2.5 py-1 bg-gray-100 rounded-full border border-[#E8DFCF]">
          {row.visit_count || 0} visits
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/permanent-customers/${row.id}`)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#D4AF37] hover:text-white text-dark/70 transition-all font-semibold text-xs flex items-center gap-1"
            title="Open Wallet Profile"
          >
            <Eye size={13} /> Profile
          </button>

          <button
            onClick={() => {
              setDepositTarget(row);
              setDepositAmount('');
              setDepositNotes('');
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1"
            title="Add Advance Deposit"
          >
            <Plus size={13} /> Add Advance
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <UserCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#D4AF37] text-white">
                Prepaid Wallet Module
              </span>
              <span className="text-xs text-dark/40 font-medium">Single Source of Truth</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              Permanent Customers
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Manage loyal prepaid customers, advance wallet balances, deposits & automatic visit deductions
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
        >
          <UserPlus size={16} /> Register Permanent Customer
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Permanent Clients
            </span>
            <h3 className="font-display text-2xl font-bold text-dark">{customers.length}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-[#D4AF37] border border-amber-100">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Active Advance Pool
            </span>
            <h3 className="font-display text-2xl font-bold text-emerald-800">
              ₹{totalAdvancePool.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Wallet size={22} />
          </div>
        </div>

        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Total Deposited
            </span>
            <h3 className="font-display text-2xl font-bold text-blue-700">
              ₹{totalAdvanceDeposited.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Total Advance Used
            </span>
            <h3 className="font-display text-2xl font-bold text-purple-700">
              ₹{totalAdvanceUsed.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
            <CreditCard size={22} />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer name, mobile number, alternate mobile..."
        primaryAction={{
          label: 'Register Permanent Customer',
          icon: UserPlus,
          onClick: () => setIsRegisterOpen(true),
        }}
        pagination={{
          currentPage,
          totalPages: Math.ceil(filteredCustomers.length / itemsPerPage) || 1,
          onPageChange: setCurrentPage,
          totalItems: filteredCustomers.length,
          itemsPerPage,
        }}
      />

      {/* REGISTER PERMANENT CUSTOMER MODAL */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Permanent Customer"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-dark/80 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={regData.name}
              onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              placeholder="e.g. Anjali Sharma"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-dark/80 mb-1">Mobile Number</label>
              <input
                type="text"
                value={regData.phone}
                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark"
              />
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Alternate Number (Optional)</label>
              <input
                type="text"
                value={regData.alternatePhone}
                onChange={(e) => setRegData({ ...regData, alternatePhone: e.target.value })}
                placeholder="e.g. +91 91234 56789"
                className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-dark/80 mb-1">Gender</label>
              <select
                value={regData.gender}
                onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Date of Birth</label>
              <input
                type="date"
                value={regData.birthday}
                onChange={(e) => setRegData({ ...regData, birthday: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF] space-y-3">
            <div>
              <label className="block font-bold text-dark/80 mb-1">Initial Advance Deposit (₹)</label>
              <input
                type="number"
                min="0"
                value={regData.initialDeposit}
                onChange={(e) => setRegData({ ...regData, initialDeposit: e.target.value })}
                placeholder="e.g. 5000"
                className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark font-bold text-sm focus:outline-none focus:border-[#D4AF37]"
              />
              <span className="text-[10px] text-dark/50 mt-1 block">
                This initial deposit will be added directly to the customer's prepaid wallet.
              </span>
            </div>

            {Number(regData.initialDeposit || 0) > 0 && (
              <div>
                <label className="block font-bold text-dark/80 mb-1">Deposit Payment Method / Source *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: '💵 Cash' },
                    { id: 'upi', label: '📱 UPI' },
                    { id: 'card', label: '💳 Card' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setRegData({ ...regData, paymentMethod: pm.id })}
                      className={`py-2 rounded-xl font-bold text-xs transition-all ${
                        (regData.paymentMethod || 'cash') === pm.id
                          ? 'bg-[#D4AF37] text-white shadow-sm'
                          : 'bg-white text-dark/70 border border-[#E8DFCF]'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Notes / Special Instructions</label>
            <textarea
              rows={2}
              value={regData.notes}
              onChange={(e) => setRegData({ ...regData, notes: e.target.value })}
              placeholder="Optional preference notes for this customer..."
              className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReg}
              className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold hover:bg-[#C59F2E] flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle size={15} /> {submittingReg ? 'Registering...' : 'Save Permanent Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD ADVANCE DEPOSIT MODAL */}
      <Modal
        isOpen={!!depositTarget}
        onClose={() => setDepositTarget(null)}
        title="Add Advance Wallet Deposit"
      >
        {depositTarget && (
          <form onSubmit={handleAddAdvanceDeposit} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block mb-1">
                Customer Wallet Summary
              </span>
              <p className="font-bold text-dark text-sm">{depositTarget.name}</p>
              <div className="flex justify-between font-bold text-emerald-800 text-xs mt-1">
                <span>Current Advance Balance:</span>
                <span>₹{Number(depositTarget.advance_balance || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Deposit Amount (₹) *</label>
              <input
                type="number"
                min="1"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl font-bold text-dark text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Payment Method Received *</label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'upi', 'card'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setDepositMethod(pm)}
                    className={`py-2 rounded-xl font-bold uppercase transition-all ${
                      depositMethod === pm
                        ? 'bg-[#D4AF37] text-white shadow-md'
                        : 'bg-gray-100 text-dark/70 border border-[#E8DFCF]'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Transaction Notes</label>
              <input
                type="text"
                value={depositNotes}
                onChange={(e) => setDepositNotes(e.target.value)}
                placeholder="e.g. Wallet renewal deposit"
                className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
              <button
                type="button"
                onClick={() => setDepositTarget(null)}
                className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingDeposit}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5"
              >
                <CheckCircle size={15} /> {submittingDeposit ? 'Processing...' : 'Add Advance Deposit'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
