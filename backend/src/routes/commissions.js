const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/commissions — list commission logs
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sc.*, s.name AS staff_name, s.phone AS staff_phone, c.name AS customer_name, c.phone AS customer_phone
       FROM staff_commissions sc
       JOIN staff s ON s.id::text = sc.staff_id::text
       LEFT JOIN customers c ON c.id::text = sc.customer_id::text
       ORDER BY sc.date DESC, sc.created_at DESC`
    );

    const commissionsList = (rows || []).map((c) => ({
      ...c,
      status: c.status || 'Pending',
    }));

    res.json(commissionsList);
  } catch (err) {
    console.error('Fetch commissions error:', err);
    res.status(500).json({ error: 'Failed to fetch staff commissions' });
  }
});

// PUT /api/commissions/:id/status — Manually change commission status (Pending / Paid)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Pending' or 'Paid'

    if (!['Pending', 'Paid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Pending or Paid.' });
    }

    const adminUser = req.user?.name || 'Administrator';
    const pDate = status === 'Paid' ? new Date().toISOString() : null;

    const { rows } = await db.query(
      `UPDATE staff_commissions
       SET status = $1, payment_date = $2, paid_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, pDate, status === 'Paid' ? adminUser : null, id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Commission record not found' });
    }

    res.json({ message: `Commission status updated to ${status}`, commission: rows[0] });
  } catch (err) {
    console.error('Update commission status error:', err);
    res.status(500).json({ error: 'Failed to update commission status' });
  }
});

// POST /api/commissions — record new staff commission (Always 'Pending' by default)
router.post('/', authenticate, async (req, res) => {
  try {
    const { staffId, customerId, serviceName, commissionType, commissionRate, baseAmount, commissionAmount, date, remarks } = req.body;
    if (!staffId) {
      return res.status(400).json({ error: 'Staff member selection is required' });
    }

    const type = commissionType || 'percent';
    const rate = Number(commissionRate || 0);
    const base = Number(baseAmount || 0);

    let finalAmount = Number(commissionAmount || 0);
    if (type === 'percent') {
      finalAmount = (base * rate) / 100;
    }

    const id = db.generateUUID();
    const { rows } = await db.query(
      `INSERT INTO staff_commissions
        (id, staff_id, customer_id, service_name, commission_type, commission_rate, base_amount, commission_amount, status, date, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', COALESCE($9::date, CURRENT_DATE), $10) RETURNING *`,
      [id, String(staffId), customerId ? String(customerId) : null, serviceName || null, type, rate, base, finalAmount, date || null, remarks || null]
    );

    res.status(201).json(rows[0] || { id, staff_id: staffId, commission_amount: finalAmount, status: 'Pending' });
  } catch (err) {
    console.error('Create commission error:', err);
    res.status(500).json({ error: 'Failed to record staff commission' });
  }
});

// DELETE /api/commissions/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query(`DELETE FROM staff_commissions WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete commission error:', err);
    res.status(500).json({ error: 'Failed to delete commission entry' });
  }
});

module.exports = router;
