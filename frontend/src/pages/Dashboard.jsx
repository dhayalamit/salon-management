import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  DollarSign,
  Calendar,
  Users,
  UserCheck,
  Package,
  TrendingUp,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border border-[#1A1A1A]/15 bg-[#F9F8F6]">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-[#1A1A1A] p-1 border border-[#D4AF37] shrink-0 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="TRIO Logo"
              className="h-full w-full object-contain filter invert brightness-200"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="section-badge py-0.5 px-3 text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                EDITORIAL VIEW
              </span>
              <span className="text-xs text-[#6C6863] font-medium uppercase tracking-widest">TRIO The Posh</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-[#1A1A1A] tracking-tight">
              Salon Command <span className="italic text-[#D4AF37]">Center</span>
            </h1>
            <p className="text-xs text-[#6C6863] mt-1">Curated real-time metrics, appointment schedules, and salon operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/billing')}
            className="btn-accent px-6 py-3 text-white font-semibold text-xs flex items-center gap-2"
          >
            <Receipt size={16} /> POS Terminal
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="px-6 py-3 bg-transparent border border-[#1A1A1A] text-[#1A1A1A] font-semibold text-xs uppercase tracking-[0.2em] hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-all flex items-center gap-2"
          >
            <Calendar size={16} /> Bookings
          </button>
        </div>
      </div>

      {/* Top Cards Grid - 6 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between border-t-2 border-t-[#D4AF37]">
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold text-[#D4AF37]">₹</span>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              <TrendingUp size={12} /> Today
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6C6863]">Today's Revenue</p>
            <h3 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
              ₹{stats.todayRevenue.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Card 2: Today's Appointments */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-50 text-purple-700 border border-purple-200">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6C6863]">Appointments Today</p>
            <h3 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
              {stats.todayAppointments}
            </h3>
          </div>
        </div>

        {/* Card 3: Today's Customers */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-50 text-blue-700 border border-blue-200">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6C6863]">Customers Today</p>
            <h3 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
              {stats.todayCustomers}
            </h3>
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-50 text-amber-700 border border-amber-200">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6C6863]">Pending Payments</p>
            <h3 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
              ₹{stats.pendingPayments.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Card 5: Staff Present */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6C6863]">Staff Present</p>
            <h3 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
              {stats.staffPresent}
            </h3>
          </div>
        </div>

        {/* Card 6: Low Stock */}
        <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-50 text-red-700 border border-red-200">
              <Package size={18} />
            </div>
            {stats.lowStockCount > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                Action
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6C6863]">Low Stock Items</p>
            <h3 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
              {stats.lowStockCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Section: Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-[#1A1A1A]/10 pb-3">
            <div>
              <h3 className="font-display text-xl font-bold text-[#1A1A1A]">Revenue <span className="italic text-[#D4AF37]">Overview</span></h3>
              <p className="text-xs text-[#6C6863]">Monthly performance statement for TRIO THE POSH</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              View Report <ChevronRight size={14} />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#1A1A1A" opacity={0.6} tickLine={false} fontSize={11} />
                <YAxis stroke="#1A1A1A" opacity={0.6} tickLine={false} fontSize={11} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    color: '#D4AF37',
                    borderRadius: '0px',
                    border: '1px solid #D4AF37',
                    fontSize: '12px',
                    fontFamily: 'Playfair Display',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#goldGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions */}
        <div className="glass-card p-6 flex flex-col justify-between border-t-2 border-t-[#D4AF37]">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-[#1A1A1A]/10 pb-3">
              <Sparkles size={18} className="text-[#D4AF37]" />
              <h3 className="font-display text-xl font-bold text-[#1A1A1A]">Quick Actions</h3>
            </div>
            <p className="text-xs text-[#6C6863] mb-6">Instantly access core salon operations</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/billing')}
                className="w-full flex items-center justify-between p-3.5 btn-accent text-white font-semibold text-xs uppercase tracking-[0.15em]"
              >
                <span className="flex items-center gap-2.5">
                  <Receipt size={16} /> New POS Billing
                </span>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => navigate('/appointments')}
                className="w-full flex items-center justify-between p-3.5 bg-[#F9F8F6] text-[#1A1A1A] font-semibold text-xs uppercase tracking-[0.15em] hover:bg-[#EBE5DE] transition-all border border-[#1A1A1A]/15"
              >
                <span className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-[#D4AF37]" /> Book Appointment
                </span>
                <ChevronRight size={16} className="text-[#6C6863]" />
              </button>

              <button
                onClick={() => navigate('/customers')}
                className="w-full flex items-center justify-between p-3.5 bg-[#F9F8F6] text-[#1A1A1A] font-semibold text-xs uppercase tracking-[0.15em] hover:bg-[#EBE5DE] transition-all border border-[#1A1A1A]/15"
              >
                <span className="flex items-center gap-2.5">
                  <UserPlus size={16} className="text-[#D4AF37]" /> Add New Customer
                </span>
                <ChevronRight size={16} className="text-[#6C6863]" />
              </button>

              <button
                onClick={() => navigate('/attendance')}
                className="w-full flex items-center justify-between p-3.5 bg-[#F9F8F6] text-[#1A1A1A] font-semibold text-xs uppercase tracking-[0.15em] hover:bg-[#EBE5DE] transition-all border border-[#1A1A1A]/15"
              >
                <span className="flex items-center gap-2.5">
                  <UserCheck size={16} className="text-[#D4AF37]" /> Mark Attendance
                </span>
                <ChevronRight size={16} className="text-[#6C6863]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Invoices (Inverted Dark Section) & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices - Inverted Contrast Section */}
        <div className="bg-inverted p-6 border-t-2 border-t-[#D4AF37] shadow-xl text-white">
          <div className="flex items-center justify-between mb-4 border-b border-[#D4AF37]/30 pb-3">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 bg-[#D4AF37]" />
              Recent <span className="italic text-[#D4AF37]">Transactions</span>
            </h3>
            <button onClick={() => navigate('/billing')} className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentInvoices.length === 0 ? (
              <p className="text-xs text-white/50 py-6 text-center italic font-display">No recent billing activity</p>
            ) : (
              stats.recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-[#262626] border border-[#1A1A1A]">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{inv.invoice_number}</p>
                    <p className="text-[11px] text-white/60">{inv.customer_name || 'Walk-in Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-[#D4AF37]">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                    <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] font-semibold border border-[#D4AF37]/30">
                      {inv.payment_method || 'Cash'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="glass-card p-6 border-t-2 border-t-[#1A1A1A]">
          <div className="flex items-center justify-between mb-4 border-b border-[#1A1A1A]/10 pb-3">
            <h3 className="font-display text-lg font-bold text-[#1A1A1A]">Upcoming <span className="italic text-[#D4AF37]">Appointments</span></h3>
            <button onClick={() => navigate('/appointments')} className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] hover:underline">
              View Schedule
            </button>
          </div>

          <div className="space-y-3">
            {stats.upcomingAppointments.length === 0 ? (
              <p className="text-xs text-[#6C6863] py-6 text-center italic font-display">No upcoming appointments booked</p>
            ) : (
              stats.upcomingAppointments.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-[#F9F8F6] border border-[#1A1A1A]/15">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1A1A1A] text-[#D4AF37]">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A1A1A]">{app.customer_name || 'Client'}</p>
                      <p className="text-[11px] text-[#6C6863]">{app.service_name || 'Service'} • {app.appointment_time}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#1A1A1A] bg-white px-2.5 py-1 border border-[#1A1A1A]/20 tracking-wider">
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
