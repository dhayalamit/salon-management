const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/staff-work — List manual work entries with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { staffId, date, month } = req.query;

    let sql = `
      SELECT swe.*, s.name AS staff_name, s.phone AS staff_phone
      FROM staff_work_entries swe
      LEFT JOIN staff s ON s.id::text = swe.staff_id::text
      WHERE 1=1
    `;
    const params = [];

    if (staffId) {
      params.push(staffId);
      sql += ` AND swe.staff_id::text = $${params.length}`;
    }

    if (date) {
      params.push(date);
      sql += ` AND (swe.date LIKE $${params.length} || '%')`;
    } else if (month) {
      params.push(month);
      sql += ` AND (swe.date LIKE $${params.length} || '%')`;
    }

    sql += ` ORDER BY swe.created_at DESC, swe.date DESC`;

    const { rows } = await db.query(sql, params);

    const totalWorkAmount = (rows || []).reduce((acc, row) => acc + Number(row.amount || 0), 0);

    res.json({
      entries: rows || [],
      totalWorkAmount,
    });
  } catch (err) {
    console.error('Fetch staff work entries error:', err);
    res.status(500).json({ error: 'Failed to fetch staff work entries' });
  }
});

// POST /api/staff-work — Record new manual staff work entry
router.post('/', authenticate, async (req, res) => {
  try {
    const { staffId, description, amount, date } = req.body;
    if (!staffId || !amount) {
      return res.status(400).json({ error: 'Staff member and amount are required' });
    }

    const id = db.generateUUID();
    const entryDate = date || new Date().toISOString().slice(0, 10);

    const { rows } = await db.query(
      `INSERT INTO staff_work_entries (id, staff_id, description, amount, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, staffId, description || null, Number(amount), entryDate]
    );

    // Also fetch staff name for immediate UI display
    const staffQ = await db.query('SELECT name FROM staff WHERE id = $1', [staffId]);
    const staffName = staffQ.rows[0]?.name || 'Staff';

    res.status(201).json({
      ...(rows[0] || { id, staff_id: staffId, description, amount, date: entryDate }),
      staff_name: staffName,
    });
  } catch (err) {
    console.error('Create staff work entry error:', err);
    res.status(500).json({ error: 'Failed to record staff work entry' });
  }
});

// DELETE /api/staff-work/:id — Delete work entry
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM staff_work_entries WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete staff work entry error:', err);
    res.status(500).json({ error: 'Failed to delete work entry' });
  }
});

module.exports = router;
