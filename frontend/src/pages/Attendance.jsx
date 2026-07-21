import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { ClipboardCheck, Save, Calendar, Download, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString, getLocalMonthString } from '../utils/dateUtils.js';

export default function Attendance() {
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'report'
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState(() => getLocalMonthString());

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyAttendance();
    } else {
      fetchMonthlyReport();
    }
  }, [activeTab, selectedDate, selectedMonth]);

  const fetchDailyAttendance = async () => {
    try {
      setLoading(true);
      const res = await client.get('/attendance', {
        params: { date: selectedDate },
      });
      setAttendanceRecords(res.data.attendance || []);
    } catch (err) {
      showError('Failed to load daily attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const res = await client.get('/attendance/report', {
        params: { month: selectedMonth },
      });
      setReportData(res.data.report || []);
    } catch (err) {
      showError('Failed to load monthly attendance report');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (staffId, status) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.staff_id === staffId ? { ...rec, status } : rec))
    );
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const records = attendanceRecords.map((r) => ({
        staffId: r.staff_id,
        status: r.status,
        note: r.note || '',
      }));

      await client.post('/attendance/bulk', { date: selectedDate, records });
      showSuccess(`Attendance saved for ${selectedDate}`);
    } catch (err) {
      showError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!reportData.length) return showError('No data available to export');

    const headers = ['Staff Name', 'Phone', 'Working Days', 'Present', 'Absent', 'Half Days', 'Leaves', 'Attendance %'];
    const rows = reportData.map((r) => [
      `"${r.staffName}"`,
      `"${r.phone || ''}"`,
      r.totalWorkingDays,
      r.presentCount,
      r.absentCount,
      r.halfDayCount,
      r.leaveCount,
      `${r.attendancePercentage}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TRIO_POSH_Attendance_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">Staff Attendance</h1>
          <p className="text-xs text-dark/50">Log daily staff presence & review monthly attendance percentages</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-full bg-white/70 border border-[#E8DFCF] shadow-sm">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'daily' ? 'bg-[#D4AF37] text-white shadow-sm' : 'text-dark/60 hover:text-dark'
            }`}
          >
            Daily Logger
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'report' ? 'bg-[#D4AF37] text-white shadow-sm' : 'text-dark/60 hover:text-dark'
            }`}
          >
            Monthly Report
          </button>
        </div>
      </div>

      {activeTab === 'daily' ? (
        /* Daily Logger View */
        <div className="space-y-4">
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-[#D4AF37]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-white border border-[#E8DFCF] rounded-full text-xs font-semibold text-dark focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E8DFCF] text-xs font-semibold text-dark/60 uppercase">
                    <th className="pb-3 px-3">Staff Member</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFCF]/60 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-dark/40">
                        Loading attendance logger...
                      </td>
                    </tr>
                  ) : attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-dark/40">
                        No active staff members found
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((r) => (
                      <tr key={r.staff_id} className="hover:bg-[#F4F0E6]/40 transition-colors">
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37] font-display text-xs font-bold text-white">
                              {r.staff_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-dark">{r.staff_name}</p>
                              <p className="text-xs text-dark/50">{r.phone || 'No phone'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-3">
                          <div className="flex items-center justify-center gap-2">
                            {/* Present */}
                            <button
                              onClick={() => handleStatusChange(r.staff_id, 'present')}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                r.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-[#F4F0E6] text-dark/70 hover:bg-emerald-100 hover:text-emerald-800'
                              }`}
                            >
                              Present
                            </button>

                            {/* Half Day */}
                            <button
                              onClick={() => handleStatusChange(r.staff_id, 'half_day')}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                r.status === 'half_day'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-[#F4F0E6] text-dark/70 hover:bg-amber-100 hover:text-amber-800'
                              }`}
                            >
                              Half Day
                            </button>

                            {/* Leave */}
                            <button
                              onClick={() => handleStatusChange(r.staff_id, 'leave')}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                r.status === 'leave'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-[#F4F0E6] text-dark/70 hover:bg-blue-100 hover:text-blue-800'
                              }`}
                            >
                              Leave
                            </button>

                            {/* Absent */}
                            <button
                              onClick={() => handleStatusChange(r.staff_id, 'absent')}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                r.status === 'absent'
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : 'bg-[#F4F0E6] text-dark/70 hover:bg-red-100 hover:text-red-800'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Monthly Report View */
        <div className="space-y-4">
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-[#D4AF37]" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white border border-[#E8DFCF] rounded-full text-xs font-semibold text-dark focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              onClick={exportCSV}
              className="px-5 py-2.5 rounded-full border border-[#E8DFCF] bg-white text-dark font-semibold text-xs hover:bg-[#F4F0E6] transition-all flex items-center gap-2 shadow-xs"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="glass-card p-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8DFCF] text-xs font-semibold text-dark/60 uppercase">
                  <th className="pb-3 px-2">Staff</th>
                  <th className="pb-3 px-2 text-center">Working Days</th>
                  <th className="pb-3 px-2 text-center text-emerald-600">Present</th>
                  <th className="pb-3 px-2 text-center text-amber-600">Half Days</th>
                  <th className="pb-3 px-2 text-center text-blue-600">Leaves</th>
                  <th className="pb-3 px-2 text-center text-red-600">Absent</th>
                  <th className="pb-3 px-2 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFCF]/60">
                {reportData.map((row) => (
                  <tr key={row.staffId} className="hover:bg-[#F4F0E6]/50 transition-colors">
                    <td className="py-3 px-2 font-semibold text-dark">{row.staffName}</td>
                    <td className="py-3 px-2 text-center font-bold text-dark">{row.totalWorkingDays}</td>
                    <td className="py-3 px-2 text-center font-semibold text-emerald-600">{row.presentCount}</td>
                    <td className="py-3 px-2 text-center font-semibold text-amber-600">{row.halfDayCount}</td>
                    <td className="py-3 px-2 text-center font-semibold text-blue-600">{row.leaveCount}</td>
                    <td className="py-3 px-2 text-center font-semibold text-red-600">{row.absentCount}</td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-display font-bold text-base text-[#D4AF37]">
                        {row.attendancePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
