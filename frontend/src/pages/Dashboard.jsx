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
  Edit3,
  CheckCircle,
  PiggyBank,
  Landmark,
  CalendarDays,
  CalendarCheck,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTodayDateString } from '../utils/dateUtils.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayCashRevenue: 0,
    todayCashCount: 0,
    todayOnlineRevenue: 0,
    todayOnlineCount: 0,
    todayExpenses: 0,
    staffWorkValue: 0,
    todayOpeningBalance: 0,
    todayClosingBalance: 0,
    todayBalanceNotes: '',
    todayAppointments: 0,
    todayCustomers: 0,
    pendingPayments: 0,
    paidPayments: 0,
    staffPresent: 0,
    lowStockCount: 0,
    todayInvoicesList: [],
    todayAppointmentsList: [],
    lowStockProductsList: [],
    todayStaffPresentList: [],
    monthlyRevenueTrend: [],
    recentInvoices: [],
    upcomingAppointments: [],
  });
  const [loading, setLoading] = useState(true);

  // Active Popup Modal state: null | 'revenue' | 'appointments' | 'customers' | 'pending' | 'staff' | 'low_stock' | 'balance'
  const [activeModal, setActiveModal] = useState(null);

  // Date selection state for Daily Register Balance modal
  const [selectedBalanceDate, setSelectedBalanceDate] = useState(() => getTodayDateString());
  const [balanceForm, setBalanceForm] = useState({
    openingBalance: '',
    closingBalance: '',
    revenue: 0,
    expenses: 0,
    notes: '',
  });

  // Pending Payment Settlement State
  const [settleInvoice, setSettleInvoice] = useState(null);
  const [settleMethod, setSettleMethod] = useState('cash');

  useEffect(() => {
    fetchStats();
    const handleUpdate = () => fetchStats();
    window.addEventListener('dashboard_updated', handleUpdate);
    window.addEventListener('attendance_updated', handleUpdate);
    window.addEventListener('appointment_updated', handleUpdate);
    window.addEventListener('customers_updated', handleUpdate);
    window.addEventListener('products_updated', handleUpdate);
    return () => {
      window.removeEventListener('dashboard_updated', handleUpdate);
      window.removeEventListener('attendance_updated', handleUpdate);
      window.removeEventListener('appointment_updated', handleUpdate);
      window.removeEventListener('customers_updated', handleUpdate);
      window.removeEventListener('products_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (activeModal === 'balance') {
      fetchBalanceForDate(selectedBalanceDate);
    }
  }, [selectedBalanceDate, activeModal]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await client.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      showError('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceForDate = async (dateStr) => {
    try {
      const res = await client.get(`/dashboard/balance?date=${dateStr}`);
      setBalanceForm({
        openingBalance: res.data.openingBalance || '',
        closingBalance: res.data.closingBalance || '',
        revenue: res.data.revenue || 0,
        expenses: res.data.expenses || 0,
        notes: res.data.notes || '',
      });
    } catch (err) {
      showError('Failed to fetch daily balance record');
    }
  };

  const handleSaveDailyBalance = async (e) => {
    e.preventDefault();
    try {
      await client.post('/dashboard/balance', {
        date: selectedBalanceDate,
        openingBalance: balanceForm.openingBalance,
        closingBalance: balanceForm.closingBalance,
        notes: balanceForm.notes,
      });
      showSuccess(`Register balances saved for ${selectedBalanceDate}`);
      setActiveModal(null);
      fetchStats();
    } catch (err) {
      showError('Failed to update register balances');
    }
  };

  const handleSettlePendingPayment = async (e) => {
    e.preventDefault();
    if (!settleInvoice) return;
    try {
      await client.put(`/visits/${settleInvoice.id}/payment`, {
        paymentMethod: settleMethod,
        amountPaid: settleInvoice.remaining_amount || settleInvoice.total,
      });
      showSuccess(`Payment collected via ${settleMethod.toUpperCase()} successfully`);
      setSettleInvoice(null);
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      fetchStats();
    } catch (err) {
      showError('Failed to settle pending payment');
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
    { title: 'WhatsApp Center', icon: MessageSquare, route: '/whatsapp-center', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200', desc: 'Meta API & Automation' },
    { title: 'Clients', icon: Users, route: '/customers', color: 'bg-blue-50 text-blue-600', border: 'border-blue-200', desc: 'Client Database' },
    { title: 'Permanent Customers', icon: UserCheck, route: '/permanent-customers', color: 'bg-amber-50 text-[#D4AF37]', border: 'border-amber-200', desc: 'Prepaid Wallet & Visits' },
    { title: 'Appointments', icon: Calendar, route: '/appointments', color: 'bg-purple-50 text-purple-600', border: 'border-purple-200', desc: 'Booking Schedule' },
    { title: 'Services', icon: Scissors, route: '/services', color: 'bg-amber-50 text-amber-600', border: 'border-amber-200', desc: 'Hair & Beauty Menu' },
    { title: 'Staff Roster', icon: UserCog, route: '/staff', color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-200', desc: 'Stylist Profiles' },
    { title: 'Attendance', icon: ClipboardCheck, route: '/attendance', color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200', desc: 'Mark Daily Attendance' },
    { title: 'Staff Salary', icon: DollarSign, route: '/salary', color: 'bg-teal-50 text-teal-600', border: 'border-teal-200', desc: 'Payroll & Adjustments' },
    { title: 'Staff Commission', icon: Award, route: '/commissions', color: 'bg-orange-50 text-orange-600', border: 'border-orange-200', desc: 'Service Commissions' },
    { title: 'Staff Work Register', icon: FileText, route: '/staff-work', color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200', desc: 'Manual Work Entries' },
    { title: 'Products', icon: Package, route: '/products', color: 'bg-rose-50 text-rose-600', border: 'border-rose-200', desc: 'Stock Inventory' },
    { title: 'Customer Visits', icon: CalendarCheck, route: '/visits', color: 'bg-[#F4F0E6] text-[#D4AF37]', border: 'border-[#E8DFCF]', desc: 'Customer Visits & Payments' },
    { title: 'Expenses', icon: Wallet, route: '/expenses', color: 'bg-cyan-50 text-cyan-600', border: 'border-cyan-200', desc: 'Salon Expenses' },
    { title: 'Reports', icon: BarChart3, route: '/reports', color: 'bg-[#F4F0E6] text-dark', border: 'border-[#E8DFCF]', desc: 'Revenue Analytics' },
    { title: 'Settings', icon: SettingsIcon, route: '/settings', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300', desc: 'Salon Branding' },
  ];

  const pendingVisitsList = (stats.todayVisitsList || stats.todayInvoicesList || []).filter(
    (v) => Number(v.remaining_amount || 0) > 0 || (v.payment_status || '').toLowerCase() === 'pending' || (v.payment_method || '').toLowerCase() === 'pending'
  );

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
            <p className="text-xs text-dark/50 mt-0.5">Real-time salon metrics, daily balances & instant module shortcuts</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
          <button
            onClick={() => setActiveModal('balance')}
            className="px-4 py-2.5 rounded-full bg-white border border-[#E8DFCF] text-dark font-semibold text-xs hover:bg-[#F4F0E6] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Edit3 size={15} className="text-[#D4AF37]" /> Manage Register Balances
          </button>

          <button
            onClick={() => navigate('/visits')}
            className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-1.5"
          >
            <CalendarCheck size={16} /> Customer Visits
          </button>
        </div>
      </div>

      {/* Unified Register Balance Card (Click to open date picker modal) */}
      <div
        onClick={() => setActiveModal('balance')}
        className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-[#D4AF37] cursor-pointer hover:border-[#D4AF37] transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] shrink-0">
            <Landmark size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-dark text-sm">Daily Cash Register Balances</h4>
              <span className="text-[10px] bg-[#F4F0E6] px-2 py-0.5 rounded-full text-dark/60 font-semibold border border-[#E8DFCF]">
                Click to Select Any Date 📅
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
              <div>
                <span className="text-dark/50 font-medium text-[11px]">Opening Balance: </span>
                <span className="font-bold text-blue-700">₹{Number(stats.todayOpeningBalance || 0).toLocaleString('en-IN')}</span>
              </div>
              <span className="text-dark/30 hidden sm:inline">•</span>
              <div>
                <span className="text-dark/50 font-medium text-[11px]">Closing Balance: </span>
                <span className="font-bold text-emerald-700">₹{Number(stats.todayClosingBalance || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <button className="px-4 py-2 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-xs shrink-0 self-end sm:self-auto">
          Manage Register Balances →
        </button>
      </div>

      {/* Top Cards Grid - 7 Uniform & Crystal-Clear Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4">
        {/* Card 1: Today's Revenue */}
        <div
          onClick={() => setActiveModal('revenue')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-[#D4AF37] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-50 text-[#D4AF37]">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] text-[#D4AF37] bg-[#F4F0E6] px-2 py-0.5 rounded-full font-bold border border-[#E8DFCF]">
              View
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

        {/* Card 2: Appointments Today */}
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

        {/* Card 3: Customers Today */}
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
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
              {stats.pendingPayments > 0 ? 'Action' : 'View'}
            </span>
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

        {/* Card 5: Staff Work Value */}
        <div
          onClick={() => navigate('/staff-work')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-indigo-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText size={18} />
            </div>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
              Register
            </span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[11px] sm:text-xs font-medium text-dark/50 flex items-center justify-between">
              <span>Staff Work Value</span>
              <span className="text-[10px] text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-dark mt-0.5">
              ₹{Number(stats.staffWorkValue || 0).toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Card 6: Staff Present */}
        <div
          onClick={() => setActiveModal('staff')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <UserCheck size={18} />
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              View
            </span>
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

        {/* Card 7: Low Stock */}
        <div
          onClick={() => setActiveModal('low_stock')}
          className="glass-card glass-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group hover:border-red-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-red-50 text-red-600">
              <Package size={18} />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
              {stats.lowStockCount > 0 ? `${stats.lowStockCount} Low` : 'View'}
            </span>
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

      {/* QUICK MODULE ACCESS HUB (Direct Mobile & Desktop 1-Tap Access) */}
      <div className="glass-card p-5 border border-[#E8DFCF] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-[#D4AF37]" />
            <h3 className="font-display text-base font-bold text-dark">Quick Module Access Hub</h3>
          </div>
          <span className="text-[11px] text-dark/50 font-medium">1-Tap Direct Navigation (Mobile & Desktop)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {allModules.map((mod) => {
            const IconComp = mod.icon;
            return (
              <button
                key={mod.route}
                onClick={() => navigate(mod.route)}
                className={`p-3.5 rounded-2xl border ${mod.border} bg-white hover:shadow-md transition-all text-left group flex flex-col justify-between`}
              >
                <div className={`p-2.5 rounded-xl ${mod.color} w-fit group-hover:scale-110 transition-transform`}>
                  <IconComp size={18} />
                </div>
                <div className="mt-3">
                  <h4 className="font-bold text-dark text-xs group-hover:text-[#D4AF37] transition-colors">{mod.title}</h4>
                  <p className="text-[10px] text-dark/40 truncate mt-0.5">{mod.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Split: Revenue Trend & Today's Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Analytics Chart */}
        <div className="lg:col-span-2 glass-card p-6 border border-[#E8DFCF] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-dark">Monthly Revenue Trend</h3>
              <p className="text-xs text-dark/50">Visual revenue performance chart across active months</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              Detailed Reports <ChevronRight size={14} />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#A09885" fontSize={11} tickLine={false} />
                <YAxis stroke="#A09885" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E8DFCF' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Quick Shortcuts & Actions */}
        <div className="space-y-6">
          <div className="glass-card p-6 border border-[#E8DFCF]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-[#D4AF37]" />
              <h3 className="font-display text-lg font-bold text-dark">Quick Operations</h3>
            </div>
            <p className="text-xs text-dark/50 mb-6">Direct access to core salon workflows</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/visits')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#D4AF37] text-white font-semibold text-sm hover:bg-[#C59F2E] transition-all shadow-md"
              >
                <span className="flex items-center gap-2.5">
                  <CalendarCheck size={18} /> Create Customer Visit
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

      {/* ======================= POPUP MODALS FOR STAT CARDS ======================= */}

      {/* 0. Manage Daily Register Balances Modal (With Date Picker) */}
      <Modal isOpen={activeModal === 'balance'} onClose={() => setActiveModal(null)} title="Manage Daily Register Balances">
        <form onSubmit={handleSaveDailyBalance} className="space-y-4 text-xs">
          {/* Date Selector Header Bar */}
          <div className="p-3.5 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-dark text-sm flex items-center gap-1.5">
                <CalendarDays size={16} className="text-[#D4AF37]" /> Select Register Date
              </h4>
            </div>
            <input
              type="date"
              value={selectedBalanceDate}
              onChange={(e) => setSelectedBalanceDate(e.target.value)}
              className="px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs font-bold focus:outline-none focus:border-[#D4AF37] shrink-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-semibold text-blue-800">Date Revenue</span>
              <p className="font-display font-bold text-blue-700 text-lg mt-0.5">₹{(balanceForm.revenue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-semibold text-amber-800">Date Expenses</span>
              <p className="font-display font-bold text-amber-700 text-lg mt-0.5">₹{(balanceForm.expenses || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-dark/70 mb-1">Opening Cash Balance (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={balanceForm.openingBalance}
              onChange={(e) => setBalanceForm({ ...balanceForm, openingBalance: e.target.value })}
              placeholder="e.g. 5000"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-semibold text-dark/70 mb-1">Closing Cash Balance (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={balanceForm.closingBalance}
              onChange={(e) => setBalanceForm({ ...balanceForm, closingBalance: e.target.value })}
              placeholder="e.g. 12000"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-semibold text-dark/70 mb-1">Notes / Register Comments (Optional)</label>
            <textarea
              rows={2}
              value={balanceForm.notes}
              onChange={(e) => setBalanceForm({ ...balanceForm, notes: e.target.value })}
              placeholder="e.g. Opening cash verified by manager. Closing includes evening UPI settlement..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold hover:bg-[#C59F2E] flex items-center gap-1.5"
            >
              <CheckCircle size={15} /> Save Register Balances
            </button>
          </div>
        </form>
      </Modal>

      {/* 1. Today's Revenue Modal */}
      <Modal isOpen={activeModal === 'revenue'} onClose={() => setActiveModal(null)} title="Today's Revenue Breakdown">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">Cash Revenue</p>
              <h4 className="font-display text-xl font-bold text-emerald-700 mt-1">₹{stats.todayCashRevenue.toLocaleString('en-IN')}</h4>
              <p className="text-[10px] text-emerald-600 mt-0.5">{stats.todayCashCount} Cash Invoices</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-[11px] font-bold uppercase text-blue-800 tracking-wider">Online / Card Revenue</p>
              <h4 className="font-display text-xl font-bold text-blue-700 mt-1">₹{stats.todayOnlineRevenue.toLocaleString('en-IN')}</h4>
              <p className="text-[10px] text-blue-600 mt-0.5">{stats.todayOnlineCount} Digital Invoices</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">Advance Wallet Adjusted</p>
              <h4 className="font-display text-xl font-bold text-amber-700 mt-1">₹{(stats.advanceUsedToday || 0).toLocaleString('en-IN')}</h4>
              <p className="text-[10px] text-amber-600 mt-0.5">Prepaid Advance Adjustments</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF] flex justify-between items-center">
            <span className="font-semibold text-dark text-xs">Total Net Revenue Today:</span>
            <span className="font-display text-lg font-bold text-[#D4AF37]">₹{stats.todayRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </Modal>

      {/* 2. Today's Appointments Modal */}
      <Modal isOpen={activeModal === 'appointments'} onClose={() => setActiveModal(null)} title="Today's Booked Appointments">
        <div className="space-y-4">
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {stats.todayAppointmentsList.length === 0 ? (
              <p className="text-xs text-dark/40 py-8 text-center italic">No appointments scheduled for today</p>
            ) : (
              stats.todayAppointmentsList.map((app, idx) => (
                <div key={app.id || idx} className="p-3.5 rounded-2xl bg-white border border-[#E8DFCF] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-dark text-sm block">{app.customer_name || 'Client'}</span>
                    <span className="text-purple-700 font-semibold">{app.service_name || 'Service'}</span>
                    <span className="text-dark/40 text-[10px] block">Stylist: {app.staff_name || 'Assigned Stylist'}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                      ⏰ {app.appointment_time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* 3. Today's Customers Served Modal */}
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

      {/* 4. Pending Payments Modal & Collect Settlement */}
      <Modal isOpen={activeModal === 'pending'} onClose={() => setActiveModal(null)} title="Pending Payments & Collection">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Pending Collection</p>
              <h4 className="font-display text-2xl font-bold text-amber-700 mt-1">₹{stats.pendingPayments.toLocaleString('en-IN')}</h4>
            </div>
            <button
              onClick={() => {
                setActiveModal(null);
                navigate('/visits');
              }}
              className="px-4 py-2 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] flex items-center gap-1.5 shadow-sm"
            >
              <CalendarCheck size={14} /> View All Customer Visits
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {pendingVisitsList.length === 0 ? (
              <p className="text-xs text-emerald-700 py-8 text-center font-semibold">🎉 All payments are up-to-date! No pending balances.</p>
            ) : (
              pendingVisitsList.map((v) => (
                <div key={v.id} className="p-3.5 rounded-2xl bg-white border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-dark text-sm">{v.visit_number || v.invoice_number}</p>
                    <p className="text-xs text-dark/70 font-semibold">{v.customer_name || 'Walk-in Client'} {v.customer_phone ? `(${v.customer_phone})` : ''}</p>
                    <p className="text-[10px] text-dark/40">Stylist: {v.staff_name || 'Staff'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-display font-bold text-amber-700 text-base">₹{Number(v.remaining_amount || v.total).toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => setSettleInvoice(v)}
                      className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      Clear Payment →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Settle Pending Payment Modal */}
      <Modal isOpen={!!settleInvoice} onClose={() => setSettleInvoice(null)} title={`Collect Payment — ${settleInvoice?.invoice_number}`}>
        <form onSubmit={handleSettlePendingPayment} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF]">
            <p className="text-dark/60">Client: <span className="font-bold text-dark">{settleInvoice?.customer_name || 'Walk-in Client'}</span></p>
            <p className="text-dark/60 mt-0.5">Amount to Collect: <span className="font-display font-bold text-emerald-700 text-lg">₹{Number(settleInvoice?.total || 0).toLocaleString('en-IN')}</span></p>
          </div>

          <div>
            <label className="block font-semibold text-dark/70 mb-2">Select Received Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'upi', 'card'].map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setSettleMethod(pm)}
                  className={`py-2.5 rounded-xl font-bold uppercase transition-all ${
                    settleMethod === pm ? 'bg-[#D4AF37] text-white shadow-md' : 'bg-[#F4F0E6] text-dark/70 border border-[#E8DFCF]'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button type="button" onClick={() => setSettleInvoice(null)} className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700">
              Clear & Mark as Paid
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Staff Present Today Modal */}
      <Modal isOpen={activeModal === 'staff'} onClose={() => setActiveModal(null)} title="Stylists & Staff Present Today">
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Total Staff Present Today</span>
            <span className="font-display text-lg font-bold text-emerald-700">{stats.todayStaffPresentList.length} Stylists</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {stats.todayStaffPresentList.length === 0 ? (
              <p className="text-xs text-dark/40 py-8 text-center italic">No staff attendance marked present today</p>
            ) : (
              stats.todayStaffPresentList.map((st, idx) => (
                <div key={st.id || idx} className="p-3 rounded-xl bg-white border border-[#E8DFCF] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {st.staff_name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-dark">{st.staff_name || 'Stylist'}</p>
                      <p className="text-[10px] text-dark/40">📞 {st.staff_phone || 'N/A'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Present Today
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* 6. Low Stock Inventory Modal */}
      <Modal isOpen={activeModal === 'low_stock'} onClose={() => setActiveModal(null)} title="Low Stock Product Inventory">
        <div className="space-y-4">
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {stats.lowStockProductsList.length === 0 ? (
              <p className="text-xs text-emerald-700 py-8 text-center font-semibold">🎉 All products have healthy stock levels!</p>
            ) : (
              stats.lowStockProductsList.map((prod, idx) => (
                <div key={prod.id || idx} className="p-3 rounded-xl bg-white border border-red-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-dark">{prod.name}</p>
                    <p className="text-[10px] text-dark/50">Category: {prod.category || 'Retail'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600 block">{prod.stock_quantity} left</span>
                    <span className="text-[10px] text-dark/40">Threshold: {prod.low_stock_threshold}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
