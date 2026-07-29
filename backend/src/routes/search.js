const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/search?q=query
router.get('/', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ customers: [], appointments: [], visits: [], products: [], staff: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    const [customers, appointments, visits, products, staff] = await Promise.all([
      db.query(
        `SELECT id, name, phone, gender FROM customers WHERE name ILIKE $1 OR phone ILIKE $1 LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT a.id, a.appointment_date, a.appointment_time, a.status, c.name AS customer_name, sv.name AS service_name
         FROM appointments a
         LEFT JOIN customers c ON c.id::text = a.customer_id::text
         LEFT JOIN services sv ON sv.id::text = a.service_id::text
         WHERE c.name ILIKE $1 OR sv.name ILIKE $1 OR a.appointment_date::text ILIKE $1 LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT v.id, v.visit_number, v.total, v.payment_method, c.name AS customer_name
         FROM customer_visits v
         LEFT JOIN customers c ON c.id::text = v.customer_id::text
         WHERE v.visit_number ILIKE $1 OR c.name ILIKE $1 LIMIT 5`,
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
      visits: visits.rows || [],
      invoices: visits.rows || [], // backwards compatibility alias
      products: products.rows || [],
      staff: staff.rows || [],
    });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

module.exports = router;
