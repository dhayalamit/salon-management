const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers — List all customers with visit counts
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*,
              COALESCE(vis.visit_count, 0) AS visit_count,
              COALESCE(vis.total_spent, 0) AS total_spent
       FROM customers c
       LEFT JOIN (
         SELECT customer_id, COUNT(*) AS visit_count, SUM(total) AS total_spent
         FROM customer_visits
         GROUP BY customer_id
       ) vis ON vis.customer_id::text = c.id::text
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customer database' });
  }
});

// GET /api/customers/:id — Detailed customer profile
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const customerQ = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (!customerQ.rows[0]) return res.status(404).json({ error: 'Customer not found' });

    const history = await db.query(
      `SELECT v.*, s.name AS staff_name
       FROM customer_visits v
       LEFT JOIN staff s ON s.id::text = v.staff_id::text
       WHERE v.customer_id::text = $1
       ORDER BY v.created_at DESC`,
      [id]
    );

    const lifetime = await db.query(
      `SELECT COUNT(*) AS visit_count, COALESCE(SUM(total), 0) AS total_spent
       FROM customer_visits WHERE customer_id::text = $1`,
      [id]
    );

    res.json({
      ...customerQ.rows[0],
      totalSpent: Number(lifetime.rows[0]?.total_spent || 0),
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
    const { name, phone, gender, birthday, notes, nextAppointmentDate } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const cleanName = name.trim();
    const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;
    const cleanGender = gender && gender.trim() !== '' ? gender.trim() : 'other';
    const cleanBirthday = birthday && birthday.trim() !== '' ? birthday.trim() : null;
    const cleanNotes = notes && notes.trim() !== '' ? notes.trim() : null;
    const cleanNextAppt = nextAppointmentDate && nextAppointmentDate.trim() !== '' ? nextAppointmentDate.trim() : null;

    if (cleanPhone) {
      const existing = await db.query('SELECT id FROM customers WHERE phone = $1', [cleanPhone]);
      if (existing.rows && existing.rows.length > 0) {
        return res.status(400).json({ error: 'A customer with this phone number already exists' });
      }
    }

    const id = db.generateUUID();
    const { rows } = await db.query(
      `INSERT INTO customers (id, name, phone, gender, birthday, notes, next_appointment_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, cleanName, cleanPhone, cleanGender, cleanBirthday, cleanNotes, cleanNextAppt]
    );

    const created = rows[0] || {
      id,
      name: cleanName,
      phone: cleanPhone,
      gender: cleanGender,
      birthday: cleanBirthday,
      notes: cleanNotes,
      next_appointment_date: cleanNextAppt,
      visit_count: 0,
      total_spent: 0,
    };

    res.status(201).json(created);
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: err.message || 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, gender, birthday, notes, nextAppointmentDate } = req.body;
    const cleanName = name ? name.trim() : undefined;
    const cleanPhone = phone !== undefined ? (phone && phone.trim() !== '' ? phone.trim() : null) : undefined;
    const cleanGender = gender ? gender.trim() : undefined;
    const cleanBirthday = birthday !== undefined ? (birthday && birthday.trim() !== '' ? birthday.trim() : null) : undefined;
    const cleanNotes = notes !== undefined ? (notes && notes.trim() !== '' ? notes.trim() : null) : undefined;
    const cleanNextAppt = nextAppointmentDate !== undefined ? (nextAppointmentDate && nextAppointmentDate.trim() !== '' ? nextAppointmentDate.trim() : null) : undefined;

    if (cleanPhone) {
      const existing = await db.query('SELECT id FROM customers WHERE phone = $1 AND id != $2', [cleanPhone, req.params.id]);
      if (existing.rows && existing.rows.length > 0) {
        return res.status(400).json({ error: 'A customer with this phone number already exists' });
      }
    }

    const { rows } = await db.query(
      `UPDATE customers SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         gender = COALESCE($3, gender),
         birthday = COALESCE($4, birthday),
         notes = COALESCE($5, notes),
         next_appointment_date = COALESCE($6, next_appointment_date)
       WHERE id = $7 RETURNING *`,
      [cleanName, cleanPhone, cleanGender, cleanBirthday, cleanNotes, cleanNextAppt, req.params.id]
    );

    res.json(rows[0] || { id: req.params.id, name: cleanName, phone: cleanPhone });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: err.message || 'Failed to update customer' });
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
