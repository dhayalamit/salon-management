import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
  UserCheck,
  Package,
  TrendingUp,
  Plus,
  Receipt,
  UserPlus,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayAppointments: 0,
    todayCustomers: 0,
    pendingPayments: 0,
    staffPresent: 0,
    lowStockCount: 0,
    monthlyRevenueTrend: [],
    recentInvoices: [],
    upcomingAppointments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const handleAttendanceUpdate = () => fetchStats();
    window.addEventListener('attendance_updated', handleAttendanceUpdate);
    return () => window.removeEventListener('attendance_updated', handleAttendanceUpdate);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await client.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    stats.monthlyRevenueTrend && stats.monthlyRevenueTrend.length > 0
      ? stats.monthlyRevenueTrend
      : [
          { month: 'Jan', revenue: 0 },
          { month: 'Feb', revenue: 0 },
          { month: 'Mar', revenue: 0 },
          { month: 'Apr', revenue: 0 },
          { month: 'May', revenue: 0 },
          { month: 'Jun', revenue: 0 },
          { month: 'Jul', revenue: 0 },
        ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border border-[#E2E8F0] shadow-md">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] p-0.5 shadow-md shrink-0">
            <img
              src="/logo.png"
              alt="TRIO Logo"
              className="h-full w-full object-contain rounded-[14px] bg-white p-1"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="section-badge py-0.5 px-3 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF] animate-pulse" />
                EXECUTIVE VIEW
              </span>
              <span className="text-xs text-[#64748B] font-medium">TRIO The Posh</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Salon Command Center
            </h1>
            <p className="text-xs text-[#64748B] mt-1">Real-time salon metrics, upcoming appointments, and staff operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/billing')}
            className="btn-accent px-5 py-2.5 rounded-full text-white font-semibold text-xs flex items-center gap-2"
          >
            <Receipt size={16} /> POS Terminal
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="px-5 py-2.5 rounded-full bg-white border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs hover:bg-[#F1F5F9] transition-all shadow-xs flex items-center gap-2"
          >
            <Calendar size={16} /> Bookings
          </button>
        </div>
      </div>

      {/* Top Cards Grid - 6 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="gradient-text font-display text-2xl font-bold">₹</span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <TrendingUp size={12} /> Live Today
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-[#64748B]">Today's Revenue</p>
            <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-0.5">
              ₹{stats.todayRevenue.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Card 2: Today's Appointments */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-[#64748B]">Appointments Today</p>
            <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-0.5">
              {stats.todayAppointments}
            </h3>
          </div>
        </div>

        {/* Card 3: Today's Customers */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0052FF] border border-blue-100">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-[#64748B]">Customers Today</p>
            <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-0.5">
              {stats.todayCustomers}
            </h3>
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-[#64748B]">Pending Payments</p>
            <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-0.5">
              ₹{stats.pendingPayments.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Card 5: Staff Present */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <UserCheck size={18} />
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-[#64748B]">Staff Present</p>
            <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-0.5">
              {stats.staffPresent}
            </h3>
          </div>
        </div>

        {/* Card 6: Low Stock */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-red-50 text-red-600 border border-red-100">
              <Package size={18} />
            </div>
            {stats.lowStockCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                Action
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-[#64748B]">Low Stock Items</p>
            <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-0.5">
              {stats.lowStockCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Section: Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-[#0F172A]">Revenue Overview</h3>
              <p className="text-xs text-[#64748B]">Real monthly revenue trend for TRIO THE POSH</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-[#0052FF] hover:underline flex items-center gap-1"
            >
              View Report <ChevronRight size={14} />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="electricBlueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0052FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4D7CFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#0F172A" opacity={0.4} tickLine={false} fontSize={12} />
                <YAxis stroke="#0F172A" opacity={0.4} tickLine={false} fontSize={12} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0052FF" strokeWidth={3} fillOpacity={1} fill="url(#electricBlueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions */}
        <div className="glass-card p-6 flex flex-col justify-between border border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[#0052FF]" />
              <h3 className="font-display text-lg font-bold text-[#0F172A]">Quick Actions</h3>
            </div>
            <p className="text-xs text-[#64748B] mb-6">Instantly access core salon operations</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/billing')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl btn-accent text-white font-semibold text-sm shadow-accent"
              >
                <span className="flex items-center gap-2.5">
                  <Receipt size={18} /> New POS Billing
                </span>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => navigate('/appointments')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F1F5F9] text-[#0F172A] font-semibold text-sm hover:bg-white transition-all border border-[#E2E8F0]"
              >
                <span className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-[#0052FF]" /> Book Appointment
                </span>
                <ChevronRight size={16} className="text-[#64748B]" />
              </button>

              <button
                onClick={() => navigate('/customers')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F1F5F9] text-[#0F172A] font-semibold text-sm hover:bg-white transition-all border border-[#E2E8F0]"
              >
                <span className="flex items-center gap-2.5">
                  <UserPlus size={18} className="text-[#0052FF]" /> Add New Customer
                </span>
                <ChevronRight size={16} className="text-[#64748B]" />
              </button>

              <button
                onClick={() => navigate('/attendance')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F1F5F9] text-[#0F172A] font-semibold text-sm hover:bg-white transition-all border border-[#E2E8F0]"
              >
                <span className="flex items-center gap-2.5">
                  <UserCheck size={18} className="text-[#0052FF]" /> Mark Attendance
                </span>
                <ChevronRight size={16} className="text-[#64748B]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Invoices (Inverted Dark Section) & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices - Inverted Contrast Section */}
        <div className="rounded-2xl bg-inverted bg-dot-pattern p-6 border border-[#1E293B] shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
              Recent Transactions
            </h3>
            <button onClick={() => navigate('/billing')} className="text-xs font-semibold text-[#4D7CFF] hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent billing activity</p>
            ) : (
              stats.recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#1E293B]/80 border border-slate-700/60 backdrop-blur-sm">
                  <div>
                    <p className="text-xs font-bold text-white">{inv.invoice_number}</p>
                    <p className="text-[11px] text-slate-400">{inv.customer_name || 'Walk-in Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                    <span className="text-[10px] capitalize px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      {inv.payment_method || 'Cash'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="glass-card p-6 border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-bold text-[#0F172A]">Upcoming Appointments</h3>
            <button onClick={() => navigate('/appointments')} className="text-xs font-semibold text-[#0052FF] hover:underline">
              View Schedule
            </button>
          </div>

          <div className="space-y-3">
            {stats.upcomingAppointments.length === 0 ? (
              <p className="text-xs text-[#64748B] py-6 text-center">No upcoming appointments booked</p>
            ) : (
              stats.upcomingAppointments.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F1F5F9]/70 border border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#0052FF]/10 text-[#0052FF]">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{app.customer_name || 'Client'}</p>
                      <p className="text-[11px] text-[#64748B]">{app.service_name || 'Service'} • {app.appointment_time}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#0F172A] bg-white px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                    {app.staff_name || 'Any Staff'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
