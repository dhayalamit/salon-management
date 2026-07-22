import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Wallet, Plus, Trash2, Calendar, DollarSign, Tag } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString } from '../utils/dateUtils.js';

export default function Expenses() {
  const { showSuccess, showError } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    expenseDate: getTodayDateString(),
    note: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await client.get('/expenses');
      setExpenses(res.data || []);
    } catch (err) {
      showError('Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!formData.category || formData.amount === '') {
      return showError('Category and amount are required');
    }

    try {
      await client.post('/expenses', formData);
      showSuccess('Expense recorded successfully');
      setIsModalOpen(false);
      setFormData({ category: '', amount: '', expenseDate: getTodayDateString(), note: '' });
      fetchExpenses();
    } catch (err) {
      showError('Failed to record expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await client.delete(`/expenses/${id}`);
      showSuccess('Expense record deleted');
      fetchExpenses();
    } catch (err) {
      showError('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(
    (ex) =>
      ex.category.toLowerCase().includes(search.toLowerCase()) ||
      (ex.note || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalExpenseSum = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const paginatedData = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Category & Details',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
            <Wallet size={18} />
          </div>
          <div>
            <p className="font-semibold text-dark">{row.category}</p>
            <p className="text-xs text-dark/50">{row.note || 'No notes added'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      render: (row) => (
        <span className="text-xs text-dark/70 flex items-center gap-1">
          <Calendar size={13} className="text-[#D4AF37]" />
          {new Date(row.expense_date || row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Amount (₹)',
      render: (row) => (
        <span className="font-display text-base font-bold text-dark">
          ₹{Number(row.amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => handleDeleteExpense(row.id)}
          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">Salon Expenses</h1>
          <p className="text-xs text-dark/50">Track operational costs, salon supplies, utility bills, and maintenance</p>
        </div>

        <div className="glass-card px-5 py-2.5 flex items-center gap-3">
          <span className="text-xs text-dark/50 font-medium">Total Expenses:</span>
          <span className="font-display text-xl font-bold text-[#D4AF37]">
            ₹{totalExpenseSum.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search expense category or note..."
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredExpenses.length}
        itemsPerPage={itemsPerPage}
        actionButton={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md"
          >
            <Plus size={16} /> Record Expense
          </button>
        }
      />

      {/* Record Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Expense">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="Salon Supplies">Salon Supplies & Products</option>
              <option value="Rent & Lease">Rent & Lease</option>
              <option value="Utilities & Electricity">Utilities & Electricity</option>
              <option value="Staff Refreshments">Staff Refreshments & Tea</option>
              <option value="Marketing & Ads">Marketing & Ads</option>
              <option value="Equipment Maintenance">Equipment Maintenance</option>
              <option value="Other">Other Expenses</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="2500"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Expense Date</label>
              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Description / Note</label>
            <textarea
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="e.g. Purchased 5 bottles of luxury shampoo..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E]"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
