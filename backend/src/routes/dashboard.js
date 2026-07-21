const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper: Get local date YYYY-MM-DD
function getLocalDateString() {
  return new Date().toLocaleDateString('en-CA');
}

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = getLocalDateString();
    const d = new Date();
    const currentYear = d.getFullYear();
    const currentMonthIndex = d.getMonth(); // 0-indexed (e.g. 6 for July)

    const [todayRev, todayAppts, todayCusts, pendingPay, staffPres, lowStock] = await Promise.all([
      db.query(
        `SELECT COALESCE(SUM(total), 0) AS revenue FROM invoices WHERE created_at::date = $1::date`,
        [today]
      ),
      db.query(`SELECT COUNT(*) AS count FROM appointments WHERE appointment_date::date = $1::date`, [today]),
      db.query(
        `SELECT COUNT(DISTINCT customer_id) AS count FROM invoices WHERE created_at::date = $1::date AND customer_id IS NOT NULL`,
        [today]
      ),
      db.query(`SELECT COALESCE(SUM(total), 0) AS pending FROM invoices WHERE payment_method = 'pending'`),
      db.query(`SELECT COUNT(*) AS count FROM attendance WHERE date::date = $1::date AND status = 'present'`, [today]),
      db.query(`SELECT COUNT(*) AS count FROM products WHERE stock_quantity <= low_stock_threshold`),
    ]);

    // Calculate actual monthly revenue trend for Jan through current month of the current year
    const monthlyRevenueTrend = [];
    for (let m = 0; m <= currentMonthIndex; m++) {
      const monthNum = m + 1;
      const monthStr = String(monthNum).padStart(2, '0');
      const startOfMonth = `${currentYear}-${monthStr}-01`;
      const lastDay = new Date(currentYear, monthNum, 0).getDate();
      const endOfMonth = `${currentYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

      const revRes = await db.query(
        `SELECT COALESCE(SUM(total), 0) AS revenue
         FROM invoices
         WHERE created_at::date >= $1::date AND created_at::date <= $2::date`,
        [startOfMonth, endOfMonth]
      );

      monthlyRevenueTrend.push({
        month: MONTH_NAMES_SHORT[m],
        revenue: Number(revRes.rows[0]?.revenue || 0),
      });
    }

    const recentInvoices = await db.query(
      `SELECT i.id, i.invoice_number, i.total, i.payment_method, i.created_at, c.name AS customer_name
       FROM invoices i
       LEFT JOIN customers c ON c.id::text = i.customer_id::text
       ORDER BY i.created_at DESC LIMIT 5`
    );

    const upcomingAppointments = await db.query(
      `SELECT a.*, c.name AS customer_name, s.name AS staff_name, sv.name AS service_name
       FROM appointments a
       LEFT JOIN customers c ON c.id::text = a.customer_id::text
       LEFT JOIN staff s ON s.id::text = a.staff_id::text
       LEFT JOIN services sv ON sv.id::text = a.service_id::text
       WHERE a.appointment_date::date >= $1::date
       ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 5`,
      [today]
    );

    res.json({
      todayRevenue: Number(todayRev.rows[0]?.revenue || 0),
      todayAppointments: Number(todayAppts.rows[0]?.count || 0),
      todayCustomers: Number(todayCusts.rows[0]?.count || 0),
      pendingPayments: Number(pendingPay.rows[0]?.pending || 0),
      staffPresent: Number(staffPres.rows[0]?.count || 0),
      lowStockCount: Number(lowStock.rows[0]?.count || 0),
      monthlyRevenueTrend,
      recentInvoices: recentInvoices.rows || [],
      upcomingAppointments: upcomingAppointments.rows || [],
    });
  } catch (err) {
    console.error('Fetch dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
