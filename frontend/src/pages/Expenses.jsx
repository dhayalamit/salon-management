import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Wallet, Plus, Trash2, Calendar, DollarSign, Tag, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString } from '../utils/dateUtils.js';

export default function Expenses() {
  const { showSuccess, showError } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([
    'Electricity',
    'Rent',
    'Water Bill',
    'Internet',
    'Staff Tea/Snacks',
    'Cleaning',
    'Maintenance',
    'Marketing',
    'Stationery',
    'Miscellaneous',
    'Other (Custom)',
  ]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electricity',
    amount: '',
    expenseDate: getTodayDateString(),
    paymentMethod: 'cash',
    note: '',
  });

  // Custom Category State
  const [isCustomCategoryModal, setIsCustomCategoryModal] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await client.get('/expenses/categories');
      if (res.data && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

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
      setFormData({
        title: '',
        category: categories[0] || 'Electricity',
        amount: '',
        expenseDate: getTodayDateString(),
        paymentMethod: 'cash',
        note: '',
      });
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchExpenses();
    } catch (err) {
      showError('Failed to record expense');
    }
  };

  const handleAddCustomCategory = async (e) => {
    e.preventDefault();
    if (!customCategoryName.trim()) return showError('Category name is required');

    try {
      const res = await client.post('/expenses/categories', { name: customCategoryName.trim() });
      showSuccess(`Custom category "${res.data.name}" added`);
      setCategories((prev) => Array.from(new Set([...prev, res.data.name])));
      setFormData((prev) => ({ ...prev, category: res.data.name }));
      setIsCustomCategoryModal(false);
      setCustomCategoryName('');
    } catch (err) {
      showError('Failed to add custom category');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await client.delete(`/expenses/${id}`);
      showSuccess('Expense record deleted');
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchExpenses();
    } catch (err) {
      showError('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(
    (ex) =>
      (ex.title || '').toLowerCase().includes(search.toLowerCase()) ||
      ex.category.toLowerCase().includes(search.toLowerCase()) ||
      (ex.note || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalExpenseSum = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const itemsPerPage = 8;
  const paginatedData = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Title & Category',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 shrink-0">
            <Wallet size={18} />
          </div>
          <div>
            <p className="font-bold text-dark">{row.title || `${row.category} Expense`}</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-[#F4F0E6] text-dark/70 border border-[#E8DFCF] mt-0.5">
              {row.category}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Payment Method & Date',
      render: (row) => (
        <div>
          <span className="text-xs text-dark/80 font-semibold block capitalize">
            💳 {row.payment_method || 'cash'}
          </span>
          <span className="text-[11px] text-dark/50 flex items-center gap-1 mt-0.5">
            <Calendar size={11} className="text-[#D4AF37]" />
            {row.expense_date || new Date(row.created_at).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Notes / Remarks',
      render: (row) => (
        <span className="text-xs text-dark/60 italic max-w-xs truncate block">
          {row.note || 'No notes added'}
        </span>
      ),
    },
    {
      header: 'Amount (₹)',
      render: (row) => (
        <span className="font-display text-base font-bold text-red-600">
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
          <p className="text-xs text-dark/50">Track operational costs, utilities, rent, supplies, snacks & custom expenses</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card px-5 py-2.5 flex items-center gap-3 border border-[#E8DFCF]">
            <span className="text-xs text-dark/50 font-medium">Total Expenses:</span>
            <span className="font-display text-xl font-bold text-red-600">
              ₹{totalExpenseSum.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
          >
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search expense title, category, or note..."
        primaryAction={{
          label: 'Record New Expense',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
        pagination={{
          currentPage,
          totalPages: Math.ceil(filteredExpenses.length / itemsPerPage) || 1,
          onPageChange: setCurrentPage,
          totalItems: filteredExpenses.length,
          itemsPerPage,
        }}
      />

      {/* Record Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Expense">
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-dark/70 mb-1">Expense Title / Reason</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Water Can - 2, Electricity Bill, Staff Tea"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-dark/70">Category *</label>
              <button
                type="button"
                onClick={() => setIsCustomCategoryModal(true)}
                className="text-[11px] font-bold text-[#D4AF37] hover:underline"
              >
                + Add Custom Category
              </button>
            </div>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-dark/70 mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 500"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-bold text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block font-semibold text-dark/70 mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-dark/70 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'upi', 'card'].map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: pm })}
                  className={`py-2 rounded-xl font-bold uppercase transition-all ${
                    formData.paymentMethod === pm
                      ? 'bg-[#D4AF37] text-white shadow-md'
                      : 'bg-[#F4F0E6] text-dark/70 border border-[#E8DFCF]'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-dark/70 mb-1">Expense Notes (Optional)</label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="e.g. Paid for tea 50+100+30+20, water cans, gloves..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-semibold hover:bg-[#C59F2E] flex items-center gap-1.5"
            >
              <CheckCircle size={15} /> Save Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Custom Category Modal */}
      <Modal isOpen={isCustomCategoryModal} onClose={() => setIsCustomCategoryModal(false)} title="Add Custom Category">
        <form onSubmit={handleAddCustomCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-dark/70 mb-1">New Category Name</label>
            <input
              type="text"
              required
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="e.g. Generator Fuel, Sanitation, Vendor Advance"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsCustomCategoryModal(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-semibold hover:bg-[#C59F2E]"
            >
              Add Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
