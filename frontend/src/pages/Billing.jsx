import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Receipt, Plus, Trash2, User, Scissors, Package, CreditCard, Printer, Eye, Search, Sparkles, UserPlus, CheckCircle, Clock } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Billing() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [invoices, setInvoices] = useState([]);
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

  // Settle Pending Payment Modal
  const [settleInvoice, setSettleInvoice] = useState(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState('cash');
  const [settling, setSettling] = useState(false);

  // Billing Form State
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceivedInput, setAmountReceivedInput] = useState('');
  const [gstPercent, setGstPercent] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percent'
  const [discountInput, setDiscountInput] = useState(0);
  const [nextAppointmentDate, setNextAppointmentDate] = useState('');

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes, servRes, prodRes, staffRes] = await Promise.all([
        client.get('/billing'),
        client.get('/customers'),
        client.get('/services'),
        client.get('/products'),
        client.get('/staff'),
      ]);

      setInvoices(invRes.data || []);
      setCustomers(custRes.data || []);
      setServices(servRes.data || []);
      setProducts(prodRes.data || []);
      setStaff(staffRes.data || []);
    } catch (err) {
      showError('Failed to load POS billing data');
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
      showError('Failed to register new client');
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
        commissionPercent: Number(s.commission_percent || 15),
      },
    ]);
  };

  const handleAddProductItem = (productId) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    if (Number(p.stock_quantity || 0) <= 0) {
      return showError(`"${p.name}" is out of stock!`);
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
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' && item.type === 'product') {
            const prod = products.find((p) => p.id === item.id);
            if (prod && Number(value) > Number(prod.stock_quantity || 0)) {
              showError(`Only ${prod.stock_quantity} units available for ${prod.name}`);
              updated.quantity = Number(prod.stock_quantity || 1);
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Computations
  const subtotal = items.reduce((acc, curr) => {
    const itemDiscount = Number(curr.discount || 0);
    const line = Number(curr.unitPrice) * Number(curr.quantity || 1) - itemDiscount;
    return acc + Math.max(0, line);
  }, 0);

  const rawDiscount = Number(discountInput || 0);
  const billDiscount = discountType === 'percent' ? (subtotal * rawDiscount) / 100 : rawDiscount;
  const taxableAmount = Math.max(0, subtotal - billDiscount);
  const gstAmount = (taxableAmount * Number(gstPercent || 0)) / 100;
  const grandTotal = taxableAmount + gstAmount;

  // Cash Return (Change) Calculation
  const amountReceivedVal = amountReceivedInput !== '' ? Number(amountReceivedInput) : grandTotal;
  const changeReturnedVal = Math.max(0, amountReceivedVal - grandTotal);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!items.length) return showError('Please add at least one service or product item');

    try {
      const payload = {
        customerId: selectedCustomerId || null,
        staffId: selectedStaffId || null,
        gstPercent: Number(gstPercent),
        discount: billDiscount,
        paymentMethod,
        amountReceived: amountReceivedVal,
        nextAppointmentDate: nextAppointmentDate || null,
        items,
      };

      const res = await client.post('/billing', payload);
      showSuccess(`Invoice ${res.data.invoice_number} created successfully!`);
      setIsPOSOpen(false);
      setItems([]);
      setAmountReceivedInput('');
      setDiscountInput(0);
      setGstPercent(0);
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchBillingData();
      navigate(`/billing/${res.data.id}`);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create tax invoice');
    }
  };

  // Clear Payment / Mark as Paid
  const handleSettlePayment = async () => {
    if (!settleInvoice) return;
    try {
      setSettling(true);
      await client.put(`/billing/${settleInvoice.id}/payment`, { paymentMethod: settlePaymentMethod });
      showSuccess(`Payment for ${settleInvoice.invoice_number} cleared successfully!`);
      setSettleInvoice(null);
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchBillingData();
    } catch (err) {
      showError('Failed to clear payment');
    } finally {
      setSettling(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = search.toLowerCase();
    return (
      (inv.invoice_number || '').toLowerCase().includes(term) ||
      (inv.customer_name || '').toLowerCase().includes(term) ||
      (inv.payment_method || '').toLowerCase().includes(term)
    );
  });

  const itemsPerPage = 8;
  const paginatedData = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Invoice # & Timestamp',
      render: (row) => {
        const d = new Date(row.created_at || Date.now());
        const payDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const payTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return (
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] shrink-0">
              <Receipt size={18} />
            </div>
            <div>
              <p className="font-bold text-dark">{row.invoice_number}</p>
              <p className="text-xs text-dark/70 font-medium">📅 {payDate}</p>
              <p className="text-[11px] font-semibold text-[#D4AF37]">⏰ {payTime}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Client',
      render: (row) => (
        <p className="font-semibold text-dark">{row.customer_name || 'Walk-in Client'}</p>
      ),
    },
    {
      header: 'Primary Stylist',
      render: (row) => (
        <span className="text-xs font-medium text-dark/70 bg-white px-3 py-1 rounded-full border border-[#E8DFCF]">
          {row.staff_name || 'Product / Walk-in'}
        </span>
      ),
    },
    {
      header: 'Payment Status',
      render: (row) => {
        const isPending = (row.payment_method || '').toLowerCase() === 'pending';
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                isPending
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isPending ? '⌛ PENDING' : row.payment_method || 'Cash'}
            </span>

            {isPending && (
              <button
                onClick={() => {
                  setSettleInvoice(row);
                  setSettlePaymentMethod('cash');
                }}
                className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-all shadow-xs flex items-center gap-1"
              >
                <CheckCircle size={11} /> Clear Payment
              </button>
            )}
          </div>
        );
      },
    },
    {
      header: 'Bill Amount / Net Sale',
      render: (row) => (
        <div>
          <span className="font-display text-base font-bold text-dark block">
            ₹{Number(row.total).toLocaleString('en-IN')}
          </span>
          {Number(row.change_returned || 0) > 0 && (
            <span className="text-[10px] text-emerald-600 font-semibold block">
              Change: ₹{Number(row.change_returned).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => navigate(`/billing/${row.id}`)}
          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#F4F0E6] text-dark font-semibold text-xs hover:bg-[#D4AF37] hover:text-white transition-colors"
        >
          <Eye size={14} /> View Tax Invoice
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark flex items-center gap-2">
            <Receipt size={24} className="text-[#D4AF37]" /> POS Billing & Tax Invoices
          </h1>
          <p className="text-xs text-dark/50">Generate professional tax invoices, clear pending bills & calculate customer change</p>
        </div>

        <button
          onClick={() => {
            setItems([]);
            setIsPOSOpen(true);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md"
        >
          <Sparkles size={16} /> Create New POS Invoice
        </button>
      </div>

      {/* Invoice History Table */}
      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoice #, client name, or payment method..."
        pagination={{
          currentPage,
          totalPages: Math.ceil(filteredInvoices.length / itemsPerPage) || 1,
          onPageChange: setCurrentPage,
          totalItems: filteredInvoices.length,
          itemsPerPage,
        }}
      />

      {/* POS Billing Terminal Modal */}
      <Modal isOpen={isPOSOpen} onClose={() => setIsPOSOpen(false)} title="TRIO POS Billing Terminal">
        <form onSubmit={handleCreateInvoice} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          {/* Top Selection Bar: Client & Stylist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F4F0E6]/50 p-4 rounded-2xl border border-[#E8DFCF]">
            {/* Customer Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-dark/70">Select Client</label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCust(!showQuickAddCust)}
                  className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  <UserPlus size={12} /> Quick Add Client
                </button>
              </div>

              {showQuickAddCust ? (
                <div className="p-3 bg-white rounded-xl border border-[#E8DFCF] space-y-2">
                  <input
                    type="text"
                    placeholder="Client Name *"
                    value={quickCustData.name}
                    onChange={(e) => setQuickCustData({ ...quickCustData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#E8DFCF] rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={quickCustData.phone}
                    onChange={(e) => setQuickCustData({ ...quickCustData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#E8DFCF] rounded-lg"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCust(false)}
                      className="px-2.5 py-1 text-[10px] text-dark/60 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddCustomer}
                      className="px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-lg"
                    >
                      Save Client
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-xs text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Walk-in Client (Guest)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Primary Stylist Picker */}
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Attended Stylist / Staff</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-xs text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Assigned Primary Stylist</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.phone || 'Stylist'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service & Product Quick Add Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1 flex items-center gap-1">
                <Scissors size={14} className="text-purple-600" /> Add Salon Service Item
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleAddServiceItem(e.target.value);
                  e.target.value = '';
                }}
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-medium text-dark focus:outline-none"
              >
                <option value="">+ Choose Service from Menu</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₹{s.price} ({s.duration_minutes}m)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1">
                <Package size={14} className="text-amber-600" /> Add Retail Product Item
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleAddProductItem(e.target.value);
                  e.target.value = '';
                }}
                className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-medium text-dark focus:outline-none"
              >
                <option value="">+ Choose Product from Stock</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.selling_price} (Stock: {p.stock_quantity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Items Line Table */}
          <div className="border border-[#E8DFCF] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F0E6] text-dark/70 font-semibold border-b border-[#E8DFCF]">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 w-20">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Discount (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFCF]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-dark/40 italic">
                      No items added yet. Select services or products above!
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const lineTotal = Math.max(
                      0,
                      Number(item.unitPrice) * Number(item.quantity || 1) - Number(item.discount || 0)
                    );
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-semibold text-dark">{item.name}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                              item.type === 'service' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                            className="w-14 px-2 py-1 text-center bg-white border border-[#E8DFCF] rounded-lg font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => handleUpdateItem(idx, 'discount', e.target.value)}
                            className="w-16 px-2 py-1 text-right bg-white border border-[#E8DFCF] rounded-lg text-dark"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-dark">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Method & Cash Received Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark/70 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {['cash', 'upi', 'card', 'pending'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase transition-all ${
                        paymentMethod === method
                          ? method === 'pending'
                            ? 'bg-amber-600 text-white shadow-sm font-bold'
                            : 'bg-[#D4AF37] text-white shadow-sm font-bold'
                          : 'bg-[#F4F0E6] text-dark/70 border border-[#E8DFCF]'
                      }`}
                    >
                      {method === 'pending' ? '⌛ PENDING' : method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Received / Cash Return Input */}
              <div>
                <label className="block text-xs font-semibold text-dark/70 mb-1">
                  Customer Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={amountReceivedInput}
                  onChange={(e) => setAmountReceivedInput(e.target.value)}
                  placeholder={`e.g. ${grandTotal > 0 ? grandTotal : 500}`}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-bold text-sm focus:outline-none focus:border-[#D4AF37]"
                />
                {amountReceivedInput !== '' && Number(amountReceivedInput) > grandTotal && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs mt-2">
                    <div className="flex justify-between items-center text-emerald-900 font-bold">
                      <span>Change Returned (Cash):</span>
                      <span className="font-display text-base text-emerald-700 font-mono">
                        ₹{changeReturnedVal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Net Sale = ₹{grandTotal.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark/70 mb-1">Next Appointment Date (Optional)</label>
                <input
                  type="date"
                  value={nextAppointmentDate}
                  onChange={(e) => setNextAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl text-xs text-dark"
                />
              </div>
            </div>

            {/* Total Calculation Summary Card */}
            <div className="p-5 rounded-2xl bg-[#F4F0E6]/80 border border-[#E8DFCF] space-y-3">
              <div className="flex justify-between text-xs text-dark/70">
                <span>Subtotal</span>
                <span className="font-semibold text-dark">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Discount Section with Fixed vs Percent Toggle */}
              <div className="space-y-1.5 pt-1 border-t border-[#E8DFCF]/60">
                <div className="flex justify-between items-center text-xs text-dark/70">
                  <span className="font-semibold">Bill Discount</span>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E8DFCF]">
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        discountType === 'fixed' ? 'bg-[#D4AF37] text-white' : 'text-dark/60 hover:text-dark'
                      }`}
                    >
                      ₹ Fixed
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        discountType === 'percent' ? 'bg-[#D4AF37] text-white' : 'text-dark/60 hover:text-dark'
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-dark/50">
                    {discountType === 'percent' ? 'Discount Rate (%)' : 'Discount Amount (₹)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder="0"
                      className="w-24 px-2 py-1 text-right bg-white border border-[#E8DFCF] rounded-lg font-semibold text-dark"
                    />
                    {discountType === 'percent' && (
                      <span className="text-dark/60 font-semibold text-xs">
                        (-₹{billDiscount.toLocaleString('en-IN')})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* GST Tax Rate Section */}
              <div className="space-y-1.5 pt-1 border-t border-[#E8DFCF]/60">
                <div className="flex justify-between items-center text-xs text-dark/70">
                  <span>GST Tax Rate (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    className="w-20 px-2 py-1 text-right bg-white border border-[#E8DFCF] rounded-lg font-semibold text-dark"
                  />
                </div>
                <div className="flex justify-between text-xs text-dark/70">
                  <span>GST Tax Amount</span>
                  <span className="font-semibold text-dark">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="my-2 h-px bg-[#E8DFCF]" />
              <div className="flex justify-between text-base font-bold text-dark">
                <span>Grand Total / Net Sale</span>
                <span className="font-display text-xl text-[#D4AF37]">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsPOSOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold text-xs hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!items.length}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-bold text-xs hover:bg-[#C59F2E] transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <Printer size={16} /> Complete & Generate Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Settle Pending Payment Modal */}
      <Modal isOpen={!!settleInvoice} onClose={() => setSettleInvoice(null)} title="Clear Pending Payment">
        {settleInvoice && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <p className="font-bold text-sm">{settleInvoice.invoice_number}</p>
              <p className="text-xs">Client: <span className="font-semibold">{settleInvoice.customer_name || 'Walk-in'}</span></p>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-200">
                <span>Bill Amount to Collect:</span>
                <span className="font-display text-lg font-bold text-amber-800">
                  ₹{Number(settleInvoice.total).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-dark/70 mb-1.5">Select Received Payment Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'upi', 'card'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSettlePaymentMethod(method)}
                    className={`py-2.5 rounded-xl font-bold uppercase transition-all ${
                      settlePaymentMethod === method
                        ? 'bg-[#D4AF37] text-white shadow-md'
                        : 'bg-[#F4F0E6] text-dark/70 border border-[#E8DFCF]'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-dark/50 italic">
              * Clearing this payment will immediately change status to <span className="font-bold text-emerald-700">Paid ({settlePaymentMethod.toUpperCase()})</span>, record current date & time, and add ₹{Number(settleInvoice.total).toLocaleString('en-IN')} to Today's Revenue automatically.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
              <button
                type="button"
                onClick={() => setSettleInvoice(null)}
                className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSettlePayment}
                disabled={settling}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <CheckCircle size={15} /> {settling ? 'Clearing...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
