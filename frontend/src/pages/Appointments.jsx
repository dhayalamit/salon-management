import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Calendar as CalendarIcon, Clock, Plus, Filter, Search, CheckCircle, XCircle, UserCheck, AlertCircle, UserPlus } from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import Modal from '../components/ui/Modal.jsx';
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    staffId: '',
    appointmentDate: getTodayDateString(),
    appointmentTime: '10:00',
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

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!formData.appointmentDate || !formData.appointmentTime) {
      return showError('Please specify appointment date and time');
    }

    try {
      await client.post('/appointments', formData);
      showSuccess('Appointment booked successfully!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError('Failed to book appointment');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await client.put(`/appointments/${id}`, { status: newStatus });
      showSuccess(`Appointment marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      showError('Failed to update status');
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
          {row.status === 'booked' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'in_progress')}
              className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold text-xs hover:bg-purple-600 hover:text-white transition-colors"
            >
              Start
            </button>
          )}
          {(row.status === 'booked' || row.status === 'in_progress') && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'completed')}
              className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs hover:bg-emerald-600 hover:text-white transition-colors"
            >
              Complete
            </button>
          )}
          {row.status !== 'completed' && row.status !== 'cancelled' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'cancelled')}
              className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-semibold text-xs hover:bg-red-600 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          {row.status === 'booked' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'no_show')}
              className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold text-xs hover:bg-amber-600 hover:text-white transition-colors"
            >
              No Show
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">Appointments Schedule</h1>
          <p className="text-xs text-dark/50">Manage luxury salon bookings, slot calendar, and status</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-full bg-white/70 border border-[#E8DFCF] shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'list' ? 'bg-[#D4AF37] text-white shadow-sm' : 'text-dark/60 hover:text-dark'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'calendar' ? 'bg-[#D4AF37] text-white shadow-sm' : 'text-dark/60 hover:text-dark'
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
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
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
                        <div key={app.id} className="p-2.5 rounded-xl bg-white border border-[#E8DFCF] shadow-xs">
                          <p className="font-semibold text-xs text-dark">{app.customer_name || 'Walk-in'}</p>
                          <p className="text-[11px] text-[#D4AF37]">{app.service_name}</p>
                          <p className="text-[10px] text-dark/50">Stylist: {app.staff_name || 'Unassigned'}</p>
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
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Select Service</label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="">-- Select Hair/Beauty Service --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{s.price} ({s.duration_minutes || 30} mins)
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="text-xs text-[#D4AF37] mt-1 font-medium">
                Duration: {selectedService.duration_minutes || 30} mins | Price: ₹{selectedService.price}
              </p>
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
    </div>
  );
}
