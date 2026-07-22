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
  Phone,
  Eye,
  Scissors,
  UserCog,
  ClipboardCheck,
  Award,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  LayoutGrid,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/ui/Modal.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayAppointments: 0,
    todayCustomers: 0,
    pendingPayments: 0,
    staffPresent: 0,
    lowStockCount: 0,
    todayInvoicesList: [],
    todayAppointmentsList: [],
    lowStockProductsList: [],
    todayStaffPresentList: [],
    todayPaymentMethods: [],
    monthlyRevenueTrend: [],
    recentInvoices: [],
    upcomingAppointments: [],
  });
  const [loading, setLoading] = useState(true);

  // Active Popup Modal state: null | 'revenue' | 'appointments' | 'customers' | 'pending' | 'staff' | 'low_stock'
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    fetchStats();
    const handleUpdate = () => fetchStats();
    window.addEventListener('dashboard_updated', handleUpdate);
    window.addEventListener('attendance_updated', handleUpdate);
    window.addEventListener('billing_updated', handleUpdate);
    window.addEventListener('appointment_updated', handleUpdate);
    window.addEventListener('customers_updated', handleUpdate);
    window.addEventListener('products_updated', handleUpdate);
    return () => {
      window.removeEventListener('dashboard_updated', handleUpdate);
      window.removeEventListener('attendance_updated', handleUpdate);
      window.removeEventListener('billing_updated', handleUpdate);
      window.removeEventListener('appointment_updated', handleUpdate);
      window.removeEventListener('customers_updated', handleUpdate);
      window.removeEventListener('products_updated', handleUpdate);
    };
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

  // Quick Modules Grid Configuration for direct 1-tap mobile access
  const allModules = [
    { title: 'Customers', icon: Users, route: '/customers', color: 'bg-blue-50 text-blue-600', border: 'border-blue-200', desc: 'Client Database' },
    { title: 'Appointments', icon: Calendar, route: '/appointments', color: 'bg-purple-50 text-purple-600', border: 'border-purple-200', desc: 'Booking Schedule' },
    { title: 'Services', icon: Scissors, route: '/services', color: 'bg-amber-50 text-amber-600', border: 'border-amber-200', desc: 'Hair & Beauty Menu' },
    { title: 'Staff Roster', icon: UserCog, route: '/staff', color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-200', desc: 'Stylist Profiles' },
    { title: 'Attendance', icon: ClipboardCheck, route: '/attendance', color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200', desc: 'Mark Daily Attendance' },
    { title: 'Staff Salary', icon: DollarSign, route: '/salary', color: 'bg-teal-50 text-teal-600', border: 'border-teal-200', desc: 'Payroll & Adjustments' },
    { title: 'Staff Commission', icon: Award, route: '/commissions', color: 'bg-orange-50 text-orange-600', border: 'border-orange-200', desc: 'Service Commissions' },
    { title: 'Products', icon: Package, route: '/products', color: 'bg-rose-50 text-rose-600', border: 'border-rose-200', desc: 'Stock Inventory' },
    { title: 'Billing / POS', icon: Receipt, route: '/billing', color: 'bg-gold-50 text-[#D4AF37]', border: 'border-[#E8DFCF]', desc: 'New Invoice / POS' },
    { title: 'Expenses', icon: Wallet, route: '/expenses', color: 'bg-cyan-50 text-cyan-600', border: 'border-cyan-200', desc: 'Salon Expenses' },
    { title: 'Reports', icon: BarChart3, route: '/reports', color: 'bg-[#F4F0E6] text-dark', border: 'border-[#E8DFCF]', desc: 'Revenue Analytics' },
    { title: 'Settings', icon: SettingsIcon, route: '/settings', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300', desc: 'Salon Branding' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 sm:p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/logo.png"
            alt="TRIO Logo"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain rounded-2xl bg-white p-1 border border-[#E8DFCF] shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#D4AF37] text-white">
                Executive View
              </span>
              <span className="text-xs text-dark/40 font-medium">TRIO The Posh</span>
            </div>
            <h1 className="font-display text-xl sm:text-3xl font-bold text-dark tracking-tight">
              Salon Command Center
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">Direct 1-tap mobile access to all salon modules & live metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/billing')}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Receipt size={16} /> POS Terminal
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-full bg-white border border-[#E8DFCF] text-dark font-semibold text-xs hover:bg-[#F4F0E6] transition-all flex items-center justify-center gap-2"
          >
            <Calendar size={16} /> Bookings
          </button>
        </div>
      </div>

      {/* Top Cards Grid - 6 Key Metrics (Responsive for Mobile, Tab, iPad & Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Today's Revenue */}
        <div
          onClick={() => setActiveModal('revenue')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-[#D4AF37] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[#D4AF37] font-display text-xl sm:text-2xl font-bold">₹</span>
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} /> Today
            </span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[11px] sm:text-xs font-medium text-dark/50 flex items-center justify-between">
              <span>Today's Revenue</span>
              <span className="text-[10px] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">Details →</span>
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-dark mt-0.5">
              ₹{stats.todayRevenue.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Card 2: Today's Appointments */}
        <div
          onClick={() => setActiveModal('appointments')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-purple-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <Calendar size={18} />
            </div>
            <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
              View
            </span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[11px] sm:text-xs font-medium text-dark/50 flex items-center justify-between">
              <span>Appointments Today</span>
              <span className="text-[10px] text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">Details →</span>
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-dark mt-0.5">
              {stats.todayAppointments}
            </h3>
          </div>
        </div>

        {/* Card 3: Today's Customers */}
        <div
          onClick={() => setActiveModal('customers')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
              View
            </span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[11px] sm:text-xs font-medium text-dark/50 flex items-center justify-between">
              <span>Customers Today</span>
              <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Details →</span>
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-dark mt-0.5">
              {stats.todayCustomers}
            </h3>
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div
          onClick={() => setActiveModal('pending')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-50 text-amber-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[11px] sm:text-xs font-medium text-dark/50 flex items-center justify-between">
              <span>Pending Payments</span>
              <span className="text-[10px] text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">Details →</span>
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-dark mt-0.5">
              ₹{stats.pendingPayments.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Card 5: Staff Present */}
        <div
          onClick={() => setActiveModal('staff')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[11px] sm:text-xs font-medium text-dark/50 flex items-center justify-between">
              <span>Staff Present</span>
              <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Details →</span>
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-dark mt-0.5">
              {stats.staffPresent}
            </h3>
          </div>
        </div>

        {/* Card 6: Low Stock */}
        <div
          onClick={() => setActiveModal('low_stock')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-red-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-red-50 text-red-600">
              <Package size={18} />
            </div>
            {stats.lowStockCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                {stats.lowStockCount} Low
              </span>
            )}
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[11px] sm:text-xs font-medium text-dark/50 flex items-center justify-between">
              <span>Low Stock Items</span>
              <span className="text-[10px] text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">View List →</span>
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-dark mt-0.5">
              {stats.lowStockCount}
            </h3>
          </div>
        </div>
      </div>

      {/* ===================== DIRECT MOBILE / TABLET MODULE ACCESS HUB ===================== */}
      <div className="glass-card p-4 sm:p-6 border border-[#E8DFCF] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-[#D4AF37]" />
            <h3 className="font-display text-lg font-bold text-dark">Quick Module Access Hub</h3>
          </div>
          <span className="text-[11px] text-dark/50 font-medium hidden sm:inline">1-Tap Direct Navigation (Mobile & Desktop)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {allModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(mod.route)}
                className={`p-3.5 rounded-2xl bg-white border ${mod.border} hover:shadow-md transition-all flex flex-col items-center text-center group`}
              >
                <div className={`p-3 rounded-2xl ${mod.color} mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <span className="font-bold text-dark text-xs">{mod.title}</span>
                <span className="text-[10px] text-dark/40 mt-0.5 leading-tight">{mod.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Section: Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-dark">Revenue Overview</h3>
              <p className="text-xs text-dark/50">Real monthly revenue trend for TRIO THE POSH</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
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
                <XAxis dataKey="month" stroke="#1A1A1A" opacity={0.4} tickLine={false} fontSize={12} />
                <YAxis stroke="#1A1A1A" opacity={0.4} tickLine={false} fontSize={12} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    color: '#fff',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#goldGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Quick Operations */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[#D4AF37]" />
              <h3 className="font-display text-lg font-bold text-dark">Quick Operations</h3>
            </div>
            <p className="text-xs text-dark/50 mb-6">Direct access to core salon workflows</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/billing')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#D4AF37] text-white font-semibold text-sm hover:bg-[#C59F2E] transition-all shadow-md"
              >
                <span className="flex items-center gap-2.5">
                  <Receipt size={18} /> New POS Billing
                </span>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => navigate('/appointments')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F0E6] text-dark font-semibold text-sm hover:bg-white transition-all border border-[#E8DFCF]"
              >
                <span className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-[#D4AF37]" /> Book Appointment
                </span>
                <ChevronRight size={16} className="text-dark/40" />
              </button>

              <button
                onClick={() => navigate('/customers')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F0E6] text-dark font-semibold text-sm hover:bg-white transition-all border border-[#E8DFCF]"
              >
                <span className="flex items-center gap-2.5">
                  <UserPlus size={18} className="text-[#D4AF37]" /> Add New Customer
                </span>
                <ChevronRight size={16} className="text-dark/40" />
              </button>

              <button
                onClick={() => navigate('/attendance')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F0E6] text-dark font-semibold text-sm hover:bg-white transition-all border border-[#E8DFCF]"
              >
                <span className="flex items-center gap-2.5">
                  <UserCheck size={18} className="text-[#D4AF37]" /> Mark Attendance
                </span>
                <ChevronRight size={16} className="text-dark/40" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Invoices & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-dark">Recent Billing Activity</h3>
            <button onClick={() => navigate('/billing')} className="text-xs font-semibold text-[#D4AF37] hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentInvoices.length === 0 ? (
              <p className="text-xs text-dark/40 py-6 text-center italic">No recent billing activity</p>
            ) : (
              stats.recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F0E6]/50 border border-[#E8DFCF]">
                  <div>
                    <p className="text-xs font-bold text-dark">{inv.invoice_number}</p>
                    <p className="text-[11px] text-dark/50">{inv.customer_name || 'Walk-in Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-[#D4AF37]">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      {inv.payment_method || 'Cash'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-dark">Upcoming Bookings</h3>
            <button onClick={() => navigate('/appointments')} className="text-xs font-semibold text-[#D4AF37] hover:underline">
              View Schedule
            </button>
          </div>

          <div className="space-y-3">
            {stats.upcomingAppointments.length === 0 ? (
              <p className="text-xs text-dark/40 py-6 text-center italic">No upcoming appointments booked</p>
            ) : (
              stats.upcomingAppointments.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F0E6]/50 border border-[#E8DFCF]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white text-[#D4AF37] border border-[#E8DFCF]">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark">{app.customer_name || 'Client'}</p>
                      <p className="text-[11px] text-dark/50">{app.service_name || 'Service'} • {app.appointment_time}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-dark/70 bg-white px-2.5 py-1 rounded-full border border-[#E8DFCF]">
                    {app.staff_name || 'Any Staff'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ======================= POPUP MODALS FOR STAT CARDS ======================= */}

      {/* 1. Today's Revenue Details Modal */}
      <Modal isOpen={activeModal === 'revenue'} onClose={() => setActiveModal(null)} title="Today's Revenue Breakdown">
        <div className="space-y-6">
          {/* Revenue Breakdown Cards: Cash, Online, Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Cash Revenue Card */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">💵 Cash Revenue</span>
                <h4 className="font-display text-2xl font-bold text-emerald-700 mt-1">₹{(stats.todayCashRevenue || 0).toLocaleString('en-IN')}</h4>
              </div>
              <p className="text-[11px] text-emerald-600 mt-2 font-medium">{stats.todayCashCount || 0} Cash Payments Today</p>
            </div>

            {/* Online Revenue Card */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">📱 Online / UPI / Card</span>
                <h4 className="font-display text-2xl font-bold text-blue-700 mt-1">₹{(stats.todayOnlineRevenue || 0).toLocaleString('en-IN')}</h4>
              </div>
              <p className="text-[11px] text-blue-600 mt-2 font-medium">{stats.todayOnlineCount || 0} Online Payments Today</p>
            </div>

            {/* Total Revenue Card */}
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">💰 Total Revenue</span>
                <h4 className="font-display text-2xl font-bold text-purple-700 mt-1">₹{(stats.todayRevenue || 0).toLocaleString('en-IN')}</h4>
              </div>
              <p className="text-[11px] text-purple-600 mt-2 font-medium">{stats.todayInvoicesList.length} Total Invoices Today</p>
            </div>
          </div>

          {/* Today's Paid Invoices List */}
          <div>
            <h4 className="text-xs font-bold text-dark/70 uppercase tracking-wider mb-3">Today's Transactions List ({stats.todayInvoicesList.length})</h4>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {stats.todayInvoicesList.length === 0 ? (
                <p className="text-xs text-dark/40 py-6 text-center italic">No invoices recorded today yet</p>
              ) : (
                stats.todayInvoicesList.map((inv) => {
                  const isCash = (inv.payment_method || 'cash').toLowerCase().includes('cash');
                  return (
                    <div key={inv.id} className="p-3 rounded-2xl bg-white border border-[#E8DFCF] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-dark">{inv.invoice_number}</p>
                        <p className="text-[11px] text-dark/60">{inv.customer_name || 'Walk-in Client'} {inv.customer_phone ? `(${inv.customer_phone})` : ''}</p>
                        <p className="text-[10px] text-dark/40">Stylist: {inv.staff_name || 'Staff'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-emerald-700 text-sm">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCash
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {isCash ? '💵 Cash' : '📱 Online'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* 2. Appointments Today Modal */}
      <Modal isOpen={activeModal === 'appointments'} onClose={() => setActiveModal(null)} title="Today's Appointments Schedule">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50 border border-purple-200">
            <span className="text-xs font-bold text-purple-900">Total Booked Today</span>
            <span className="font-display text-lg font-bold text-purple-700">{stats.todayAppointmentsList.length} Appointments</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {stats.todayAppointmentsList.length === 0 ? (
              <p className="text-xs text-dark/40 py-8 text-center italic">No appointments scheduled for today</p>
            ) : (
              stats.todayAppointmentsList.map((app) => (
                <div key={app.id} className="p-3.5 rounded-2xl bg-white border border-[#E8DFCF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#F4F0E6] text-dark font-mono font-bold text-xs border border-[#E8DFCF] shrink-0">
                      {app.appointment_time}
                    </div>
                    <div>
                      <p className="font-bold text-dark text-sm">{app.customer_name || 'Walk-in Client'}</p>
                      <p className="text-xs text-dark/60 flex items-center gap-1 mt-0.5">
                        <Phone size={12} /> {app.customer_phone || 'No phone'}
                      </p>
                      <p className="text-xs text-[#D4AF37] font-semibold mt-1">
                        Service: {app.service_name || 'Hair Cut / Styling'} {app.service_price ? `(₹${app.service_price})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E8DFCF]">
                    <span className="text-xs font-semibold text-dark/70 bg-[#F4F0E6] px-3 py-1 rounded-full border border-[#E8DFCF]">
                      Stylist: {app.staff_name || 'Any Stylist'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 mt-1">
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* 3. Customers Today Modal */}
      <Modal isOpen={activeModal === 'customers'} onClose={() => setActiveModal(null)} title="Today's Served Customers">
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">Total Clients Served Today</span>
            <span className="font-display text-lg font-bold text-blue-700">{stats.todayInvoicesList.length} Clients</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {stats.todayInvoicesList.length === 0 ? (
              <p className="text-xs text-dark/40 py-8 text-center italic">No customer transactions recorded today</p>
            ) : (
              stats.todayInvoicesList.map((cust, idx) => (
                <div key={cust.id || idx} className="p-3.5 rounded-2xl bg-white border border-[#E8DFCF] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-bold text-xs">
                        {cust.customer_name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h4 className="font-bold text-dark text-sm">{cust.customer_name || 'Walk-in Customer'}</h4>
                        <p className="text-xs text-dark/50 flex items-center gap-1">
                          <Phone size={12} /> {cust.customer_phone || 'Mobile: Not recorded'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-base font-bold text-emerald-700">₹{Number(cust.total).toLocaleString('en-IN')}</span>
                      <p className="text-[10px] text-dark/40">{cust.invoice_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-dark/70 pt-1">
                    <p className="font-medium">
                      Styled / Served By: <span className="font-bold text-dark">{cust.staff_name || 'Salon Stylist'}</span>
                    </p>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F4F0E6] border border-[#E8DFCF]">
                      {cust.payment_method || 'Paid Cash'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* 4. Pending Payments Modal */}
      <Modal isOpen={activeModal === 'pending'} onClose={() => setActiveModal(null)} title="Pending Payments Overview">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Pending Collection</p>
            <h4 className="font-display text-2xl font-bold text-amber-700 mt-1">₹{stats.pendingPayments.toLocaleString('en-IN')}</h4>
          </div>
          <p className="text-xs text-dark/60">Manage pending balances and collect payment via the POS Terminal.</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setActiveModal(null);
                navigate('/billing');
              }}
              className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] flex items-center gap-2"
            >
              <Receipt size={16} /> Open POS Billing
            </button>
          </div>
        </div>
      </Modal>

      {/* 5. Staff Present Modal */}
      <Modal isOpen={activeModal === 'staff'} onClose={() => setActiveModal(null)} title="Staff Attendance Today">
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Staff Members Present Today</span>
            <span className="font-display text-lg font-bold text-emerald-700">{stats.todayStaffPresentList.length} Present</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {stats.todayStaffPresentList.length === 0 ? (
              <p className="text-xs text-dark/40 py-8 text-center italic">No staff attendance marked present for today yet</p>
            ) : (
              stats.todayStaffPresentList.map((st) => (
                <div key={st.id} className="p-3 rounded-2xl bg-white border border-[#E8DFCF] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-dark text-sm">{st.staff_name}</p>
                    <p className="text-xs text-dark/50">{st.staff_phone || 'Active Stylist'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Present
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* 6. Low Stock Items Modal */}
      <Modal isOpen={activeModal === 'low_stock'} onClose={() => setActiveModal(null)} title="Low Stock Products Alert">
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-900">Low Stock Warning</p>
              <p className="text-[11px] text-red-700">Products below low stock threshold</p>
            </div>
            <span className="font-display text-lg font-bold text-red-700">{stats.lowStockProductsList.length} Items</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {stats.lowStockProductsList.length === 0 ? (
              <p className="text-xs text-emerald-700 py-8 text-center font-semibold">🎉 Excellent! All inventory stock levels are healthy.</p>
            ) : (
              stats.lowStockProductsList.map((prod) => (
                <div key={prod.id} className="p-3 rounded-2xl bg-white border border-red-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-dark text-sm">{prod.name}</p>
                    <p className="text-xs text-dark/50">Category: {prod.category || 'General'}</p>
                    <p className="text-[11px] text-[#D4AF37] font-semibold">Selling Price: ₹{prod.selling_price}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 inline-block mb-1">
                      {prod.stock_quantity} left (Threshold: {prod.low_stock_threshold})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-[#E8DFCF]">
            <button
              onClick={() => {
                setActiveModal(null);
                navigate('/products');
              }}
              className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] flex items-center gap-2"
            >
              <Package size={16} /> Go to Products Inventory
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
