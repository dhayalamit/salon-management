import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  UserCheck,
  Plus,
  Calendar,
  DollarSign,
  Filter,
  Trash2,
  CheckCircle,
  FileText,
  User,
  Clock,
  Sparkles,
  TrendingUp,
  Scissors,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString } from '../utils/dateUtils.js';

export default function StaffWorkRegister() {
  const { showSuccess, showError } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [entries, setEntries] = useState([]);
  const [totalWorkAmount, setTotalWorkAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [formData, setFormData] = useState({
    staffId: '',
    description: '',
    amount: '',
    date: getTodayDateString(),
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter State
  const [filterStaffId, setFilterStaffId] = useState('');
  const [filterDate, setFilterDate] = useState(() => getTodayDateString());
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filterStaffId, filterDate, filterMonth]);

  const fetchStaff = async () => {
    try {
      const res = await client.get('/staff');
      setStaffList(res.data || []);
      if (res.data && res.data.length > 0 && !formData.staffId) {
        setFormData((prev) => ({ ...prev, staffId: res.data[0].id }));
      }
    } catch (err) {
      showError('Failed to load staff list');
    }
  };

  const fetchServices = async () => {
    try {
      const res = await client.get('/services');
      setServicesList(res.data || []);
    } catch (err) {
      console.error('Failed to load services list', err);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStaffId) params.staffId = filterStaffId;
      if (filterDate) params.date = filterDate;
      if (filterMonth) params.month = filterMonth;

      const res = await client.get('/staff-work', { params });
      setEntries(res.data.entries || []);
      setTotalWorkAmount(res.data.totalWorkAmount || 0);
    } catch (err) {
      showError('Failed to load staff work entries');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (e) => {
    const sId = e.target.value;
    setSelectedServiceId(sId);
    if (sId === 'custom') {
      // Allow custom typing
    } else {
      const s = servicesList.find((srv) => srv.id === sId);
      if (s) {
        setFormData((prev) => ({
          ...prev,
          description: s.name,
          amount: s.price,
        }));
      }
    }
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!formData.staffId || !formData.amount) {
      return showError('Please select a staff member and enter work amount');
    }

    try {
      setSubmitting(true);
      await client.post('/staff-work', formData);
      showSuccess('Staff work entry recorded successfully!');
      setSelectedServiceId('');
      setFormData({
        staffId: staffList[0]?.id || '',
        description: '',
        amount: '',
        date: getTodayDateString(),
      });
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchEntries();
    } catch (err) {
      showError('Failed to save staff work entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff work entry?')) return;
    try {
      await client.delete(`/staff-work/${id}`);
      showSuccess('Entry deleted');
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchEntries();
    } catch (err) {
      showError('Failed to delete work entry');
    }
  };

  // Group entries by Staff Member for history display
  const groupedByStaff = entries.reduce((acc, entry) => {
    const sName = entry.staff_name || 'Staff Member';
    if (!acc[sName]) acc[sName] = { staffName: sName, items: [], total: 0 };
    acc[sName].items.push(entry);
    acc[sName].total += Number(entry.amount || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 border border-[#E8DFCF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#D4AF37] text-white">
                Daily Register
              </span>
              <span className="text-xs text-dark/40 font-medium">TRIO The Posh</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-dark">Staff Work Register</h1>
            <p className="text-xs text-dark/50">Record daily manual work entries per stylist with timestamps</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF] text-right">
          <p className="text-[11px] font-semibold text-dark/50 uppercase tracking-wider">Total Work Done (Filtered)</p>
          <h3 className="font-display text-2xl font-bold text-[#D4AF37] mt-0.5">
            ₹{totalWorkAmount.toLocaleString('en-IN')}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Record New Work Entry Form */}
        <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8DFCF] pb-3">
            <Plus size={18} className="text-[#D4AF37]" />
            <h3 className="font-display text-base font-bold text-dark">Record Staff Work Entry</h3>
          </div>

          <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-dark/70 mb-1.5">Select Staff Member *</label>
              <select
                required
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Select Stylist / Staff</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.phone || 'Stylist'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-dark/70 mb-1.5 flex items-center gap-1">
                <Scissors size={14} className="text-[#D4AF37]" /> Select Service / Work Description *
              </label>

              {/* Service Dropdown Selector */}
              <select
                value={selectedServiceId}
                onChange={handleServiceSelect}
                className="w-full px-3.5 py-2.5 bg-[#F4F0E6]/60 border border-[#E8DFCF] rounded-xl text-dark font-semibold focus:outline-none focus:border-[#D4AF37] mb-2"
              >
                <option value="">Choose Service from Menu...</option>
                {servicesList.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} — ₹{srv.price}
                  </option>
                ))}
                <option value="custom">✏️ Custom Description...</option>
              </select>

              {/* Editable Work Description Field */}
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Haircut, Beard Trim, Hair Spa"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block font-semibold text-dark/70 mb-1.5">Work Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 150"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-bold text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block font-semibold text-dark/70 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#D4AF37] text-white font-bold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={16} /> {submitting ? 'Saving...' : 'Save Work Entry'}
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Staff Work History & Filters */}
        <div className="lg:col-span-2 glass-card p-6 border border-[#E8DFCF] space-y-6">
          {/* Filters Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8DFCF] pb-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[#D4AF37]" />
              <h3 className="font-display text-base font-bold text-dark">Staff Work History</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Staff Filter */}
              <select
                value={filterStaffId}
                onChange={(e) => setFilterStaffId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
              >
                <option value="">All Staff</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  if (e.target.value) setFilterMonth('');
                }}
                className="px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
              />

              {/* Month Filter */}
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  if (e.target.value) setFilterDate('');
                }}
                className="px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
              />

              {(filterStaffId || filterDate || filterMonth) && (
                <button
                  onClick={() => {
                    setFilterStaffId('');
                    setFilterDate(getTodayDateString());
                    setFilterMonth('');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Grouped Staff Work Cards */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-xs text-dark/40 py-12 text-center italic">Loading staff work history...</p>
            ) : Object.keys(groupedByStaff).length === 0 ? (
              <div className="py-12 text-center text-dark/40 text-xs italic">
                No work entries recorded for the selected filter criteria. Use the form on the left to record work!
              </div>
            ) : (
              Object.values(groupedByStaff).map((group, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-[#E8DFCF] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                        {group.staffName[0]}
                      </div>
                      <h4 className="font-bold text-dark text-sm">{group.staffName}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-dark/50 font-semibold block">Total Work Done</span>
                      <span className="font-display text-base font-bold text-emerald-700">
                        ₹{group.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* List of Work Items for this Staff */}
                  <div className="space-y-1.5 pl-2">
                    {group.items.map((item) => {
                      const timeDisplay = item.created_at
                        ? new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                        : null;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F4F0E6]/50 hover:bg-[#F4F0E6] transition-colors text-xs"
                        >
                          <div>
                            <span className="font-semibold text-dark text-xs sm:text-sm">
                              {item.description || 'Manual Work Entry'}
                            </span>
                            <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-dark/50">
                              <span>📅 {item.date}</span>
                              {timeDisplay && (
                                <span className="font-semibold text-[#D4AF37]">⏰ {timeDisplay}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold font-mono text-dark text-sm">₹{Number(item.amount).toLocaleString('en-IN')}</span>
                            <button
                              onClick={() => handleDeleteEntry(item.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                              title="Delete Entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
