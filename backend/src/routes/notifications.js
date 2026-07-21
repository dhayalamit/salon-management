const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');

    const [appts, lowStock, outOfStock, pendingBills, customers] = await Promise.all([
      db.query(
        `SELECT a.*, c.name AS customer_name, s.name AS staff_name, sv.name AS service_name
         FROM appointments a
         LEFT JOIN customers c ON c.id = a.customer_id
         LEFT JOIN staff s ON s.id = a.staff_id
         LEFT JOIN services sv ON sv.id = a.service_id
         WHERE a.appointment_date = $1
         ORDER BY a.appointment_time ASC`,
        [today]
      ),
      db.query(
        `SELECT * FROM products WHERE stock_quantity > 0 AND stock_quantity <= low_stock_threshold ORDER BY stock_quantity ASC`
      ),
      db.query(`SELECT * FROM products WHERE stock_quantity <= 0 ORDER BY name ASC`),
      db.query(
        `SELECT i.*, c.name AS customer_name FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE i.payment_method = 'pending'`
      ),
      db.query(`SELECT * FROM customers WHERE birthday IS NOT NULL`),
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

    const pendingPayAlerts = (pendingBills.rows || []).map((b) => ({
      id: `pay-${b.id}`,
      type: 'pending_payment',
      title: `Pending Payment: Invoice #${b.invoice_number}`,
      message: `${b.customer_name || 'Client'} — ₹${b.total}`,
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

    const notifications = [
      ...reminders,
      ...outStockAlerts,
      ...stockAlerts,
      ...birthdayReminders,
      ...pendingPayAlerts,
      ...newBookings,
    ];

    res.json({
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
