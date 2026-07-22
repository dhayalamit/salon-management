const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: Calculate percentage change safely
function calcGrowth(current, previous) {
  const c = Number(current || 0);
  const p = Number(previous || 0);
  if (p === 0) return c > 0 ? 100 : 0;
  const val = Math.round(((c - p) / p) * 100);
  return isNaN(val) ? 0 : val;
}

// GET /api/reports/monthly — Historical month-wise analytics report with year & month selectors
router.get('/monthly', authenticate, async (req, res) => {
  try {
    const d = new Date();
    const reqYear = req.query.year ? Number(req.query.year) : d.getFullYear();
    const reqMonth = req.query.month ? Number(req.query.month) : d.getMonth() + 1;

    const monthStr = String(reqMonth).padStart(2, '0');
    const yearMonth = `${reqYear}-${monthStr}`;

    // Date Range: Start of Month & End of Month
    const startDate = `${yearMonth}-01`;
    const lastDayNum = new Date(reqYear, reqMonth, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDayNum).padStart(2, '0')}`;

    // Compute previous month string (YYYY-MM)
    const prevDate = new Date(reqYear, reqMonth - 2, 1);
    const prevMonthStr = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevYearMonth = `${prevDate.getFullYear()}-${prevMonthStr}`;
    const prevStartDate = `${prevYearMonth}-01`;
    const prevLastDayNum = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate();
    const prevEndDate = `${prevYearMonth}-${String(prevLastDayNum).padStart(2, '0')}`;

    // 1. Current Month Revenue & Tax Metrics
    const currentRevRes = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS total_revenue,
              COALESCE(SUM(gst_amount), 0) AS total_gst,
              COALESCE(SUM(discount), 0) AS total_discount,
              COUNT(*) AS invoice_count
       FROM invoices
       WHERE substr(created_at::text, 1, 10) >= $1 AND substr(created_at::text, 1, 10) <= $2`,
      [startDate, endDate]
    );

    const prevRevRes = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS total_revenue,
              COUNT(*) AS invoice_count
       FROM invoices
       WHERE substr(created_at::text, 1, 10) >= $1 AND substr(created_at::text, 1, 10) <= $2`,
      [prevStartDate, prevEndDate]
    );

    const curRev = Number(currentRevRes.rows[0]?.total_revenue || 0);
    const prevRev = Number(prevRevRes.rows[0]?.total_revenue || 0);
    const curGst = Number(currentRevRes.rows[0]?.total_gst || 0);
    const curDiscount = Number(currentRevRes.rows[0]?.total_discount || 0);
    const netRevenue = Math.max(0, curRev - curGst);

    // 2. Current & Previous Month Appointment Metrics
    const currentApptRes = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM appointments
       WHERE appointment_date >= $1 AND appointment_date <= $2
       GROUP BY status`,
      [startDate, endDate]
    );

    const prevApptRes = await db.query(
      `SELECT COUNT(*) AS total
       FROM appointments
       WHERE appointment_date >= $1 AND appointment_date <= $2`,
      [prevStartDate, prevEndDate]
    );

    const apptCounts = {
      total: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      booked: 0,
    };

    (currentApptRes.rows || []).forEach((row) => {
      const c = Number(row.count || 0);
      apptCounts.total += c;
      if (row.status === 'completed') apptCounts.completed += c;
      if (row.status === 'cancelled') apptCounts.cancelled += c;
      if (row.status === 'no_show') apptCounts.no_show += c;
      if (row.status === 'booked') apptCounts.booked += c;
    });

    const prevApptTotal = Number(prevApptRes.rows[0]?.total || 0);

    // 3. Customer Metrics (New vs Returning for month)
    const custServedRes = await db.query(
      `SELECT COUNT(DISTINCT customer_id) AS total_served
       FROM invoices
       WHERE substr(created_at::text, 1, 10) >= $1 AND substr(created_at::text, 1, 10) <= $2 AND customer_id IS NOT NULL`,
      [startDate, endDate]
    );

    const prevCustServedRes = await db.query(
      `SELECT COUNT(DISTINCT customer_id) AS total_served
       FROM invoices
       WHERE substr(created_at::text, 1, 10) >= $1 AND substr(created_at::text, 1, 10) <= $2 AND customer_id IS NOT NULL`,
      [prevStartDate, prevEndDate]
    );

    const newCustRes = await db.query(
      `SELECT COUNT(*) AS new_count
       FROM customers
       WHERE substr(created_at::text, 1, 10) >= $1 AND substr(created_at::text, 1, 10) <= $2`,
      [startDate, endDate]
    );

    const totalCustomersServed = Number(custServedRes.rows[0]?.total_served || 0);
    const prevCustomersServed = Number(prevCustServedRes.rows[0]?.total_served || 0);
    const newCustomersCount = Number(newCustRes.rows[0]?.new_count || 0);
    const returningCustomersCount = Math.max(0, totalCustomersServed - newCustomersCount);

    // 4. Service Breakdown
    const serviceBreakdown = await db.query(
      `SELECT ii.name, COUNT(*) AS bookings_count, COALESCE(SUM(ii.line_total), 0) AS total_revenue
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE substr(i.created_at::text, 1, 10) >= $1 AND substr(i.created_at::text, 1, 10) <= $2 AND ii.item_type = 'service'
       GROUP BY ii.name
       ORDER BY total_revenue DESC`,
      [startDate, endDate]
    );

    const servicesList = serviceBreakdown.rows || [];
    const mostBookedService = servicesList[0]?.name || 'N/A';
    const leastBookedService = servicesList.length > 0 ? servicesList[servicesList.length - 1].name : 'N/A';

    // 5. Retail Products Breakdown
    const productBreakdown = await db.query(
      `SELECT ii.name, COALESCE(SUM(ii.quantity), 0) AS total_qty, COALESCE(SUM(ii.line_total), 0) AS total_revenue
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE substr(i.created_at::text, 1, 10) >= $1 AND substr(i.created_at::text, 1, 10) <= $2 AND ii.item_type = 'product'
       GROUP BY ii.name
       ORDER BY total_revenue DESC`,
      [startDate, endDate]
    );

    const prevProductRes = await db.query(
      `SELECT COALESCE(SUM(ii.line_total), 0) AS total_revenue
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE substr(i.created_at::text, 1, 10) >= $1 AND substr(i.created_at::text, 1, 10) <= $2 AND ii.item_type = 'product'`,
      [prevStartDate, prevEndDate]
    );

    const productsList = productBreakdown.rows || [];
    const totalProductsSold = productsList.reduce((sum, p) => sum + Number(p.total_qty || 0), 0);
    const totalProductRevenue = productsList.reduce((sum, p) => sum + Number(p.total_revenue || 0), 0);
    const prevProductRevenue = Number(prevProductRes.rows[0]?.total_revenue || 0);

    // Stock alert counts
    const stockAlerts = await db.query(
      `SELECT
         COUNT(CASE WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 1 END) AS low_stock,
         COUNT(CASE WHEN stock_quantity <= 0 THEN 1 END) AS out_of_stock
       FROM products`
    );

    // 6. Staff Payroll & Commission Paid for Month
    const staffSalaryRes = await db.query(
      `SELECT COALESCE(SUM(salary_paid), 0) AS total_salary_paid
       FROM staff_payrolls
       WHERE year_month = $1`,
      [yearMonth]
    );

    const staffCommissionRes = await db.query(
      `SELECT COALESCE(SUM(commission_amount), 0) AS total_commission_paid
       FROM staff_commissions
       WHERE date >= $1 AND date <= $2 AND status = 'Paid'`,
      [startDate, endDate]
    );

    const staffPerformance = await db.query(
      `SELECT s.name AS staff_name, COUNT(i.id) AS bills_count, COALESCE(SUM(i.total), 0) AS total_sales
       FROM staff s
       LEFT JOIN invoices i ON i.staff_id = s.id AND substr(i.created_at::text, 1, 10) >= $1 AND substr(i.created_at::text, 1, 10) <= $2
       GROUP BY s.id, s.name
       ORDER BY total_sales DESC`,
      [startDate, endDate]
    );

    const totalSalaryPaid = Number(staffSalaryRes.rows[0]?.total_salary_paid || 0);
    const totalCommissionPaid = Number(staffCommissionRes.rows[0]?.total_commission_paid || 0);

    // 7. Payment Mode Breakdown
    const paymentBreakdownRes = await db.query(
      `SELECT payment_method, COALESCE(SUM(total), 0) AS total_amount, COUNT(*) AS count
       FROM invoices
       WHERE substr(created_at::text, 1, 10) >= $1 AND substr(created_at::text, 1, 10) <= $2
       GROUP BY payment_method`,
      [startDate, endDate]
    );

    const payments = {
      cash: 0,
      upi: 0,
      card: 0,
      pending: 0,
    };

    (paymentBreakdownRes.rows || []).forEach((row) => {
      const pm = (row.payment_method || 'cash').toLowerCase();
      if (payments[pm] !== undefined) {
        payments[pm] = Number(row.total_amount || 0);
      }
    });

    // 8. Monthly Comparison Growth Rates (%)
    const growth = {
      revenueGrowth: calcGrowth(curRev, prevRev),
      customerGrowth: calcGrowth(totalCustomersServed, prevCustomersServed),
      appointmentGrowth: calcGrowth(apptCounts.total, prevApptTotal),
      productSalesGrowth: calcGrowth(totalProductRevenue, prevProductRevenue),
    };

    res.json({
      selectedYear: reqYear,
      selectedMonth: reqMonth,
      yearMonth,
      previousYearMonth: prevYearMonth,
      summary: {
        totalRevenue: curRev,
        totalGst: curGst,
        totalDiscounts: curDiscount,
        netRevenue,
        totalAppointments: apptCounts.total,
        completedAppointments: apptCounts.completed,
        cancelledAppointments: apptCounts.cancelled,
        noShowAppointments: apptCounts.no_show,
        totalCustomersServed,
        newCustomersCount,
        returningCustomersCount,
        mostBookedService,
        leastBookedService,
        totalProductsSold,
        totalProductRevenue,
        lowStockCount: Number(stockAlerts.rows[0]?.low_stock || 0),
        outOfStockCount: Number(stockAlerts.rows[0]?.out_of_stock || 0),
        totalSalaryPaid,
        totalCommissionPaid,
        cashPayments: payments.cash,
        upiPayments: payments.upi,
        cardPayments: payments.card,
        pendingPayments: payments.pending,
      },
      growth,
      servicesBreakdown: servicesList,
      productsBreakdown: productsList,
      staffPerformance: staffPerformance.rows || [],
    });
  } catch (err) {
    console.error('Fetch monthly report error:', err);
    res.status(500).json({ error: 'Failed to generate monthly analytics report' });
  }
});

module.exports = router;
