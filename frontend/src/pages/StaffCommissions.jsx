import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Plus, Trash2, Calendar, Award, Scissors, Check } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString } from '../utils/dateUtils.js';

export default function StaffCommissions() {
  const { showSuccess, showError } = useToast();

  const [commissions, setCommissions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Multi-service entry form state
  const [formData, setFormData] = useState({
    staffId: '',
    customerId: '',
    date: getTodayDateString(),
    remarks: '',
  });

  const [selectedServices, setSelectedServices] = useState([
    {
      serviceId: '',
      serviceName: '',
      baseAmount: '',
      commissionType: 'percent',
      commissionRate: 10,
      fixedAmount: '',
    },
  ]);

  useEffect(() => {
    fetchInitialData();
    fetchCommissions();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [staffRes, custRes, servRes] = await Promise.all([
        client.get('/staff'),
        client.get('/customers'),
        client.get('/services'),
      ]);
      setStaff(staffRes.data || []);
      setCustomers(custRes.data || []);
      setServicesList(servRes.data || []);
    } catch (err) {
      console.error('Failed to load initial dropdowns', err);
    }
  };

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await client.get('/commissions');
      setCommissions(res.data || []);
    } catch (err) {
      showError('Failed to load staff commission records');
    } finally {
      setLoading(false);
    }
  };

  // Service Selection Handlers
  const handleAddServiceRow = () => {
    setSelectedServices([
      ...selectedServices,
      {
        serviceId: '',
        serviceName: '',
        baseAmount: '',
        commissionType: 'percent',
        commissionRate: 10,
        fixedAmount: '',
      },
    ]);
  };

  const handleRemoveServiceRow = (index) => {
    if (selectedServices.length === 1) return showError('At least one service is required');
    const updated = selectedServices.filter((_, idx) => idx !== index);
    setSelectedServices(updated);
  };

  const handleServiceSelect = (index, serviceId) => {
    const sObj = servicesList.find((s) => String(s.id) === String(serviceId));
    const updated = [...selectedServices];
    if (sObj) {
      updated[index] = {
        ...updated[index],
        serviceId: sObj.id,
        serviceName: sObj.name,
        baseAmount: sObj.price,
        commissionRate: sObj.commission_percent || 10,
      };
    } else {
      updated[index] = {
        ...updated[index],
        serviceId: '',
        serviceName: '',
        baseAmount: '',
      };
    }
    setSelectedServices(updated);
  };

  const handleServiceChange = (index, field, value) => {
    const updated = [...selectedServices];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedServices(updated);
  };

  // Computed Totals for Multi-Service Commission
  const calculateRowCommission = (row) => {
    const price = Number(row.baseAmount || 0);
    if (row.commissionType === 'percent') {
      return (price * Number(row.commissionRate || 0)) / 100;
    }
    return Number(row.fixedAmount || 0);
  };

  const totalServiceAmount = selectedServices.reduce((sum, row) => sum + Number(row.baseAmount || 0), 0);
  const totalCommissionAmount = selectedServices.reduce((sum, row) => sum + calculateRowCommission(row), 0);

  // Manual Status Update Dropdown Handler
  const handleStatusChange = async (id, newStatus) => {
    try {
      await client.put(`/commissions/${id}/status`, { status: newStatus });
      showSuccess(`Commission status updated to ${newStatus}`);
      fetchCommissions();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update status');
    }
  };

  // Submit New Multi-Service Commission
  const handleRecordCommission = async (e) => {
    e.preventDefault();
    if (!formData.staffId) return showError('Select Staff Member');
    if (selectedServices.length === 0) return showError('Add at least one service');

    try {
      // Record each selected service as a commission entry
      for (const row of selectedServices) {
        const commAmt = calculateRowCommission(row);
        await client.post('/commissions', {
          staffId: formData.staffId,
          customerId: formData.customerId,
          serviceName: row.serviceName || 'General Service',
          commissionType: row.commissionType,
          commissionRate: row.commissionRate,
          baseAmount: row.baseAmount,
          commissionAmount: commAmt,
          date: formData.date,
          remarks: formData.remarks,
        });
      }

      showSuccess('Staff commission recorded successfully');
      setIsModalOpen(false);
      setFormData({
        staffId: '',
        customerId: '',
        date: getTodayDateString(),
        remarks: '',
      });
      setSelectedServices([
        {
          serviceId: '',
          serviceName: '',
          baseAmount: '',
          commissionType: 'percent',
          commissionRate: 10,
          fixedAmount: '',
        },
      ]);
      fetchCommissions();
    } catch (err) {
      showError('Failed to record commission');
    }
  };

  const confirmDeleteCommission = async () => {
    if (!deleteConfirmId) return;
    try {
      await client.delete(`/commissions/${deleteConfirmId}`);
      showSuccess('Commission record deleted successfully');
      setDeleteConfirmId(null);
      fetchCommissions();
    } catch (err) {
      showError('Failed to delete commission entry');
    }
  };

  const filteredCommissions = commissions.filter((c) => {
    const term = search.toLowerCase();
    return (
      (c.staff_name || '').toLowerCase().includes(term) ||
      (c.customer_name || '').toLowerCase().includes(term) ||
      (c.service_name || '').toLowerCase().includes(term) ||
      (c.remarks || '').toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      header: 'Customer Name',
      render: (row) => (
        <div>
          <p className="font-semibold text-dark">{row.customer_name || 'Select Customer'}</p>
          <p className="text-xs text-dark/40">{row.customer_phone || 'No phone'}</p>
        </div>
      ),
    },
    {
      header: 'Staff Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#A37E1F] font-display text-xs font-bold text-white shadow-xs">
            {row.staff_name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-semibold text-dark">{row.staff_name || 'Select Staff'}</p>
            <p className="text-[10px] text-dark/40">{row.staff_phone || 'No phone'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Service',
      render: (row) => (
        <span className="text-xs font-medium text-dark/70">
          {row.service_name || 'Referral Commission'}
        </span>
      ),
    },
    {
      header: 'Bill Amount',
      render: (row) => (
        <span className="font-mono text-xs text-dark/70 font-semibold">
          ₹{Number(row.base_amount || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Commission Type',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            row.commission_type === 'percent'
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}
        >
          {row.commission_type === 'percent' ? `${row.commission_rate}%` : 'Fixed Reward'}
        </span>
      ),
    },
    {
      header: 'Commission Amount',
      render: (row) => (
        <span className="font-display text-base font-bold text-[#D4AF37]">
          ₹{Number(row.commission_amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <select
          value={row.status || 'Pending'}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all focus:outline-none cursor-pointer border ${
            row.status === 'Paid'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          <option value="Pending">🟡 Pending</option>
          <option value="Paid">🟢 Paid</option>
        </select>
      ),
    },
    {
      header: 'Payment Date',
      render: (row) => (
        <span className="text-xs font-mono text-dark/60">
          {row.status === 'Paid' && row.payment_date
            ? new Date(row.payment_date).toLocaleDateString('en-IN')
            : '-'}
        </span>
      ),
    },
    {
      header: 'Notes',
      render: (row) => (
        <span className="text-xs text-dark/60 truncate max-w-xs">{row.remarks || 'No notes'}</span>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => setDeleteConfirmId(row.id)}
          className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
          title="Delete Record"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Clean Minimal Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#D4AF37] text-white">
              Staff Earnings
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
            Staff Commission Management
          </h1>
          <p className="text-xs text-dark/50 mt-1">
            Record multi-service commissions, track payment status, and update earnings manually
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> + Record New Staff Commission
        </button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredCommissions}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by customer, staff, service or notes..."
      />

      {/* Multi-Service Record Commission Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Multi-Service Staff Commission">
        <form onSubmit={handleRecordCommission} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Select Staff *</label>
              <select
                required
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">Select Staff</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Select Customer</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-Services Selection Section */}
          <div className="space-y-3 pt-2 border-t border-[#E8DFCF]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-dark/70">
                Selected Services ({selectedServices.length})
              </label>
              <button
                type="button"
                onClick={handleAddServiceRow}
                className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> + Add Another Service
              </button>
            </div>

            {selectedServices.map((row, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[#F4F0E6]/60 border border-[#E8DFCF] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-dark">Service #{idx + 1}</span>
                  {selectedServices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceRow(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Searchable Service Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-dark/50 mb-1">Select Service</label>
                    <select
                      value={row.serviceId}
                      onChange={(e) => handleServiceSelect(idx, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFCF] text-xs text-dark focus:outline-none"
                    >
                      <option value="">Select Service</option>
                      {servicesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (₹{s.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-[10px] font-bold text-dark/50 mb-1">Service Price (₹)</label>
                    <input
                      type="number"
                      value={row.baseAmount}
                      onChange={(e) => handleServiceChange(idx, 'baseAmount', e.target.value)}
                      placeholder="Enter Price (₹)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFCF] text-xs text-dark focus:outline-none"
                    />
                  </div>

                  {/* Commission Mode & Amount */}
                  <div>
                    <label className="block text-[10px] font-bold text-dark/50 mb-1">Commission Rate / Amount</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={row.commissionType}
                        onChange={(e) => handleServiceChange(idx, 'commissionType', e.target.value)}
                        className="px-2 py-2 rounded-xl bg-white border border-[#E8DFCF] text-xs text-dark focus:outline-none"
                      >
                        <option value="percent">% Rate</option>
                        <option value="fixed">Fixed ₹</option>
                      </select>

                      {row.commissionType === 'percent' ? (
                        <input
                          type="number"
                          value={row.commissionRate}
                          onChange={(e) => handleServiceChange(idx, 'commissionRate', e.target.value)}
                          placeholder="%"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFCF] text-xs text-dark focus:outline-none"
                        />
                      ) : (
                        <input
                          type="number"
                          value={row.fixedAmount}
                          onChange={(e) => handleServiceChange(idx, 'fixedAmount', e.target.value)}
                          placeholder="₹"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFCF] text-xs text-dark focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] font-semibold text-[#D4AF37]">
                  Calculated Commission: ₹{calculateRowCommission(row).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Automatic Totals Banner */}
          <div className="p-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-dark/50">Total Service Amount</p>
              <p className="font-display text-base font-bold text-dark">
                ₹{totalServiceAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-dark/50">Total Commission Payable</p>
              <p className="font-display text-xl font-bold text-[#D4AF37]">
                ₹{totalCommissionAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Select Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Enter Notes</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Enter Notes"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:outline-none"
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
              Save Commission Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteCommission}
        title="⚠️ Confirm Delete Commission"
        message="Are you sure you want to delete this commission record? This action cannot be undone."
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
