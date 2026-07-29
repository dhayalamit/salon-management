const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper: Get today's date strings in YYYY-MM-DD for IST, UTC & Local
function getTodayDateStrings() {
  const d = new Date();
  const utc = d.toISOString().slice(0, 10);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const local = d.toLocaleDateString('en-CA');
  const unique = Array.from(new Set([ist, utc, local])).filter(Boolean);
  return [unique[0], unique[1] || unique[0], unique[2] || unique[0]];
}

// GET /api/dashboard/balance?date=YYYY-MM-DD — Get balance & metrics for specific date
router.get('/balance', authenticate, async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toLocaleDateString('en-CA');

    const balanceQ = await db
      .query('SELECT * FROM daily_balances WHERE date LIKE $1 || \'%\'', [targetDate])
      .catch(() => ({ rows: [] }));
    const balanceRecord = balanceQ.rows[0] || {};

    const revQ = await db
      .query(
        `SELECT COALESCE(SUM(total), 0) AS revenue FROM customer_visits WHERE (created_at::text LIKE $1 || '%' OR cleared_at::text LIKE $1 || '%')`,
        [targetDate]
      )
      .catch(() => ({ rows: [{ revenue: 0 }] }));

    const expQ = await db
      .query(`SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE expense_date::text LIKE $1 || '%'`, [
        targetDate,
      ])
      .catch(() => ({ rows: [{ total: 0 }] }));

    const revenue = Number(revQ.rows[0]?.revenue || 0);
    const expenses = Number(expQ.rows[0]?.total || 0);
    const openingBalance = Number(balanceRecord.opening_balance || 0);
    const closingBalance =
      balanceRecord.closing_balance !== undefined &&
      balanceRecord.closing_balance !== null &&
      balanceRecord.closing_balance !== 0
        ? Number(balanceRecord.closing_balance)
        : Math.max(0, openingBalance + revenue - expenses);

    res.json({
      date: targetDate,
      openingBalance,
      closingBalance,
      revenue,
      expenses,
      notes: balanceRecord.notes || '',
    });
  } catch (err) {
    console.error('Get daily balance error:', err);
    res.status(500).json({ error: 'Failed to fetch daily balance' });
  }
});

