import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { UserPlus, Eye, Edit3, Trash2, Phone, Calendar, Heart, User, Search, Filter } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Customers() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'female',
    birthday: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, [search, genderFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await client.get('/customers', {
        params: { search, gender: genderFilter },
      });
      setCustomers(res.data || []);
    } catch (err) {
      showError('Failed to load customer list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name) return showError('Customer name is required');

    try {
      await client.post('/customers', formData);
      showSuccess('Customer created successfully');
      setIsAddModalOpen(false);
      setFormData({ name: '', phone: '', email: '', gender: 'female', birthday: '', notes: '' });
      fetchCustomers();
    } catch (err) {
      showError('Failed to create customer');
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      await client.put(`/customers/${selectedCustomer.id}`, formData);
      showSuccess('Customer updated successfully');
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (err) {
      showError('Failed to update customer');
    }
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteConfirmId) return;
    try {
      await client.delete(`/customers/${deleteConfirmId}`);
      showSuccess('Customer deleted successfully');
      setDeleteConfirmId(null);
      fetchCustomers();
    } catch (err) {
      showError('Failed to delete customer');
    }
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      gender: customer.gender || 'female',
      birthday: customer.birthday ? customer.birthday.split('T')[0] : '',
      notes: customer.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Pagination Logic
  const itemsPerPage = 8;
  const totalPages = Math.ceil(customers.length / itemsPerPage) || 1;
  const paginatedData = customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#A37E1F] font-display text-sm font-bold text-white shadow-sm">
            {row.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="font-semibold text-dark hover:text-[#D4AF37] cursor-pointer" onClick={() => navigate(`/customers/${row.id}`)}>
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
      header: 'Status & Type',
      render: (row) => {
        const visits = Number(row.visit_count || 0);
        const typeLabel = visits > 1 ? 'Returning Client' : visits === 1 ? 'Active Client' : 'New / Walk-in';
        const typeColor = visits > 1 ? 'bg-purple-100 text-purple-700 border-purple-200' : visits === 1 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeColor}`}>
            {typeLabel}
          </span>
        );
      },
    },
    {
      header: 'Total Visits',
      render: (row) => (
        <span className="font-bold text-xs text-dark px-3 py-1 rounded-full bg-[#F4F0E6] border border-[#E8DFCF]">
          {row.visit_count || 0} visits
        </span>
      ),
    },
    {
      header: 'Total Spent',
      render: (row) => (
        <span className="font-bold text-xs text-emerald-700">
          ₹{Number(row.total_spent || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Last Visit Date',
      render: (row) => (
        <span className="text-xs text-dark/70">
          {row.last_visit_date ? new Date(row.last_visit_date).toLocaleDateString('en-IN') : 'No past visits'}
        </span>
      ),
    },
    {
      header: 'Next Appointment',
      render: (row) => (
        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
          {row.next_appointment_date ? new Date(row.next_appointment_date).toLocaleDateString('en-IN') : 'None scheduled'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/customers/${row.id}`)}
            className="p-2 rounded-xl bg-[#F4F0E6] text-dark/70 hover:bg-[#D4AF37] hover:text-white transition-colors"
            title="View Profile"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-2 rounded-xl bg-[#F4F0E6] text-dark/70 hover:bg-dark hover:text-white transition-colors"
            title="Edit Customer"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirmId(row.id)}
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            title="Delete Customer"
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
          <h1 className="font-display text-2xl font-bold text-dark">Customer Database</h1>
          <p className="text-xs text-dark/50">Manage clients, review visit history, and loyalty profiles</p>
        </div>
      </div>

      {/* Table Shell with Filters */}
      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer by name or phone..."
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={customers.length}
        itemsPerPage={itemsPerPage}
        filterComponent={
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/70 backdrop-blur-md border border-[#E8DFCF] rounded-full text-xs font-semibold text-dark focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Genders</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        }
        actionButton={
          <button
            onClick={() => {
              setFormData({ name: '', phone: '', email: '', gender: 'female', birthday: '', notes: '' });
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md"
          >
            <UserPlus size={16} /> Add Customer
          </button>
        }
      />

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Client">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Eleanor Vance"
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
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Special Preferences / Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Allergies, preferred hair stylists, tea preferences..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E]"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer Info">
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E]"
            >
              Update Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteCustomer}
        title="⚠️ Confirm Delete Customer"
        message="Are you sure you want to delete this customer record? All associated history will be removed. This action cannot be undone."
        confirmText="Delete Customer"
        variant="danger"
      />
    </div>
  );
}
