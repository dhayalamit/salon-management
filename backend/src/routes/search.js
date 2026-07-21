const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/search?q=query
router.get('/', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ customers: [], appointments: [], invoices: [], products: [], staff: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    const [customers, appointments, invoices, products, staff] = await Promise.all([
      db.query(
        `SELECT id, name, phone, gender FROM customers WHERE name ILIKE $1 OR phone ILIKE $1 LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT a.id, a.appointment_date, a.appointment_time, a.status, c.name AS customer_name, sv.name AS service_name
         FROM appointments a
         LEFT JOIN customers c ON c.id = a.customer_id
         LEFT JOIN services sv ON sv.id = a.service_id
         WHERE c.name ILIKE $1 OR sv.name ILIKE $1 OR a.appointment_date::text ILIKE $1 LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT i.id, i.invoice_number, i.total, i.payment_method, c.name AS customer_name
         FROM invoices i
         LEFT JOIN customers c ON c.id = i.customer_id
         WHERE i.invoice_number ILIKE $1 OR c.name ILIKE $1 LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT id, name, category, selling_price, stock_quantity FROM products WHERE name ILIKE $1 OR category ILIKE $1 LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT id, name, phone, status FROM staff WHERE name ILIKE $1 OR phone ILIKE $1 LIMIT 5`,
        [searchTerm]
      ),
    ]);

    res.json({
      customers: customers.rows || [],
      appointments: appointments.rows || [],
      invoices: invoices.rows || [],
      products: products.rows || [],
      staff: staff.rows || [],
    });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

module.exports = router;
