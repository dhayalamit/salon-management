import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Scissors, Plus, Edit3, Trash2, Clock, Percent, DollarSign } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Services() {
  const { showSuccess, showError } = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationMinutes: 30,
    commissionPercent: 15,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await client.get('/services');
      setServices(res.data || []);
    } catch (err) {
      showError('Failed to load services list');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      return showError('Service name and price are required');
    }

    try {
      if (editingService) {
        await client.put(`/services/${editingService.id}`, formData);
        showSuccess('Service updated successfully');
      } else {
        await client.post('/services', formData);
        showSuccess('Service created successfully');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      showError('Failed to save service');
    }
  };

  const confirmDeleteService = async () => {
    if (!deleteConfirmId) return;
    try {
      await client.delete(`/services/${deleteConfirmId}`);
      showSuccess('Service deactivated successfully');
      setDeleteConfirmId(null);
      fetchServices();
    } catch (err) {
      showError('Failed to delete service');
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({ name: '', price: '', durationMinutes: 30, commissionPercent: 15 });
    setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingService(s);
    setFormData({
      name: s.name,
      price: s.price,
      durationMinutes: s.duration_minutes || 30,
      commissionPercent: s.commission_percent || 15,
    });
    setIsModalOpen(true);
  };

  const filteredServices = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const paginatedData = filteredServices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Service Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <Scissors size={18} />
          </div>
          <div>
            <p className="font-semibold text-dark">{row.name}</p>
            <p className="text-xs text-dark/50 flex items-center gap-1">
              <Clock size={12} /> {row.duration_minutes || 30} mins duration
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Price (₹)',
      render: (row) => (
        <span className="font-display text-base font-bold text-dark">
          ₹{Number(row.price).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-2 rounded-xl bg-[#F4F0E6] text-dark/70 hover:bg-dark hover:text-white transition-colors"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirmId(row.id)}
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
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
          <h1 className="font-display text-2xl font-bold text-dark">Service Menu</h1>
          <p className="text-xs text-dark/50">Manage luxury hair, facial, spa, and beauty packages</p>
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search service by name..."
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredServices.length}
        itemsPerPage={itemsPerPage}
        actionButton={
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md"
          >
            <Plus size={16} /> Add New Service
          </button>
        }
      />

      {/* Add / Edit Service Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? 'Edit Service' : 'Add New Service'}>
        <form onSubmit={handleSaveService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Service Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Keratin Hair Treatment"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Price (₹) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1500"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Duration (mins)</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
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
              Save Service
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Service Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteService}
        title="⚠️ Confirm Delete Service"
        message="Are you sure you want to deactivate this service from your salon menu? This action cannot be undone."
        confirmText="Deactivate Service"
        variant="danger"
      />
    </div>
  );
}
