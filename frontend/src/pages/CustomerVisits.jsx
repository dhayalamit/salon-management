import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import {
  CalendarCheck,
  Plus,
  Trash2,
  User,
  Scissors,
  Package,
  CreditCard,
  Eye,
  Search,
  Sparkles,
  UserPlus,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString } from '../utils/dateUtils.js';

export default function CustomerVisits() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  const [visits, setVisits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Quick Client Search & Creation
  const [custSearch, setCustSearch] = useState('');
  const [showQuickAddCust, setShowQuickAddCust] = useState(false);
  const [quickCustData, setQuickCustData] = useState({ name: '', phone: '' });

  // Settle Pending Payment Modal State
  const [settleVisit, setSettleVisit] = useState(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState('cash');
  const [settleAmountPaid, setSettleAmountPaid] = useState('');
  const [settling, setSettling] = useState(false);

  // Create Visit Form State
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [gstPercent, setGstPercent] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percent'
  const [discountInput, setDiscountInput] = useState(0);
  const [nextAppointmentDate, setNextAppointmentDate] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [appointmentId, setAppointmentId] = useState(null);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle location state pre-filling (e.g. from Complete Visit button in Appointments)
  useEffect(() => {
    if (location.state?.createVisit) {
      const state = location.state;
      setIsVisitModalOpen(true);
      if (state.customerId) setSelectedCustomerId(state.customerId);
      if (state.staffId) setSelectedStaffId(state.staffId);
      if (state.appointmentId) setAppointmentId(state.appointmentId);
      if (state.prefillItems && Array.isArray(state.prefillItems)) {
        setItems(state.prefillItems);
      }
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [visRes, custRes, servRes, prodRes, staffRes] = await Promise.all([
        client.get('/visits'),
        client.get('/customers'),
        client.get('/services'),
        client.get('/products'),
        client.get('/staff'),
      ]);

      setVisits(visRes.data || []);
      setCustomers(custRes.data || []);
      setServices(servRes.data || []);
      setProducts(prodRes.data || []);
      setStaff(staffRes.data || []);
    } catch (err) {
      showError('Failed to load customer visits data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!quickCustData.name) return showError('Customer name is required');
    try {
      const res = await client.post('/customers', quickCustData);
      showSuccess('Customer registered successfully');
      setCustomers((prev) => [res.data, ...prev]);
      setSelectedCustomerId(res.data.id);
      setShowQuickAddCust(false);
      setQuickCustData({ name: '', phone: '' });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to register new client');
    }
  };

  const handleAddServiceItem = (serviceId) => {
    const s = services.find((srv) => srv.id === serviceId);
    if (!s) return;
    setItems((prev) => [
      ...prev,
      {
        type: 'service',
        id: s.id,
        name: s.name,
        unitPrice: Number(s.price),
        quantity: 1,
        discount: 0,
        staffId: selectedStaffId || '',
        commissionPercent: Number(s.commission_percent || 0),
      },
    ]);
  };

  const handleAddProductItem = (productId) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    if (Number(p.stock_quantity || 0) <= 0) {
      return showError(`"${p.name}" is completely out of stock!`);
    }
    setItems((prev) => [
      ...prev,
      {
        type: 'product',
        id: p.id,
        name: p.name,
        unitPrice: Number(p.selling_price),
        quantity: 1,
        discount: 0,
        staffId: selectedStaffId || '',
        commissionPercent: 0,
      },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute Totals
  const rawSubtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.unitPrice || 0);
    const disc = Number(item.discount || 0);
    return sum + price * qty - disc;
  }, 0);

  const discountAmount =
    discountType === 'percent' ? (rawSubtotal * Number(discountInput || 0)) / 100 : Number(discountInput || 0);

  const taxableAmount = Math.max(0, rawSubtotal - discountAmount);
  const gstAmount = (taxableAmount * Number(gstPercent || 0)) / 100;
  const netTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

  const actualAmountPaid =
    amountPaidInput !== undefined && amountPaidInput !== null && amountPaidInput !== ''
      ? Number(amountPaidInput)
      : paymentMethod === 'pending'
      ? 0
      : netTotal;

  const remainingBalance = Math.max(0, netTotal - (paymentMethod === 'pending' ? 0 : actualAmountPaid));

  const handleSaveVisit = async (e) => {
    e.preventDefault();
    if (!items.length) return showError('Please add at least one service or product item');

    try {
      setSubmitting(true);
      const payload = {
        customerId: selectedCustomerId || null,
        staffId: selectedStaffId || null,
        appointmentId: appointmentId || null,
        gstPercent: Number(gstPercent || 0),
        discount: discountAmount,
        paymentMethod,
        amountPaid: paymentMethod === 'pending' ? 0 : actualAmountPaid,
        nextAppointmentDate: nextAppointmentDate || null,
        notes: visitNotes || null,
        items,
      };

      const res = await client.post('/visits', payload);
      showSuccess(`Customer Visit #${res.data.visit_number || ''} recorded successfully!`);

      setIsVisitModalOpen(false);
      resetForm();
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save customer visit');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedStaffId('');
    setPaymentMethod('cash');
    setAmountPaidInput('');
    setGstPercent(0);
    setDiscountType('fixed');
    setDiscountInput(0);
    setNextAppointmentDate('');
    setVisitNotes('');
    setAppointmentId(null);
    setItems([]);
  };

  const handleSettlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!settleVisit) return;
    try {
      setSettling(true);
      await client.put(`/visits/${settleVisit.id}/payment`, {
        paymentMethod: settlePaymentMethod,
        amountPaid: settleAmountPaid,
      });
      showSuccess(`Payment updated for Visit #${settleVisit.visit_number}`);
      setSettleVisit(null);
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchData();
    } catch (err) {
      showError('Failed to update payment method');
    } finally {
      setSettling(false);
    }
  };

  const filteredVisits = visits.filter(
    (v) =>
      v.visit_number.toLowerCase().includes(search.toLowerCase()) ||
      (v.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.customer_phone || '').includes(search) ||
      (v.staff_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.payment_method || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.payment_status || '').toLowerCase().includes(search.toLowerCase())
  );

  const itemsPerPage = 8;
  const paginatedData = filteredVisits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Visit Details',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-dark">{row.visit_number}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                row.payment_status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : row.payment_status === 'Partial'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {row.payment_status || (row.payment_method === 'pending' ? 'Pending' : 'Paid')}
            </span>
          </div>
          <span className="text-[11px] text-dark/40 block mt-0.5">
            📅 {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at{' '}
            {new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer Name',
      render: (row) => (
        <div>
          <p className="font-semibold text-dark text-xs">{row.customer_name || 'Walk-in Customer'}</p>
          <span className="text-[11px] text-dark/40">{row.customer_phone || 'No phone'}</span>
        </div>
      ),
    },
    {
      header: 'Stylist / Staff',
      render: (row) => (
        <span className="text-xs text-dark font-medium">{row.staff_name || 'Salon Team'}</span>
      ),
    },
    {
      header: 'Payment Status',
      render: (row) => (
        <div>
          <span className="text-xs text-dark font-bold uppercase block">
            💳 {row.payment_method || 'cash'}
          </span>
          {Number(row.remaining_amount || 0) > 0 ? (
            <span className="text-[11px] text-amber-700 font-bold block">
              Remaining: ₹{Number(row.remaining_amount).toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="text-[11px] text-emerald-600 font-medium block">Fully Cleared</span>
          )}
        </div>
      ),
    },
    {
      header: 'Net Total (₹)',
      render: (row) => (
        <div>
          <span className="font-display text-sm font-bold text-dark block">
            ₹{Number(row.total).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-dark/40">Paid: ₹{Number(row.amount_paid || row.total).toLocaleString('en-IN')}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/visits/${row.id}`)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#D4AF37] hover:text-white text-dark/70 transition-all font-semibold text-xs flex items-center gap-1"
            title="View Visit Summary"
          >
            <Eye size={13} /> View Visit
          </button>
          {(row.payment_status === 'Pending' || row.payment_status === 'Partial' || Number(row.remaining_amount || 0) > 0) && (
            <button
              onClick={() => {
                setSettleVisit(row);
                setSettlePaymentMethod('cash');
                setSettleAmountPaid(row.remaining_amount || row.total);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all font-bold text-xs shadow-sm flex items-center gap-1"
              title="Clear Pending Payment"
            >
              <CheckCircle size={13} /> Settle
            </button>
          )}
        </div>
      ),
    },
  ];

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(custSearch))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark flex items-center gap-2">
            <CalendarCheck size={26} className="text-[#D4AF37]" /> Customer Visits
          </h1>
          <p className="text-xs text-dark/50">Record customer visits, services, product sales, and payment collections</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsVisitModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> Create Customer Visit
        </button>
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search Visit #, customer name, phone, stylist..."
        primaryAction={{
          label: 'Create Customer Visit',
          icon: Plus,
          onClick: () => {
            resetForm();
            setIsVisitModalOpen(true);
          },
        }}
        pagination={{
          currentPage,
          totalPages: Math.ceil(filteredVisits.length / itemsPerPage) || 1,
          onPageChange: setCurrentPage,
          totalItems: filteredVisits.length,
          itemsPerPage,
        }}
      />

      {/* CREATE CUSTOMER VISIT MODAL */}
      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        title="Create Customer Visit"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveVisit} className="space-y-6 text-xs">
          {/* Customer & Staff Selection Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F4F0E6]/50 border border-[#E8DFCF]">
            {/* Customer Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-dark/80 flex items-center gap-1">
                  <User size={14} className="text-[#D4AF37]" /> Select Customer *
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCust(true)}
                  className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-0.5"
                >
                  <UserPlus size={12} /> + Register New Client
                </button>
              </div>

              <input
                type="text"
                placeholder="Type customer name or phone to filter..."
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs mb-1.5 focus:outline-none focus:border-[#D4AF37]"
              />

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Walk-in / Direct Client</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Stylist / Staff Picker */}
            <div>
              <label className="block font-bold text-dark/80 mb-1 flex items-center gap-1">
                <Scissors size={14} className="text-[#D4AF37]" /> Assigned Stylist / Staff *
              </label>
              <select
                required
                value={selectedStaffId}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                  // Update items assigned staff if not individually selected
                  setItems((prev) =>
                    prev.map((item) => ({ ...item, staffId: item.staffId || e.target.value }))
                  );
                }}
                className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37] mt-7"
              >
                <option value="">Select Stylist / Team Member...</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.phone || 'Stylist'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service & Product Item Selector Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Add Services Dropdown */}
            <div>
              <label className="block font-bold text-dark/80 mb-1.5 flex items-center gap-1">
                <Scissors size={14} className="text-[#D4AF37]" /> Add Service to Visit
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddServiceItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-semibold focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Choose Service from Menu...</option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} — ₹{srv.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Products Dropdown */}
            <div>
              <label className="block font-bold text-dark/80 mb-1.5 flex items-center gap-1">
                <Package size={14} className="text-[#D4AF37]" /> Add Retail Product to Visit
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddProductItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-semibold focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Choose Retail Product...</option>
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id} disabled={prod.stock_quantity <= 0}>
                    {prod.name} — ₹{prod.selling_price} ({prod.stock_quantity} in stock)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Items Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-dark border-b border-[#E8DFCF] pb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#D4AF37]" /> Visit Services & Products
            </h4>

            {items.length === 0 ? (
              <div className="py-8 text-center text-dark/40 italic bg-gray-50 rounded-2xl border border-dashed border-[#E8DFCF]">
                No services or products selected yet. Use the dropdowns above to add items to this visit.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-2xl bg-white border border-[#E8DFCF] gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.type === 'service' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="font-bold text-dark">{item.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <div>
                        <label className="text-[10px] text-dark/50 block">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 px-2 py-1 bg-white border border-[#E8DFCF] rounded-lg text-center font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-dark/50 block">Price (₹)</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-white border border-[#E8DFCF] rounded-lg text-right font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-dark/50 block">Assigned Staff</label>
                        <select
                          value={item.staffId}
                          onChange={(e) => handleItemChange(idx, 'staffId', e.target.value)}
                          className="px-2 py-1 bg-white border border-[#E8DFCF] rounded-lg text-xs"
                        >
                          <option value="">Primary Staff</option>
                          {staff.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-dark/50 block">Total</span>
                        <span className="font-bold text-dark font-mono">
                          ₹{(Number(item.unitPrice) * Number(item.quantity || 1) - Number(item.discount || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing & Payment Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left: Discounts, GST & Notes */}
            <div className="space-y-3 p-4 rounded-2xl bg-gray-50 border border-[#E8DFCF]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-dark/70 mb-1">Discount Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`flex-1 py-1.5 rounded-xl font-bold ${
                        discountType === 'fixed' ? 'bg-[#D4AF37] text-white' : 'bg-white border border-[#E8DFCF]'
                      }`}
                    >
                      Flat ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`flex-1 py-1.5 rounded-xl font-bold ${
                        discountType === 'percent' ? 'bg-[#D4AF37] text-white' : 'bg-white border border-[#E8DFCF]'
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-dark/70 mb-1">Discount Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl font-bold text-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-dark/70 mb-1">GST Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark"
                  />
                </div>

                <div>
                  <label className="block font-bold text-dark/70 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={nextAppointmentDate}
                    onChange={(e) => setNextAppointmentDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Visit Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Optional notes for this customer visit..."
                  className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark"
                />
              </div>
            </div>

            {/* Right: Payment Method & Payment Calculation Summary */}
            <div className="p-4 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF] space-y-3">
              <h4 className="font-bold text-dark border-b border-[#E8DFCF] pb-1.5 text-xs uppercase tracking-wider">
                Payment Collection
              </h4>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Payment Method *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['cash', 'upi', 'card', 'pending'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pm);
                        if (pm === 'pending') setAmountPaidInput(0);
                      }}
                      className={`py-2 rounded-xl font-bold uppercase text-[11px] transition-all ${
                        paymentMethod === pm
                          ? pm === 'pending'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-[#D4AF37] text-white shadow-md'
                          : 'bg-white text-dark/70 border border-[#E8DFCF]'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'pending' && (
                <div>
                  <label className="block font-bold text-dark/70 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    placeholder={`Full Amount: ₹${netTotal}`}
                    className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark font-bold text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}

              {/* Subtotal & Balance Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-[#E8DFCF] text-xs">
                <div className="flex justify-between text-dark/70">
                  <span>Subtotal:</span>
                  <span className="font-bold font-mono">₹{rawSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-bold font-mono">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {gstAmount > 0 && (
                  <div className="flex justify-between text-dark/70">
                    <span>GST ({gstPercent}%):</span>
                    <span className="font-bold font-mono">+ ₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-dark text-base pt-1 border-t border-[#E8DFCF]">
                  <span>Visit Total:</span>
                  <span className="font-display text-emerald-800">₹{netTotal.toLocaleString('en-IN')}</span>
                </div>
                {remainingBalance > 0 && (
                  <div className="flex justify-between font-bold text-red-600 text-xs pt-1">
                    <span>Remaining Balance (Pending):</span>
                    <span>₹{remainingBalance.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsVisitModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-bold hover:bg-[#C59F2E] flex items-center gap-2 shadow-md"
            >
              <CheckCircle size={16} /> {submitting ? 'Saving Visit...' : 'Save Customer Visit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK REGISTER CLIENT MODAL */}
      <Modal isOpen={showQuickAddCust} onClose={() => setShowQuickAddCust(false)} title="Register New Customer">
        <form onSubmit={handleQuickAddCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-dark/70 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={quickCustData.name}
              onChange={(e) => setQuickCustData({ ...quickCustData, name: e.target.value })}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
          </div>
          <div>
            <label className="block font-bold text-dark/70 mb-1">Phone Number</label>
            <input
              type="text"
              value={quickCustData.phone}
              onChange={(e) => setQuickCustData({ ...quickCustData, phone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setShowQuickAddCust(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold">
              Save Client
            </button>
          </div>
        </form>
      </Modal>

      {/* SETTLE / CLEAR PAYMENT MODAL */}
      <Modal isOpen={!!settleVisit} onClose={() => setSettleVisit(null)} title="Settle Pending Visit Payment">
        {settleVisit && (
          <form onSubmit={handleSettlePaymentSubmit} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2">
                <span className="font-bold text-amber-900 font-mono">Visit #{settleVisit.visit_number}</span>
                <span className="text-amber-700 font-semibold">{settleVisit.customer_name || 'Walk-in Client'}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-amber-900">
                <span>Remaining Balance Due:</span>
                <span>₹{Number(settleVisit.remaining_amount || settleVisit.total).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-dark/70 mb-1">Payment Method Received *</label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'upi', 'card'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setSettlePaymentMethod(pm)}
                    className={`py-2 rounded-xl font-bold uppercase transition-all ${
                      settlePaymentMethod === pm
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
              <label className="block font-bold text-dark/70 mb-1">Amount Paid Now (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={settleAmountPaid}
                onChange={(e) => setSettleAmountPaid(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl font-bold text-dark text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
              <button
                type="button"
                onClick={() => setSettleVisit(null)}
                className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={settling}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5"
              >
                <CheckCircle size={15} /> {settling ? 'Updating Payment...' : 'Mark as Paid'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
