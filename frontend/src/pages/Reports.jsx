import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  CalendarDays,
  Scissors,
  Package,
  Award,
  Download,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import Table from '../components/ui/Table.jsx';
import { useToast } from '../context/ToastContext.jsx';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function Reports() {
  const { showSuccess, showError } = useToast();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedYear, selectedMonth]);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const res = await client.get('/reports/monthly', {
        params: { year: selectedYear, month: selectedMonth },
      });
      setReportData(res.data);
    } catch (err) {
      showError('Failed to load monthly analytics report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const summary = reportData.summary;
    const csvContent =
      `Month,Year,Total Revenue,Net Revenue,Total GST,Total Appointments,Customers Served,Products Sold,Salary Paid,Commission Paid\n` +
      `"${MONTH_NAMES[selectedMonth - 1]}",${selectedYear},${summary.totalRevenue},${summary.netRevenue},${summary.totalGst},${summary.totalAppointments},${summary.totalCustomersServed},${summary.totalProductsSold},${summary.totalSalaryPaid},${summary.totalCommissionPaid}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Salon_Report_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Monthly report exported to CSV successfully');
  };

  const summary = reportData?.summary || {};
  const growth = reportData?.growth || {};

  const yearsList = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  const serviceColumns = [
    {
      header: 'Service Name',
      render: (row) => <span className="font-semibold text-dark">{row.name}</span>,
    },
    {
      header: 'Total Bookings',
      render: (row) => <span className="font-mono text-xs text-dark/70 font-semibold">{row.bookings_count}</span>,
    },
    {
      header: 'Revenue Generated',
      render: (row) => (
        <span className="font-display font-bold text-dark text-sm">
          ₹{Number(row.total_revenue).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  const staffColumns = [
    {
      header: 'Stylist Name',
      render: (row) => <span className="font-semibold text-dark">{row.staff_name}</span>,
    },
    {
      header: 'Bills Processed',
      render: (row) => <span className="font-mono text-xs text-dark/70 font-semibold">{row.bills_count || 0}</span>,
    },
    {
      header: 'Total Revenue Generated',
      render: (row) => (
        <span className="font-display font-bold text-[#D4AF37] text-sm">
          ₹{Number(row.total_sales || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner & Month/Year Selectors */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 border border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="section-badge py-0.5 px-3 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF] animate-pulse" />
              BUSINESS INTELLIGENCE
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Monthly Reports & Historical Analytics
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Month-by-month financial performance, growth trends, service breakdown, and payroll records
          </p>
        </div>

        {/* Month & Year Selectors Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-[#E2E8F0] shadow-xs">
          {/* Select Month */}
          <div>
            <label className="block text-[9px] font-mono font-bold uppercase text-[#64748B] px-1">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer border border-[#E2E8F0]"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={mName} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Select Year */}
          <div>
            <label className="block text-[9px] font-mono font-bold uppercase text-[#64748B] px-1">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer border border-[#E2E8F0]"
            >
              {yearsList.map((yVal) => (
                <option key={yVal} value={yVal}>
                  {yVal}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="btn-accent px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 shadow-accent"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center glass-card">
          <span className="w-8 h-8 border-3 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin inline-block mb-3" />
          <p className="text-xs font-semibold text-dark/60">Generating monthly analytics report...</p>
        </div>
      ) : (
        <>
          {/* Monthly Comparison Growth Metrics (vs Previous Month) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Growth */}
            <div className="glass-card p-4 flex items-center justify-between border-l-4 border-emerald-500">
              <div>
                <p className="text-[10px] font-bold uppercase text-dark/50">Revenue Growth</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display text-xl font-bold text-dark">
                    ₹{Number(summary.totalRevenue || 0).toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`text-xs font-bold flex items-center ${
                      growth.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {growth.revenueGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {growth.revenueGrowth >= 0 ? `+${growth.revenueGrowth}%` : `${growth.revenueGrowth}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Appointment Growth */}
            <div className="glass-card p-4 flex items-center justify-between border-l-4 border-blue-500">
              <div>
                <p className="text-[10px] font-bold uppercase text-dark/50">Appointments Growth</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display text-xl font-bold text-dark">{summary.totalAppointments || 0}</span>
                  <span
                    className={`text-xs font-bold flex items-center ${
                      growth.appointmentGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {growth.appointmentGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {growth.appointmentGrowth >= 0 ? `+${growth.appointmentGrowth}%` : `${growth.appointmentGrowth}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Growth */}
            <div className="glass-card p-4 flex items-center justify-between border-l-4 border-purple-500">
              <div>
                <p className="text-[10px] font-bold uppercase text-dark/50">Customer Growth</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display text-xl font-bold text-dark">{summary.totalCustomersServed || 0}</span>
                  <span
                    className={`text-xs font-bold flex items-center ${
                      growth.customerGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {growth.customerGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {growth.customerGrowth >= 0 ? `+${growth.customerGrowth}%` : `${growth.customerGrowth}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Sales Growth */}
            <div className="glass-card p-4 flex items-center justify-between border-l-4 border-[#D4AF37]">
              <div>
                <p className="text-[10px] font-bold uppercase text-dark/50">Product Sales Growth</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display text-xl font-bold text-dark">
                    ₹{Number(summary.totalProductRevenue || 0).toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`text-xs font-bold flex items-center ${
                      growth.productSalesGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {growth.productSalesGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {growth.productSalesGrowth >= 0 ? `+${growth.productSalesGrowth}%` : `${growth.productSalesGrowth}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 8 Detailed Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 space-y-1">
              <p className="text-[10px] font-bold uppercase text-dark/50">Total Gross Revenue</p>
              <h3 className="font-display text-2xl font-bold text-dark">
                ₹{Number(summary.totalRevenue || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-dark/40">Includes ₹{Number(summary.totalGst || 0).toLocaleString('en-IN')} GST</p>
            </div>

            <div className="glass-card p-5 space-y-1">
              <p className="text-[10px] font-bold uppercase text-dark/50">Net Salon Revenue</p>
              <h3 className="font-display text-2xl font-bold text-emerald-600">
                ₹{Number(summary.netRevenue || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-dark/40">Discounts: ₹{Number(summary.totalDiscounts || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="glass-card p-5 space-y-1">
              <p className="text-[10px] font-bold uppercase text-dark/50">Staff Payroll Paid</p>
              <h3 className="font-display text-2xl font-bold text-amber-600">
                ₹{Number(summary.totalSalaryPaid || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-dark/40">Monthly staff salary disbursements</p>
            </div>

            <div className="glass-card p-5 space-y-1">
              <p className="text-[10px] font-bold uppercase text-dark/50">Staff Commission Paid</p>
              <h3 className="font-display text-2xl font-bold text-purple-600">
                ₹{Number(summary.totalCommissionPaid || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-dark/40">Commission rewards paid</p>
            </div>
          </div>

          {/* Payment Method Breakdown Cards */}
          <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
            <h3 className="font-display text-lg font-bold text-dark">Payment Method Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] font-bold uppercase text-emerald-800">Cash Payments</p>
                <h4 className="font-display text-lg font-bold text-emerald-900 mt-1">
                  ₹{Number(summary.cashPayments || 0).toLocaleString('en-IN')}
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <p className="text-[10px] font-bold uppercase text-blue-800">UPI / Online</p>
                <h4 className="font-display text-lg font-bold text-blue-900 mt-1">
                  ₹{Number(summary.upiPayments || 0).toLocaleString('en-IN')}
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <p className="text-[10px] font-bold uppercase text-purple-800">Card Payments</p>
                <h4 className="font-display text-lg font-bold text-purple-900 mt-1">
                  ₹{Number(summary.cardPayments || 0).toLocaleString('en-IN')}
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <p className="text-[10px] font-bold uppercase text-amber-800">Pending Payments</p>
                <h4 className="font-display text-lg font-bold text-amber-900 mt-1">
                  ₹{Number(summary.pendingPayments || 0).toLocaleString('en-IN')}
                </h4>
              </div>
            </div>
          </div>

          {/* Tables: Top Services & Staff Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
              <h3 className="font-display text-lg font-bold text-dark">Service Performance ({MONTH_NAMES[selectedMonth - 1]})</h3>
              <Table columns={serviceColumns} data={reportData?.servicesBreakdown || []} loading={false} />
            </div>

            <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
              <h3 className="font-display text-lg font-bold text-dark">Stylist Revenue Performance</h3>
              <Table columns={staffColumns} data={reportData?.staffPerformance || []} loading={false} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
