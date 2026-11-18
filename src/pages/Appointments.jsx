import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Calendar as CalendarIcon, Clock, Plus, Filter, Search, CheckCircle, XCircle, UserCheck, AlertCircle, UserPlus, Edit3, Trash2 } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString } from '../utils/dateUtils.js';

export default function Appointments() {
  const { showSuccess, showError } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Quick Client Search & Creation
  const [custSearch, setCustSearch] = useState('');
  const [showQuickAddCust, setShowQuickAddCust] = useState(false);
  const [quickCustData, setQuickCustData] = useState({ name: '', phone: '' });

  // Multi-Service Selection State
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Complete Appointment Payment Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeAppt, setCompleteAppt] = useState(null);
  const [completeCustomerId, setCompleteCustomerId] = useState('');
  const [completeStaffId, setCompleteStaffId] = useState('');
  const [completeServiceId, setCompleteServiceId] = useState('');
  const [completeServiceName, setCompleteServiceName] = useState('');
  const [completeUnitPrice, setCompleteUnitPrice] = useState(0);
  const [completePaymentMethod, setCompletePaymentMethod] = useState('cash');
  const [completeAmountPaid, setCompleteAmountPaid] = useState('');
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    staffId: '',
    appointmentDate: getTodayDateString(),
    appointmentTime: '10:00',
    status: 'booked',
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, custRes, servRes, staffRes] = await Promise.all([
        client.get('/appointments', { params: { date: selectedDate, status: statusFilter } }),
        client.get('/customers'),
        client.get('/services'),
        client.get('/staff'),
      ]);

      setAppointments(appRes.data || []);
      setCustomers(custRes.data || []);
      setServices(servRes.data || []);
      setStaff(staffRes.data || []);
    } catch (err) {
      showError('Failed to load appointments data');
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
      setFormData((prev) => ({ ...prev, customerId: res.data.id }));
      setShowQuickAddCust(false);
      setQuickCustData({ name: '', phone: '' });
    } catch (err) {
      showError('Failed to register new client');
    }
  };

  const toggleServiceSelect = (serviceId) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!formData.appointmentDate || !formData.appointmentTime) {
      return showError('Please specify appointment date and time');
    }
    if (!selectedServiceIds.length) {
      return showError('Please select at least one service');
    }

    try {
      const selectedServicesList = services.filter((s) => selectedServiceIds.includes(s.id));
      const totalP = selectedServicesList.reduce((sum, s) => sum + Number(s.price || 0), 0);
      const totalD = selectedServicesList.reduce((sum, s) => sum + Number(s.duration_minutes || 30), 0);
      const names = selectedServicesList.map((s) => s.name).join(', ');

      const custObj = customers.find((c) => String(c.id) === String(formData.customerId));

      const payload = {
        customerId: formData.customerId || null,
        customer_name: custObj ? custObj.name : 'Walk-in Client',
        customer_phone: custObj ? custObj.phone : '',
        staffId: formData.staffId || null,
        service_ids: selectedServiceIds,
        service_id: selectedServiceIds[0] || null,
        service_name: names,
        service_price: totalP,
        duration_minutes: totalD,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        status: 'booked',
      };

      await client.post('/appointments', payload);
      showSuccess('Appointment booked successfully!');
      window.dispatchEvent(new CustomEvent('appointment_updated'));
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      setIsModalOpen(false);
      setSelectedServiceIds([]);
      setFormData({
        customerId: '',
        serviceId: '',
        staffId: '',
        appointmentDate: getTodayDateString(),
        appointmentTime: '10:00',
        status: 'booked',
      });
      fetchData();
    } catch (err) {
      showError('Failed to book appointment');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await client.put(`/appointments/${id}`, { status: newStatus });
      showSuccess(`Appointment marked as ${newStatus.replace('_', ' ')}`);
      window.dispatchEvent(new CustomEvent('appointment_updated'));
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchData();
    } catch (err) {
      showError('Failed to update status');
    }
  };

  const openEditModal = (app) => {
    setSelectedAppointment(app);
    setFormData({
      customerId: app.customer_id || '',
      serviceId: app.service_id || '',
      staffId: app.staff_id || '',
      appointmentDate: app.appointment_date ? app.appointment_date.split('T')[0] : getTodayDateString(),
      appointmentTime: app.appointment_time || '10:00',
      status: app.status || 'booked',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      await client.put(`/appointments/${selectedAppointment.id}`, formData);
      showSuccess('Appointment updated successfully!');
      window.dispatchEvent(new CustomEvent('appointment_updated'));
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      showError('Failed to update appointment');
    }
  };

  const confirmDeleteAppointment = async () => {
    if (!deleteConfirmId) return;
    try {
      await client.delete(`/appointments/${deleteConfirmId}`);
      showSuccess('Appointment deleted successfully');
      window.dispatchEvent(new CustomEvent('appointment_updated'));
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      showError('Failed to delete appointment');
    }
  };

  const handleCompleteVisit = (app) => {
    if (!app) return;
    const sIds = app.service_ids || (app.service_id ? [app.service_id] : []);
    const matchedServices = (services || []).filter((s) => sIds.includes(String(s.id)) || sIds.includes(s.id));
    const matchedStaff = (staff || []).find((st) => st && String(st.id) === String(app.staff_id));
    const matchedCust = (customers || []).find((c) => c && String(c.id) === String(app.customer_id));

    let itemsList = [];
    if (matchedServices.length > 0) {
      itemsList = matchedServices.map((srv) => ({
        type: 'service',
        id: srv.id,
        name: srv.name,
        unitPrice: Number(srv.price || 0),
        quantity: 1,
        discount: 0,
        staffId: app.staff_id || '',
        staff_name: app.staff_name || matchedStaff?.name || '',
        commissionPercent: Number(srv.commission_percent || 15),
      }));
    } else {
      itemsList = [
        {
          type: 'service',
          id: app.service_id || 's1',
          name: app.service_name || 'Salon Service',
          unitPrice: Number(app.service_price || 0),
          quantity: 1,
          discount: 0,
          staffId: app.staff_id || '',
          staff_name: app.staff_name || matchedStaff?.name || '',
          commissionPercent: 15,
        },
      ];
    }

    const autoTotalPrice = itemsList.reduce((sum, item) => sum + Number(item.unitPrice || 0), 0);

    setCompleteAppt(app);
    setCompleteCustomerId(app.customer_id || matchedCust?.id || '');
    setCompleteStaffId(app.staff_id || matchedStaff?.id || '');
    setCompleteServiceId(app.service_id || matchedServices[0]?.id || 's1');
    setCompleteServiceName(app.service_name || matchedServices.map((s) => s.name).join(', ') || 'Salon Service');
    setCompleteUnitPrice(autoTotalPrice);
    setCompletePaymentMethod('cash');
    setCompleteAmountPaid(autoTotalPrice);
    setIsCompleteModalOpen(true);
  };

  const handleSaveCompleteVisitSubmit = async (e) => {
    e.preventDefault();
    if (!completeAppt) return;
    if (!completeStaffId) {
      return showError('Please select an assigned stylist for this service');
    }

    try {
      setCompleteSubmitting(true);
      const custObj = (customers || []).find((c) => String(c.id) === String(completeCustomerId));
      const staffObj = (staff || []).find((s) => String(s.id) === String(completeStaffId));

      const visitPayload = {
        appointmentId: completeAppt.id,
        customerId: completeCustomerId || null,
        customer_name: custObj ? custObj.name : (completeAppt.customer_name || 'Walk-in Client'),
        phone: custObj ? custObj.phone : (completeAppt.customer_phone || ''),
        staffId: completeStaffId,
        staff_name: staffObj ? staffObj.name : 'Salon Staff',
        total: completeUnitPrice,
        final_amount: completeUnitPrice,
        subtotal: completeUnitPrice,
        discount: 0,
        paymentMethod: completePaymentMethod,
        amountPaid: completePaymentMethod === 'pending' ? 0 : Number(completeAmountPaid || completeUnitPrice),
        items: [
          {
            type: 'service',
            id: completeServiceId,
            name: completeServiceName,
            unitPrice: completeUnitPrice,
            quantity: 1,
            discount: 0,
            staffId: completeStaffId,
            staff_name: staffObj ? staffObj.name : '',
            commissionPercent: Number(services.find((s) => s.id === completeServiceId)?.commission_percent || 15),
          },
        ],
      };

      // 1. Create visit invoice record
      await client.post('/visits', visitPayload);

      // 2. Mark appointment status as completed
      await client.put(`/appointments/${completeAppt.id}`, { status: 'completed' });

      showSuccess(`Visit completed & ₹${completeUnitPrice} payment recorded!`);
      window.dispatchEvent(new CustomEvent('appointment_updated'));
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      setIsCompleteModalOpen(false);
      fetchData();
    } catch (err) {
      showError('Failed to record visit payment');
    } finally {
      setCompleteSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    const term = search.toLowerCase();
    return (
      (app.customer_name || '').toLowerCase().includes(term) ||
      (app.service_name || '').toLowerCase().includes(term) ||
      (app.staff_name || '').toLowerCase().includes(term)
    );
  });

  // Selected Service Duration & Price Calc
  const selectedService = services.find((s) => s.id === formData.serviceId);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const paginatedData = filteredAppointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Time & Status',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#F4F0E6] text-dark font-mono text-xs font-bold border border-[#E8DFCF]">
            {row.appointment_time}
          </div>
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                row.status === 'in_progress'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : row.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : row.status === 'cancelled'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : row.status === 'no_show'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              {row.status === 'booked' ? 'Upcoming' : row.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Client',
      render: (row) => (
        <div>
          <p className="font-semibold text-dark">{row.customer_name || 'Select Customer / Client'}</p>
          <p className="text-xs text-dark/50">{row.customer_phone || 'No phone'}</p>
        </div>
      ),
    },
    {
      header: 'Service & Duration',
      render: (row) => (
        <div>
          <p className="font-semibold text-dark">{row.service_name || 'Custom Service'}</p>
          <p className="text-xs text-[#D4AF37] font-medium">{row.duration_minutes || 30} mins • ₹{row.service_price || 0}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Stylist',
      render: (row) => (
        <span className="text-xs font-medium text-dark/70 bg-white px-3 py-1 rounded-full border border-[#E8DFCF]">
          {row.staff_name || 'Any Stylist'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Status Action Buttons */}
          {row.status === 'booked' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'in_progress')}
              className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold text-xs hover:bg-purple-600 hover:text-white transition-colors"
              title="Start Appointment Service"
            >
              Start
            </button>
          )}

          {(row.status === 'booked' || row.status === 'in_progress') && (
            <button
              onClick={() => handleCompleteVisit(row)}
              className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1"
              title="Complete Visit & Record Payment"
            >
              Complete Visit
            </button>
          )}

          {(row.status === 'completed' || row.status === 'cancelled' || row.status === 'no_show') && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'booked')}
              className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-600 hover:text-white transition-colors"
              title="Reopen Booking"
            >
              Reopen
            </button>
          )}

          {row.status !== 'completed' && row.status !== 'cancelled' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'cancelled')}
              className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-semibold text-xs hover:bg-red-600 hover:text-white transition-colors"
              title="Cancel Appointment"
            >
              Cancel
            </button>
          )}

          {/* Always Available Edit & Delete Actions */}
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-xl bg-[#F4F0E6] text-dark/70 hover:bg-dark hover:text-white transition-colors"
            title="Edit Appointment"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirmId(row.id)}
            className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            title="Delete Appointment"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">Appointments Schedule</h1>
          <p className="text-xs text-dark/50">Manage luxury salon bookings, slot calendar, and status</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 bg-white border border-[#E8DFCF] rounded-full shadow-xs">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'list' ? 'bg-[#D4AF37] text-white shadow-sm' : 'text-dark/70 hover:text-dark'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'calendar' ? 'bg-[#D4AF37] text-white shadow-sm' : 'text-dark/70 hover:text-dark'
            }`}
          >
            Time Slots
          </button>
        </div>
      </div>

      {/* Date Picker Bar & Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-[#D4AF37]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white border border-[#E8DFCF] rounded-full text-xs font-semibold text-dark focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-[#E8DFCF] rounded-full text-xs font-semibold text-dark focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Statuses</option>
            <option value="booked">Booked</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <button
            onClick={() => {
              setFormData({
                customerId: '',
                serviceId: '',
                staffId: '',
                appointmentDate: selectedDate || getTodayDateString(),
                appointmentTime: '10:00',
                status: 'booked',
              });
              setIsModalOpen(true);
            }}
            className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Table or Calendar View */}
      {viewMode === 'list' ? (
        <Table
          columns={columns}
          data={paginatedData}
          loading={loading}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search client, service, stylist..."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredAppointments.length}
          itemsPerPage={itemsPerPage}
        />
      ) : (
        /* Calendar View Matrix */
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-dark mb-4">
            Daily Time Slots — {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((slot) => {
              const apptsInSlot = appointments.filter((a) => a.appointment_time.startsWith(slot.slice(0, 2)));

              return (
                <div key={slot} className="p-4 rounded-2xl bg-[#F4F0E6]/50 border border-[#E8DFCF]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#D4AF37] flex items-center gap-1">
                      <Clock size={14} /> {slot}
                    </span>
                    <span className="text-[10px] text-dark/40 font-medium">
                      {apptsInSlot.length} Booked
                    </span>
                  </div>

                  {apptsInSlot.length === 0 ? (
                    <p className="text-[11px] text-dark/40 py-2 italic">Slot Available</p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {apptsInSlot.map((app) => (
                        <div key={app.id} className="p-2.5 rounded-xl bg-white border border-[#E8DFCF] shadow-xs flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-xs text-dark">{app.customer_name || 'Walk-in'}</p>
                            <p className="text-[11px] text-[#D4AF37]">{app.service_name}</p>
                            <p className="text-[10px] text-dark/50">Stylist: {app.staff_name || 'Unassigned'}</p>
                          </div>
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 rounded-lg bg-[#F4F0E6] text-dark/70 hover:bg-dark hover:text-white transition-colors"
                            title="Edit Booking"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Appointment Booking">
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-dark/70">Select Client</label>
              <button
                type="button"
                onClick={() => setShowQuickAddCust(!showQuickAddCust)}
                className="text-[11px] font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                <UserPlus size={12} /> {showQuickAddCust ? 'Cancel Quick Add' : '+ Quick Register Client'}
              </button>
            </div>

            {showQuickAddCust ? (
              <div className="p-3 rounded-2xl bg-[#F4F0E6]/80 border border-[#E8DFCF] space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Client Name *"
                  value={quickCustData.name}
                  onChange={(e) => setQuickCustData({ ...quickCustData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E8DFCF] text-xs text-dark"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={quickCustData.phone}
                  onChange={(e) => setQuickCustData({ ...quickCustData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E8DFCF] text-xs text-dark"
                />
                <button
                  type="button"
                  onClick={handleQuickAddCustomer}
                  className="w-full py-1.5 rounded-xl bg-[#D4AF37] text-white font-semibold text-xs"
                >
                  Save & Select Client
                </button>
              </div>
            ) : (
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">-- Choose Existing Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-dark/80 mb-1.5 flex items-center justify-between">
              <span>Select Service(s) * <span className="text-dark/40 font-normal">(Select 1 or more)</span></span>
              {selectedServiceIds.length > 0 && (
                <span className="text-[#D4AF37] text-[11px] font-bold">
                  {selectedServiceIds.length} Selected
                </span>
              )}
            </label>

            <div className="max-h-48 overflow-y-auto border border-[#E8DFCF] rounded-2xl p-2 bg-white space-y-1.5 divide-y divide-[#E8DFCF]/50">
              {services.map((srv) => {
                const isSelected = selectedServiceIds.includes(srv.id);
                return (
                  <label
                    key={srv.id}
                    onClick={() => toggleServiceSelect(srv.id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      isSelected ? 'bg-amber-50 border border-amber-200 shadow-xs' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded accent-[#D4AF37] h-4 w-4"
                      />
                      <div>
                        <p className={`text-xs font-semibold ${isSelected ? 'text-dark font-bold' : 'text-dark/80'}`}>
                          {srv.name}
                        </p>
                        <span className="text-[10px] text-dark/40">⏱️ {srv.duration_minutes || 30} mins</span>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-emerald-700">₹{srv.price}</span>
                  </label>
                );
              })}
            </div>

            {selectedServiceIds.length > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#F4F0E6] border border-[#E8DFCF] flex items-center justify-between text-xs">
                <span className="text-dark/70 font-semibold">
                  Duration: {services.filter((s) => selectedServiceIds.includes(s.id)).reduce((acc, s) => acc + Number(s.duration_minutes || 30), 0)} mins
                </span>
                <span className="font-bold text-emerald-800 text-sm">
                  Total Price: ₹{services.filter((s) => selectedServiceIds.includes(s.id)).reduce((acc, s) => acc + Number(s.price || 0), 0)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Assigned Stylist</label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="">-- Any Available Stylist --</option>
              {staff.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Appointment Date</label>
              <input
                type="date"
                required
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Time Slot</label>
              <input
                type="time"
                required
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
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
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Appointment Booking">
        <form onSubmit={handleUpdateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Select Client</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="">-- Select Client --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'No phone'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Select Service</label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="">-- Select Service --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{s.price} ({s.duration_minutes || 30} mins)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Assigned Stylist</label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="">-- Any Available Stylist --</option>
              {staff.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Appointment Date</label>
              <input
                type="date"
                required
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Time Slot</label>
              <input
                type="time"
                required
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Booking Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none font-semibold"
            >
              <option value="booked">Booked (Upcoming)</option>
              <option value="in_progress">In Progress (Started)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
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
              Update Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Visit & Collect Payment Modal */}
      {isCompleteModalOpen && completeAppt && (
        <Modal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          title="Complete Appointment & Collect Payment"
        >
          <form onSubmit={handleSaveCompleteVisitSubmit} className="space-y-4 text-xs">
            {/* Customer & Service Summary Header */}
            <div className="p-4 rounded-2xl bg-[#F4F0E6]/80 border border-[#E8DFCF] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-dark text-sm">
                  {completeAppt.customer_name || 'Walk-in Customer'}
                </span>
                <span className="font-mono text-emerald-800 font-bold text-base">
                  ₹{Number(completeUnitPrice).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[#D4AF37] font-semibold text-xs">
                ✂️ {completeServiceName}
              </p>
            </div>

            {/* Price & Quantity Editable Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-dark/70 mb-1">Service Price (₹)</label>
                <input
                  type="number"
                  value={completeUnitPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setCompleteUnitPrice(val);
                    setCompleteAmountPaid(val);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl font-bold text-dark"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-dark/80 mb-1">
                  Assigned Stylist <span className="text-red-500 font-extrabold">*</span>
                </label>
                <select
                  value={completeStaffId}
                  onChange={(e) => setCompleteStaffId(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-xl font-semibold text-dark focus:outline-none ${
                    !completeStaffId ? 'border-amber-300 ring-2 ring-amber-200' : 'border-[#E8DFCF]'
                  }`}
                  required
                >
                  <option value="">Select Stylist *</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-semibold text-dark/70 mb-1.5">Payment Method *</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'cash', label: '💵 CASH' },
                  { id: 'card', label: '💳 CARD' },
                  { id: 'upi', label: '📲 UPI' },
                  { id: 'advance', label: '⚡ ADVANCE' },
                  { id: 'pending', label: '⏳ PENDING' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setCompletePaymentMethod(pm.id);
                      if (pm.id === 'pending') {
                        setCompleteAmountPaid(0);
                      } else {
                        setCompleteAmountPaid(completeUnitPrice);
                      }
                    }}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center border transition-all ${
                      completePaymentMethod === pm.id
                        ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-xs scale-[1.02]'
                        : 'bg-white text-dark/70 border-[#E8DFCF] hover:bg-[#F4F0E6]'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Paid Input */}
            {completePaymentMethod !== 'pending' && (
              <div>
                <label className="block font-semibold text-dark/70 mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  value={completeAmountPaid}
                  onChange={(e) => setCompleteAmountPaid(e.target.value)}
                  placeholder={`Full Amount: ₹${completeUnitPrice}`}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl font-semibold text-dark"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={completeSubmitting}
                className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {completeSubmitting ? 'Recording Visit Payment...' : `Complete Visit & Collect ₹${completeUnitPrice}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Appointment Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteAppointment}
        title="⚠️ Delete Appointment"
        message="Are you sure you want to delete this appointment booking? This action cannot be undone."
        confirmText="Delete Appointment"
        variant="danger"
      />
    </div>
  );
}
