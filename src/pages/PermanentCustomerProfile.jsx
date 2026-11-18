import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  UserCheck,
  Phone,
  Calendar,
  Wallet,
  ArrowLeft,
  Plus,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function PermanentCustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visits'); // 'visits' or 'ledger'
  const [filterDate, setFilterDate] = useState('');

  // Add Advance Modal State
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('cash');
  const [depositNotes, setDepositNotes] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/permanent-customers/${id}`);
      setProfile(res.data);
    } catch (err) {
      showError('Failed to load permanent customer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) {
      return showError('Please enter a valid advance deposit amount');
    }

    try {
      setSubmittingDeposit(true);
      await client.post(`/permanent-customers/${id}/advance`, {
        amount: Number(depositAmount),
        paymentMethod: depositMethod,
        notes: depositNotes,
      });
      showSuccess(`₹${Number(depositAmount).toLocaleString('en-IN')} advance deposit added successfully!`);
      setIsDepositOpen(false);
      setDepositAmount('');
      setDepositNotes('');
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchProfile();
    } catch (err) {
      showError('Failed to record advance deposit');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-dark/50 italic">
        Loading permanent customer wallet profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-dark/50 text-xs">Customer profile not found.</p>
        <button
          onClick={() => navigate('/permanent-customers')}
          className="px-4 py-2 rounded-full bg-[#D4AF37] text-white font-bold text-xs"
        >
          Back to Permanent Customers
        </button>
      </div>
    );
  }

  const filteredHistory = (profile.history || []).filter((v) => {
    if (!filterDate) return true;
    return (v.created_at || '').slice(0, 10) === filterDate;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/permanent-customers')}
        className="flex items-center gap-1.5 text-xs font-bold text-dark/70 hover:text-dark transition-colors"
      >
        <ArrowLeft size={16} /> Back to Permanent Customers List
      </button>

      {/* Prominent Header Banner & Advance Wallet Display */}
      <div className="glass-card p-6 sm:p-8 border border-[#E8DFCF] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Customer Main Info */}
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-3xl bg-[#D4AF37] text-white shadow-md">
              <UserCheck size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark">{profile.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  Permanent Client
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-dark/60 mt-1.5">
                <span>📞 {profile.phone || 'No phone'}</span>
                {profile.alternate_phone && <span>Alt: {profile.alternate_phone}</span>}
                <span className="capitalize">Gender: {profile.gender || 'Other'}</span>
                {profile.birthday && <span>🎂 DOB: {profile.birthday}</span>}
              </div>
            </div>
          </div>

          {/* Wallet Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDepositOpen(true)}
              className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Plus size={16} /> Add Advance Deposit
            </button>

            <button
              onClick={() =>
                navigate('/visits', {
                  state: {
                    createVisit: true,
                    customerId: profile.id,
                  },
                })
              }
              className="px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#C59F2E] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <CalendarCheck size={16} /> Add Customer Visit
            </button>
          </div>
        </div>

        {/* PROMINENT CURRENT ADVANCE BALANCE CARD GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {/* Main Advance Balance Highlight Card */}
          <div className="sm:col-span-2 p-5 rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white shadow-luxury relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 block mb-1">
                  Current Available Wallet Balance
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  ₹{Number(profile.advance_balance || 0).toLocaleString('en-IN')}
                </h2>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 text-emerald-200">
                <Wallet size={24} />
              </div>
            </div>
            <span className="text-[11px] text-emerald-100/70 mt-3 block font-medium">
              Calculates & updates automatically after every visit or deposit.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8DFCF] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-dark/40 block">Total Deposited</span>
            <p className="font-display text-xl font-bold text-blue-700 mt-2">
              ₹{Number(profile.total_advance_deposited || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-dark/40 mt-1">Cumulative deposits</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8DFCF] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-dark/40 block">Total Advance Used</span>
            <p className="font-display text-xl font-bold text-purple-700 mt-2">
              ₹{Number(profile.total_advance_used || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-dark/40 mt-1">Deducted for visits</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8DFCF] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-dark/40 block">Total Visits</span>
            <p className="font-display text-xl font-bold text-dark mt-2">{profile.visitCount || 0}</p>
            <span className="text-[10px] text-dark/40 mt-1">
              {profile.lastVisitDate ? `Last: ${new Date(profile.lastVisitDate).toLocaleDateString()}` : 'No visits yet'}
            </span>
          </div>
        </div>

        {profile.notes && (
          <div className="p-3.5 rounded-2xl bg-[#F4F0E6] text-xs text-dark/80 italic border border-[#E8DFCF]">
            <strong>Preference Notes:</strong> {profile.notes}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-[#E8DFCF]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-5 py-2.5 font-bold text-xs rounded-t-2xl transition-all border-t border-x ${
              activeTab === 'visits'
                ? 'bg-white border-[#E8DFCF] text-[#D4AF37] shadow-xs'
                : 'bg-transparent border-transparent text-dark/50 hover:text-dark'
            }`}
          >
            Customer Visit History ({profile.history?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-2.5 font-bold text-xs rounded-t-2xl transition-all border-t border-x ${
              activeTab === 'ledger'
                ? 'bg-white border-[#E8DFCF] text-[#D4AF37] shadow-xs'
                : 'bg-transparent border-transparent text-dark/50 hover:text-dark'
            }`}
          >
            Advance Transaction Ledger ({profile.transactions?.length || 0})
          </button>
        </div>

        {activeTab === 'visits' && (
          <div className="flex items-center gap-1.5 pb-2 text-xs">
            <span className="text-dark/50 font-medium">Filter Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-[11px] text-red-600 font-bold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: CUSTOMER VISIT HISTORY */}
      {activeTab === 'visits' && (
        <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
          {!filteredHistory.length ? (
            <p className="text-xs text-dark/40 py-8 text-center">No customer visits recorded for this client.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8DFCF] text-dark/50 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-3 px-3">Visit Date & #</th>
                    <th className="pb-3 px-3">Stylist</th>
                    <th className="pb-3 px-3 text-right">Visit Total</th>
                    <th className="pb-3 px-3 text-right">Advance Used</th>
                    <th className="pb-3 px-3 text-right">Other Payment</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFCF]/60">
                  {filteredHistory.map((vis) => {
                    const advanceUsedAmt = Number(vis.advance_used || 0);
                    const totalAmt = Number(vis.total || 0);
                    const otherPaid = Math.max(0, Number(vis.amount_paid || 0) - advanceUsedAmt);

                    return (
                      <tr key={vis.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-dark block">{vis.visit_number}</span>
                          <span className="text-[10px] text-dark/40">
                            {new Date(vis.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-dark/70 font-semibold">{vis.staff_name || 'Salon Team'}</td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-dark">
                          ₹{totalAmt.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                          {advanceUsedAmt > 0 ? `₹${advanceUsedAmt.toLocaleString('en-IN')}` : '—'}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-dark/70">
                          {otherPaid > 0 ? `₹${otherPaid.toLocaleString('en-IN')} (${vis.payment_method})` : '—'}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              vis.payment_status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : vis.payment_status === 'Partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {vis.payment_status || 'Paid'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => navigate(`/visits/${vis.id}`)}
                            className="px-3 py-1 rounded-xl bg-[#F4F0E6] text-dark font-semibold hover:bg-[#D4AF37] hover:text-white transition-colors text-[11px]"
                          >
                            View Visit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADVANCE TRANSACTION LEDGER */}
      {activeTab === 'ledger' && (
        <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
          {!profile.transactions || profile.transactions.length === 0 ? (
            <p className="text-xs text-dark/40 py-8 text-center">No advance wallet transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8DFCF] text-dark/50 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-3 px-3">Date & Time</th>
                    <th className="pb-3 px-3">Transaction Type</th>
                    <th className="pb-3 px-3 text-right">Amount (₹)</th>
                    <th className="pb-3 px-3 text-right">Balance After</th>
                    <th className="pb-3 px-3">Payment Method</th>
                    <th className="pb-3 px-3">Notes</th>
                    <th className="pb-3 px-3">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFCF]/60">
                  {profile.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
                      <td className="py-3 px-3 text-dark/60 font-medium">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at{' '}
                        {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>

                      <td className="py-3 px-3 capitalize">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.type === 'deposit'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.type === 'deduction'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono font-bold text-sm ${
                          tx.type === 'deposit' ? 'text-emerald-700' : 'text-purple-700'
                        }`}
                      >
                        {tx.type === 'deposit' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-dark">
                        ₹{Number(tx.balance_after).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 font-semibold uppercase text-dark/70">
                        💳 {tx.payment_method || 'cash'}
                      </td>

                      <td className="py-3 px-3 text-dark/80 italic">{tx.notes || '—'}</td>

                      <td className="py-3 px-3 text-dark/60 font-medium">{tx.performed_by || 'Admin'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD ADVANCE MODAL */}
      <Modal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} title="Add Advance Wallet Deposit">
        <form onSubmit={handleAddAdvance} className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block mb-1">
              Client Wallet
            </span>
            <p className="font-bold text-dark text-sm">{profile.name}</p>
            <div className="flex justify-between font-bold text-emerald-800 text-xs mt-1">
              <span>Current Advance Balance:</span>
              <span>₹{Number(profile.advance_balance || 0).toLocaleString('en-IN')}</span>
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
              placeholder="e.g. 5000"
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
              placeholder="e.g. Advance wallet deposit top-up"
              className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsDepositOpen(false)}
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
      </Modal>
    </div>
  );
}
