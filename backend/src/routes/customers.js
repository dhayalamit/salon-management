const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers?search=&gender=&page=&limit=
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, gender } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }

    if (gender && gender !== 'all') {
      params.push(gender);
      where += ` AND c.gender = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT c.*,
              COALESCE(inv.visit_count, 0) AS visit_count,
              COALESCE(inv.total_spent, 0) AS total_spent,
              inv.last_visit_date,
              app.next_appointment_date
       FROM customers c
       LEFT JOIN (
         SELECT customer_id, COUNT(*) AS visit_count, SUM(total) AS total_spent, MAX(created_at) AS last_visit_date
         FROM invoices
         WHERE customer_id IS NOT NULL
         GROUP BY customer_id
       ) inv ON inv.customer_id = c.id
       LEFT JOIN (
         SELECT customer_id, MIN(appointment_date) AS next_appointment_date
         FROM appointments
         WHERE customer_id IS NOT NULL AND status = 'booked' AND appointment_date >= CURRENT_DATE
         GROUP BY customer_id
       ) app ON app.customer_id = c.id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id  — profile with lifetime stats + visit history
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const customerQ = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (!customerQ.rows[0]) return res.status(404).json({ error: 'Customer not found' });

    const lifetime = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS lifetime_spend, COUNT(*) AS visit_count
       FROM invoices WHERE customer_id = $1`,
      [id]
    );

    const history = await db.query(
      `SELECT i.id, i.invoice_number, i.total, i.discount, i.payment_method, i.next_appointment_date,
              i.created_at, s.name AS staff_name
       FROM invoices i
       LEFT JOIN staff s ON s.id = i.staff_id
       WHERE i.customer_id = $1
       ORDER BY i.created_at DESC`,
      [id]
    );

    res.json({
      ...customerQ.rows[0],
      lifetimeSpend: Number(lifetime.rows[0]?.lifetime_spend || 0),
      visitCount: Number(lifetime.rows[0]?.visit_count || 0),
      history: history.rows || [],
    });
  } catch (err) {
    console.error('Fetch customer profile error:', err);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// POST /api/customers
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, phone, gender, birthday, notes, email, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const id = db.generateUUID();
    const { rows } = await db.query(
      `INSERT INTO customers (id, name, phone, gender, birthday, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, name, phone || null, gender || 'other', birthday || null, notes || null]
    );
    
    // Return created customer (fallback object if RETURNING array empty)
    const created = rows[0] || { id, name, phone, gender, birthday, notes };
    res.status(201).json(created);
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, gender, birthday, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE customers SET name = COALESCE($1,name), phone = COALESCE($2,phone), gender = COALESCE($3,gender),
         birthday = COALESCE($4,birthday), notes = COALESCE($5,notes) WHERE id = $6 RETURNING *`,
      [name, phone, gender, birthday, notes, req.params.id]
    );
    res.json(rows[0] || { id: req.params.id, name, phone, gender, birthday, notes });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
