const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/staff — List all staff with today's real-time attendance status
router.get('/', authenticate, async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    const { rows } = await db.query(
      `SELECT s.*,
              COALESCE(att.today_status, 'not_marked') AS today_status
       FROM staff s
       LEFT JOIN (
         SELECT staff_id::text AS staff_id, status AS today_status
         FROM attendance
         WHERE (substr(date::text, 1, 10) = $1 OR date::date = $1::date)
       ) att ON att.staff_id = s.id::text
       ORDER BY s.created_at DESC`,
      [today]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch staff error:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// GET /api/staff/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const staffQ = await db.query('SELECT * FROM staff WHERE id = $1', [id]);
    if (!staffQ.rows[0]) return res.status(404).json({ error: 'Staff member not found' });

    const attendanceQ = await db.query('SELECT * FROM attendance WHERE staff_id::text = $1 ORDER BY date DESC LIMIT 30', [id]);
    const invoicesQ = await db.query(
      `SELECT i.*, c.name AS customer_name FROM invoices i
       LEFT JOIN customers c ON c.id::text = i.customer_id::text
       WHERE i.staff_id::text = $1 ORDER BY i.created_at DESC LIMIT 20`,
      [id]
    );

    res.json({
      ...staffQ.rows[0],
      attendance: attendanceQ.rows || [],
      salesHistory: invoicesQ.rows || [],
    });
  } catch (err) {
    console.error('Fetch staff profile error:', err);
    res.status(500).json({ error: 'Failed to fetch staff profile' });
  }
});

// POST /api/staff
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, phone, salary, commissionPercent, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const id = db.generateUUID();
    const { rows } = await db.query(
      `INSERT INTO staff (id, name, phone, salary, commission_percent, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, name, phone || null, Number(salary || 0), Number(commissionPercent || 0), status || 'active']
    );
    res.status(201).json(rows[0] || { id, name, phone, salary, commission_percent: commissionPercent, status: 'active' });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// PUT /api/staff/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, salary, commissionPercent, status } = req.body;
    const { rows } = await db.query(
      `UPDATE staff SET name = COALESCE($1,name), phone = COALESCE($2,phone),
         salary = COALESCE($3,salary), commission_percent = COALESCE($4,commission_percent),
         status = COALESCE($5,status) WHERE id = $6 RETURNING *`,
      [name, phone, salary, commissionPercent, status, req.params.id]
    );
    res.json(rows[0] || { id: req.params.id, name, phone });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM staff WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

module.exports = router;
