const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');

    const [appts, lowStock, outOfStock, pendingVisits, customers, lowAdvanceCusts] = await Promise.all([
      db.query(
        `SELECT a.*, c.name AS customer_name, s.name AS staff_name, sv.name AS service_name
         FROM appointments a
         LEFT JOIN customers c ON c.id::text = a.customer_id::text
         LEFT JOIN staff s ON s.id::text = a.staff_id::text
         LEFT JOIN services sv ON sv.id::text = a.service_id::text
         WHERE a.appointment_date = $1
         ORDER BY a.appointment_time ASC`,
        [today]
      ),
      db.query(
        `SELECT * FROM products WHERE stock_quantity > 0 AND stock_quantity <= low_stock_threshold ORDER BY stock_quantity ASC`
      ),
      db.query(`SELECT * FROM products WHERE stock_quantity <= 0 ORDER BY name ASC`),
      db.query(
        `SELECT v.*, c.name AS customer_name FROM customer_visits v LEFT JOIN customers c ON c.id::text = v.customer_id::text WHERE v.remaining_amount > 0 OR v.payment_status IN ('Pending', 'Partial')`
      ),
      db.query(`SELECT * FROM customers WHERE birthday IS NOT NULL`),
      db.query(`SELECT * FROM customers WHERE (is_permanent::text IN ('true', '1') OR COALESCE(advance_balance, 0) > 0) AND advance_balance <= 500`),
    ]);

    // Calculate 30 min reminders
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const reminders = [];
    (appts.rows || []).forEach((app) => {
      const [h, m] = (app.appointment_time || '00:00').split(':').map(Number);
      const appMins = h * 60 + m;
      const diff = appMins - currentMins;

      if (diff >= 0 && diff <= 45 && app.status === 'booked') {
        reminders.push({
          id: `rem-${app.id}`,
          type: 'reminder',
          title: `Appointment Reminder: ${app.customer_name || 'Client'}`,
          message: `Scheduled for ${app.service_name || 'Service'} at ${app.appointment_time} (${diff} mins away)`,
          time: app.appointment_time,
        });
      }
    });

    const newBookings = (appts.rows || []).map((app) => ({
      id: `bk-${app.id}`,
      type: 'booking',
      title: `Today's Booking: ${app.customer_name || 'Client'}`,
      message: `${app.service_name || 'Service'} with ${app.staff_name || 'Stylist'} at ${app.appointment_time}`,
      time: app.appointment_time,
    }));

    const stockAlerts = (lowStock.rows || []).map((p) => ({
      id: `ls-${p.id}`,
      type: 'low_stock',
      title: `Low Stock Alert: ${p.name}`,
      message: `Only ${p.stock_quantity} units remaining (Threshold: ${p.low_stock_threshold})`,
    }));

    const outStockAlerts = (outOfStock.rows || []).map((p) => ({
      id: `os-${p.id}`,
      type: 'out_of_stock',
      title: `Out of Stock: ${p.name}`,
      message: `Product is completely out of stock!`,
    }));

    const pendingPayAlerts = (pendingVisits.rows || []).map((v) => ({
      id: `pay-${v.id}`,
      type: 'pending_payment',
      title: `Pending Visit Payment: Visit #${v.visit_number}`,
      message: `${v.customer_name || 'Client'} — Remaining ₹${v.remaining_amount || v.total}`,
    }));

    // Customer Birthday Reminders
    const todayMD = today.slice(5); // MM-DD
    const birthdayReminders = (customers.rows || [])
      .filter((c) => c.birthday && c.birthday.includes(todayMD))
      .map((c) => ({
        id: `bday-${c.id}`,
        type: 'birthday',
        title: `🎂 Customer Birthday: ${c.name}`,
        message: `Wish ${c.name} a Happy Birthday today! Phone: ${c.phone || 'N/A'}`,
      }));

    // Advance Wallet Reminders
    const advanceAlerts = (lowAdvanceCusts.rows || []).map((c) => ({
      id: `adv-${c.id}`,
      type: 'low_advance',
      title: Number(c.advance_balance || 0) === 0 ? `⚠️ Zero Advance Balance: ${c.name}` : `⚠️ Low Advance Balance: ${c.name}`,
      message: `Current Advance Balance: ₹${Number(c.advance_balance || 0).toLocaleString('en-IN')}. Phone: ${c.phone || 'N/A'}`,
    }));

    const notifications = [
      ...reminders,
      ...outStockAlerts,
      ...stockAlerts,
      ...advanceAlerts,
      ...birthdayReminders,
      ...pendingPayAlerts,
      ...newBookings,
    ];

    res.json({
      notifications,
      unreadCount: notifications.length,
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