// POST /api/dashboard/balance — Save or update Opening & Closing Balance for any date
router.post('/balance', authenticate, async (req, res) => {
  try {
    const { date, openingBalance, closingBalance, notes } = req.body;
    const targetDate = date || new Date().toLocaleDateString('en-CA');

    const existing = await db.query('SELECT id FROM daily_balances WHERE date = $1', [targetDate]);

    if (existing.rows && existing.rows.length > 0) {
      const { rows } = await db.query(
        `UPDATE daily_balances SET opening_balance = $1, closing_balance = $2, notes = $3 WHERE date = $4 RETURNING *`,
        [Number(openingBalance || 0), Number(closingBalance || 0), notes || null, targetDate]
      );
      return res.json(
        rows[0] || { date: targetDate, opening_balance: openingBalance, closing_balance: closingBalance }
      );
    } else {
      const id = db.generateUUID();
      const { rows } = await db.query(
        `INSERT INTO daily_balances (id, date, opening_balance, closing_balance, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id, targetDate, Number(openingBalance || 0), Number(closingBalance || 0), notes || null]
      );
      return res
        .status(201)
        .json(rows[0] || { id, date: targetDate, opening_balance: openingBalance, closing_balance: closingBalance });
    }
  } catch (err) {
    console.error('Save daily balance error:', err);
    res.status(500).json({ error: 'Failed to save daily balance' });
  }
});

// GET /api/dashboard/stats — Return stats computed from Customer Visits
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [d1, d2, d3] = getTodayDateStrings();
    const d = new Date();
    const currentYear = d.getFullYear();
    const currentMonthIndex = d.getMonth();

    const todayRevQuery = db
      .query(
        `SELECT COALESCE(SUM(total), 0) AS revenue
       FROM customer_visits
       WHERE (created_at::text LIKE $1 || '%' OR created_at::text LIKE $2 || '%' OR created_at::text LIKE $3 || '%'
              OR cleared_at::text LIKE $1 || '%' OR cleared_at::text LIKE $2 || '%' OR cleared_at::text LIKE $3 || '%')`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [{ revenue: 0 }] }));

    const todayCashQuery = db
      .query(
        `SELECT COALESCE(SUM(amount_paid), 0) AS total, COUNT(*) AS count
       FROM customer_visits
       WHERE LOWER(COALESCE(payment_method, 'cash')) = 'cash'
         AND (created_at::text LIKE $1 || '%' OR created_at::text LIKE $2 || '%' OR created_at::text LIKE $3 || '%')`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [{ total: 0, count: 0 }] }));

    const todayOnlineQuery = db
      .query(
        `SELECT COALESCE(SUM(amount_paid), 0) AS total, COUNT(*) AS count
       FROM customer_visits
       WHERE LOWER(COALESCE(payment_method, '')) IN ('upi', 'card', 'online')
         AND (created_at::text LIKE $1 || '%' OR created_at::text LIKE $2 || '%' OR created_at::text LIKE $3 || '%')`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [{ total: 0, count: 0 }] }));

    const todayApptsQuery = db
      .query(
        `SELECT COUNT(*) AS count
       FROM appointments
       WHERE (appointment_date::text LIKE $1 || '%' OR appointment_date::text LIKE $2 || '%' OR appointment_date::text LIKE $3 || '%')
         AND LOWER(status) IN ('booked', 'confirmed', 'completed', 'in_progress', 'started')`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [{ count: 0 }] }));

    const todayCustsQuery = db
      .query(
        `SELECT COUNT(DISTINCT customer_id) AS count
       FROM customer_visits
       WHERE (created_at::text LIKE $1 || '%' OR created_at::text LIKE $2 || '%' OR created_at::text LIKE $3 || '%')
         AND customer_id IS NOT NULL`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [{ count: 0 }] }));

    const pendingPayQuery = db
      .query(
        `SELECT COALESCE(SUM(remaining_amount), 0) AS pending FROM customer_visits WHERE remaining_amount > 0 OR payment_status IN ('Pending', 'Partial')`
      )
      .catch(() => ({ rows: [{ pending: 0 }] }));

    const paidPayQuery = db
      .query(`SELECT COALESCE(SUM(amount_paid), 0) AS paid FROM customer_visits`)
      .catch(() => ({ rows: [{ paid: 0 }] }));

    const staffPresQuery = db
      .query(
        `SELECT COUNT(*) AS count FROM attendance WHERE (date::text LIKE $1 || '%' OR date::text LIKE $2 || '%' OR date::text LIKE $3 || '%') AND LOWER(status) = 'present'`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [{ count: 0 }] }));

    const lowStockQuery = db
      .query(`SELECT COUNT(*) AS count FROM products WHERE stock_quantity <= low_stock_threshold`)
      .catch(() => ({ rows: [{ count: 0 }] }));

    const todayVisitsQuery = db
      .query(
        `SELECT v.id, v.visit_number, v.total, v.amount_paid, v.remaining_amount, v.payment_method, v.payment_status, v.created_at, v.cleared_at,
              c.name AS customer_name, c.phone AS customer_phone,
              s.name AS staff_name
       FROM customer_visits v
       LEFT JOIN customers c ON c.id::text = v.customer_id::text
       LEFT JOIN staff s ON s.id::text = v.staff_id::text
       WHERE (v.created_at::text LIKE $1 || '%' OR v.created_at::text LIKE $2 || '%' OR v.created_at::text LIKE $3 || '%'
              OR v.cleared_at::text LIKE $1 || '%' OR v.cleared_at::text LIKE $2 || '%' OR v.cleared_at::text LIKE $3 || '%')
       ORDER BY v.created_at DESC`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [] }));

    const todayAppointmentsQuery = db
      .query(
        `SELECT a.*, c.name AS customer_name, c.phone AS customer_phone,
              s.name AS staff_name, sv.name AS service_name, sv.price AS service_price
       FROM appointments a
       LEFT JOIN customers c ON c.id::text = a.customer_id::text
       LEFT JOIN staff s ON s.id::text = a.staff_id::text
       LEFT JOIN services sv ON sv.id::text = a.service_id::text
       WHERE (a.appointment_date::text LIKE $1 || '%' OR a.appointment_date::text LIKE $2 || '%' OR a.appointment_date::text LIKE $3 || '%')
       ORDER BY a.appointment_time ASC`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [] }));

    const lowStockItemsQuery = db
      .query(`SELECT * FROM products WHERE stock_quantity <= low_stock_threshold ORDER BY stock_quantity ASC`)
      .catch(() => ({ rows: [] }));

    const todayStaffQuery = db
      .query(
        `SELECT att.*, st.name AS staff_name, st.phone AS staff_phone
       FROM attendance att
       LEFT JOIN staff st ON st.id::text = att.staff_id::text
       WHERE (att.date::text LIKE $1 || '%' OR att.date::text LIKE $2 || '%' OR att.date::text LIKE $3 || '%') AND LOWER(att.status) = 'present'`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [] }));

    const todayExpensesQuery = db
      .query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE (expense_date::text LIKE $1 || '%' OR expense_date::text LIKE $2 || '%' OR expense_date::text LIKE $3 || '%')`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [{ total: 0 }] }));

    const todayStaffWorkQuery = db
      .query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM staff_work_entries WHERE (date::text LIKE $1 || '%' OR date::text LIKE $2 || '%' OR date::text LIKE $3 || '%')`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [{ total: 0 }] }));

    const dailyBalanceQuery = db
      .query(
        `SELECT * FROM daily_balances WHERE (date LIKE $1 || '%' OR date LIKE $2 || '%' OR date LIKE $3 || '%') ORDER BY created_at DESC LIMIT 1`,
        [d1, d2, d3]
      )
      .catch(() => ({ rows: [] }));

    const [
      todayRev,
      todayCash,
      todayOnline,
      todayAppts,
      todayCusts,
      pendingPay,
      paidPay,
      staffPres,
      lowStock,
      todayVisits,
      todayAppointments,
      lowStockItems,
      todayStaff,
      todayExpenses,
      todayStaffWork,
      dailyBalance,
    ] = await Promise.all([
      todayRevQuery,
      todayCashQuery,
      todayOnlineQuery,
      todayApptsQuery,
      todayCustsQuery,
      pendingPayQuery,
      paidPayQuery,
      staffPresQuery,
      lowStockQuery,
      todayVisitsQuery,
      todayAppointmentsQuery,
      lowStockItemsQuery,
      todayStaffQuery,
      todayExpensesQuery,
      todayStaffWorkQuery,
      dailyBalanceQuery,
    ]);

    const cashAmount = Number(todayCash.rows[0]?.total || 0);
    const cashCount = Number(todayCash.rows[0]?.count || 0);
    const onlineAmount = Number(todayOnline.rows[0]?.total || 0);
    const onlineCount = Number(todayOnline.rows[0]?.count || 0);
    const totalRevenue = Number(todayRev.rows[0]?.revenue || cashAmount + onlineAmount);
    const totalExpenses = Number(todayExpenses.rows[0]?.total || 0);
    const staffWorkValue = Number(todayStaffWork.rows[0]?.total || 0);

    const balanceRecord = dailyBalance.rows[0] || {};
    const openingBalance = Number(balanceRecord.opening_balance || 0);
    const closingBalance =
      balanceRecord.closing_balance !== undefined &&
      balanceRecord.closing_balance !== null &&
      balanceRecord.closing_balance !== 0
        ? Number(balanceRecord.closing_balance)
        : Math.max(0, openingBalance + totalRevenue - totalExpenses);

    // Calculate actual monthly revenue trend from customer_visits
    const monthlyRevenueTrend = [];
    for (let m = 0; m <= currentMonthIndex; m++) {
      const monthNum = m + 1;
      const monthStr = String(monthNum).padStart(2, '0');
      const startOfMonth = `${currentYear}-${monthStr}-01`;
      const lastDay = new Date(currentYear, monthNum, 0).getDate();
      const endOfMonth = `${currentYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

      const revRes = await db
        .query(
          `SELECT COALESCE(SUM(total), 0) AS revenue
         FROM customer_visits
         WHERE created_at::text >= $1 AND created_at::text <= $2`,
          [startOfMonth, `${endOfMonth} 23:59:59`]
        )
        .catch(() => ({ rows: [{ revenue: 0 }] }));

      monthlyRevenueTrend.push({
        month: MONTH_NAMES_SHORT[m],
        revenue: Number(revRes.rows[0]?.revenue || 0),
      });
    }

    const recentVisits = await db
      .query(
        `SELECT v.id, v.visit_number, v.total, v.amount_paid, v.remaining_amount, v.payment_method, v.payment_status, v.created_at, c.name AS customer_name
       FROM customer_visits v
       LEFT JOIN customers c ON c.id::text = v.customer_id::text
       ORDER BY v.created_at DESC LIMIT 5`
      )
      .catch(() => ({ rows: [] }));

    const upcomingAppointments = await db
      .query(
        `SELECT a.*, c.name AS customer_name, s.name AS staff_name, sv.name AS service_name
       FROM appointments a
       LEFT JOIN customers c ON c.id::text = a.customer_id::text
       LEFT JOIN staff s ON s.id::text = a.staff_id::text
       LEFT JOIN services sv ON sv.id::text = a.service_id::text
       WHERE a.appointment_date::text >= $1
       ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 5`,
        [d1]
      )
      .catch(() => ({ rows: [] }));

    res.json({
      todayRevenue: totalRevenue,
      todayCashRevenue: cashAmount,
      todayCashCount: cashCount,
      todayOnlineRevenue: onlineAmount,
      todayOnlineCount: onlineCount,
      todayExpenses: totalExpenses,
      staffWorkValue,
      todayOpeningBalance: openingBalance,
      todayClosingBalance: closingBalance,
      todayBalanceNotes: balanceRecord.notes || '',
      todayAppointments: Number(todayAppts.rows[0]?.count || 0),
      todayCustomers: Number(todayCusts.rows[0]?.count || 0),
      pendingPayments: Number(pendingPay.rows[0]?.pending || 0),
      paidPayments: Number(paidPay.rows[0]?.paid || 0),
      staffPresent: Number(staffPres.rows[0]?.count || 0),
      lowStockCount: Number(lowStock.rows[0]?.count || 0),
      todayVisitsList: todayVisits.rows || [],
      todayInvoicesList: todayVisits.rows || [], // backwards compatibility alias
      todayAppointmentsList: todayAppointments.rows || [],
      lowStockProductsList: lowStockItems.rows || [],
      todayStaffPresentList: todayStaff.rows || [],
      monthlyRevenueTrend,
      recentVisits: recentVisits.rows || [],
      recentInvoices: recentVisits.rows || [], // backwards compatibility alias
      upcomingAppointments: upcomingAppointments.rows || [],
    });
  } catch (err) {
    console.error('Fetch dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
