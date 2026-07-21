import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Receipt, Plus, Trash2, User, Scissors, Package, CreditCard, Printer, Eye, Search, Sparkles, UserPlus } from 'lucide-react';
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

  // Billing Form State
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
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
    if (p.stock_quantity <= 0) {
      return showError(`Product "${p.name}" is out of stock`);
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
        staffId: null, // Products do not require a stylist
        commissionPercent: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemQty = (index, qty) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, Number(qty)) } : item))
    );
  };

  const updateItemDiscount = (index, disc) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, discount: Number(disc) } : item))
    );
  };

  const updateItemStaff = (index, stId) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, staffId: stId } : item))
    );
  };

  // Computations
  const subtotal = items.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity - Number(curr.discount || 0), 0);
  const billDiscount = discountType === 'percent'
    ? (subtotal * Number(discountInput || 0)) / 100
    : Number(discountInput || 0);
  const taxableAmount = Math.max(0, subtotal - billDiscount);
  const gstAmount = (taxableAmount * Number(gstPercent || 0)) / 100;
  const grandTotal = taxableAmount + gstAmount;

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (items.length === 0) return showError('Please add at least one service or product to the bill');

    try {
      const res = await client.post('/billing', {
        customerId: selectedCustomerId || null,
        staffId: selectedStaffId || null,
        gstPercent: Number(gstPercent),
        discount: billDiscount,
        paymentMethod,
        nextAppointmentDate: nextAppointmentDate || null,
        items,
      });

      showSuccess(`Invoice ${res.data.invoice_number} created successfully`);
      setIsPOSOpen(false);
      setItems([]);
      fetchBillingData();
      navigate(`/billing/${res.data.id}`);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create tax invoice');
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
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedData = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Invoice #',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <Receipt size={18} />
          </div>
          <div>
            <p className="font-bold text-dark">{row.invoice_number}</p>
            <p className="text-xs text-dark/50">{new Date(row.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ),
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
      header: 'Payment Method',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
          {row.payment_method || 'Cash'}
        </span>
      ),
    },
    {
      header: 'Grand Total',
      render: (row) => (
        <span className="font-display text-base font-bold text-dark">
          ₹{Number(row.total).toLocaleString('en-IN')}
        </span>
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
          <p className="text-xs text-dark/50">Generate professional tax invoices for Services, Retail Products, or Mixed billing</p>
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
        searchPlaceholder="Search invoice # or customer..."
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredInvoices.length}
        itemsPerPage={itemsPerPage}
      />

      {/* Interactive POS Billing Terminal Modal */}
      <Modal isOpen={isPOSOpen} onClose={() => setIsPOSOpen(false)} title="TRIO THE POSH — POS Billing Terminal" maxWidth="max-w-4xl">
        <form onSubmit={handleCreateInvoice} className="space-y-6">
          {/* Top Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F4F0E6]/60 p-4 rounded-2xl border border-[#E8DFCF]">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-dark/70">Select Customer / Client</label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCust(!showQuickAddCust)}
                  className="text-[11px] font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  <UserPlus size={12} /> {showQuickAddCust ? 'Cancel' : '+ Quick Add Client'}
                </button>
              </div>

              {showQuickAddCust ? (
                <div className="p-3 rounded-2xl bg-white border border-[#E8DFCF] space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Client Name *"
                    value={quickCustData.name}
                    onChange={(e) => setQuickCustData({ ...quickCustData, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F4F0E6]/50 border border-[#E8DFCF] text-xs text-dark"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={quickCustData.phone}
                    onChange={(e) => setQuickCustData({ ...quickCustData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F4F0E6]/50 border border-[#E8DFCF] text-xs text-dark"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCustomer}
                    className="w-full py-1.5 rounded-xl bg-[#D4AF37] text-white font-semibold text-xs"
                  >
                    Save & Attach to Bill
                  </button>
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="">Walk-in / Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Default Primary Stylist (Services)</label>
              <select
                value={selectedStaffId}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                  // Apply to all service items if not specifically set
                  setItems((prev) =>
                    prev.map((it) => (it.type === 'service' ? { ...it, staffId: e.target.value } : it))
                  );
                }}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">Select Stylist (Optional for Product Only)</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Add Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Add Service */}
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5 flex items-center gap-1.5">
                <Scissors size={14} className="text-[#D4AF37]" /> Add Hair / Beauty Service
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddServiceItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">+ Choose Service to Add...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₹{s.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Product */}
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5 flex items-center gap-1.5">
                <Package size={14} className="text-[#D4AF37]" /> Add Retail Product
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddProductItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">+ Choose Product to Add...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.selling_price} (Stock: {p.stock_quantity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#E8DFCF] rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F4F0E6] text-dark/60 font-semibold uppercase border-b border-[#E8DFCF]">
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Stylist</th>
                  <th className="py-3 px-3 text-center">Unit Price</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-center">Discount (₹)</th>
                  <th className="py-3 px-3 text-right">Line Total</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFCF]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-dark/40 italic">
                      No items added to bill yet. Choose a service or retail product above.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const lineTotal = item.unitPrice * item.quantity - Number(item.discount || 0);
                    return (
                      <tr key={index} className="hover:bg-[#F4F0E6]/30">
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1 ${
                              item.type === 'service'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.type === 'service' ? <Scissors size={10} /> : <Package size={10} />}
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-dark">{item.name}</td>
                        <td className="py-3 px-3">
                          {item.type === 'service' ? (
                            <select
                              value={item.staffId || selectedStaffId || ''}
                              onChange={(e) => updateItemStaff(index, e.target.value)}
                              className="px-2 py-1 bg-[#F4F0E6]/60 border border-[#E8DFCF] rounded-lg text-xs text-dark focus:outline-none"
                            >
                              <option value="">Select Stylist</option>
                              {staff.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {st.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 font-medium text-[11px]">
                              Product
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">₹{item.unitPrice}</td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQty(index, e.target.value)}
                            className="w-14 px-2 py-1 border border-[#E8DFCF] rounded-lg text-center font-bold text-dark"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => updateItemDiscount(index, e.target.value)}
                            className="w-20 px-2 py-1 border border-[#E8DFCF] rounded-lg text-center text-dark"
                          />
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-dark">₹{lineTotal.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 p-1"
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

          {/* Payment & Tax Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark/70 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['cash', 'upi', 'card'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase transition-all ${
                        paymentMethod === method
                          ? 'bg-[#D4AF37] text-white shadow-sm'
                          : 'bg-[#F4F0E6] text-dark/70 border border-[#E8DFCF]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Calculation Card */}
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

              {/* GST Tax Rate Section (Default 0%) */}
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
                <span>Grand Total</span>
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
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] text-xs font-semibold text-dark hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-full bg-[#D4AF37] text-white font-bold text-sm hover:bg-[#C59F2E] shadow-md"
            >
              Generate Tax Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
