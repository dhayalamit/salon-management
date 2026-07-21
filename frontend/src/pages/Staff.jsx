import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { UserCog, Plus, Eye, Edit3, Trash2, Phone, DollarSign, Percent, UserCheck } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Staff() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    salary: '',
    commissionPercent: 15,
    status: 'active',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await client.get('/staff');
      setStaff(res.data || []);
    } catch (err) {
      showError('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!formData.name) return showError('Staff member name is required');

    try {
      if (editingStaff) {
        await client.put(`/staff/${editingStaff.id}`, formData);
        showSuccess('Staff profile updated');
      } else {
        await client.post('/staff', formData);
        showSuccess('New staff member added');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      showError('Failed to save staff profile');
    }
  };

  const confirmDeleteStaff = async () => {
    if (!deleteConfirmId) return;
    try {
      await client.delete(`/staff/${deleteConfirmId}`);
      showSuccess('Staff member deleted successfully');
      setDeleteConfirmId(null);
      fetchStaff();
    } catch (err) {
      showError('Failed to delete staff member');
    }
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({ name: '', phone: '', salary: '', commissionPercent: 15, status: 'active' });
    setIsModalOpen(true);
  };

  const openEditModal = (st) => {
    setEditingStaff(st);
    setFormData({
      name: st.name,
      phone: st.phone || '',
      salary: st.salary || '',
      commissionPercent: st.commission_percent || 15,
      status: st.status || 'active',
    });
    setIsModalOpen(true);
  };

  const filteredStaff = staff.filter((st) => st.name.toLowerCase().includes(search.toLowerCase()));

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
  const paginatedData = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Staff Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#A37E1F] font-display text-sm font-bold text-white shadow-sm">
            {row.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-semibold text-dark hover:text-[#D4AF37] cursor-pointer" onClick={() => navigate(`/staff/${row.id}`)}>
              {row.name}
            </p>
            <p className="text-xs text-dark/50 flex items-center gap-1">
              <Phone size={12} /> {row.phone || 'No phone'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Monthly Salary',
      render: (row) => (
        <div>
          <p className="font-display text-sm font-bold text-dark">₹{Number(row.salary || 0).toLocaleString('en-IN')}/mo</p>
        </div>
      ),
    },
    {
      header: "Today's Status",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
            row.today_status === 'present'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : row.today_status === 'half_day'
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
        >
          {row.today_status || 'absent'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/staff/${row.id}`)}
            className="p-2 rounded-xl bg-[#F4F0E6] text-dark/70 hover:bg-[#D4AF37] hover:text-white transition-colors"
            title="View Profile"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-2 rounded-xl bg-[#F4F0E6] text-dark/70 hover:bg-dark hover:text-white transition-colors"
            title="Edit Staff"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirmId(row.id)}
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            title="Delete Staff"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">Staff Team</h1>
          <p className="text-xs text-dark/50">Manage stylists, base salaries, and attendance</p>
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staff by name..."
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredStaff.length}
        itemsPerPage={itemsPerPage}
        actionButton={
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md"
          >
            <Plus size={16} /> Add Staff Member
          </button>
        }
      />

      {/* Add/Edit Staff Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? 'Edit Staff Profile' : 'Add Staff Member'}>
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vikram Malhotra"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Monthly Base Salary (₹)</label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder="Enter Salary (₹)"
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
              Save Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Staff Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteStaff}
        title="⚠️ Confirm Delete Staff Member"
        message="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmText="Delete Staff Member"
        variant="danger"
      />
    </div>
  );
}
