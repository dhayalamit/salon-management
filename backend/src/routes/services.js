const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/services
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM services WHERE active = true ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch services error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/services
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, price, durationMinutes, commissionPercent } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const id = db.generateUUID();
    const { rows } = await db.query(
      `INSERT INTO services (id, name, price, duration_minutes, commission_percent)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, name, Number(price), Number(durationMinutes || 30), Number(commissionPercent || 0)]
    );
    res.status(201).json(rows[0] || { id, name, price, duration_minutes: durationMinutes, commission_percent: commissionPercent });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/services/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, price, durationMinutes, commissionPercent, active } = req.body;
    const { rows } = await db.query(
      `UPDATE services SET name = COALESCE($1,name), price = COALESCE($2,price),
         duration_minutes = COALESCE($3,duration_minutes), commission_percent = COALESCE($4,commission_percent),
         active = COALESCE($5,active)
       WHERE id = $6 RETURNING *`,
      [name, price, durationMinutes, commissionPercent, active, req.params.id]
    );
    res.json(rows[0] || { id: req.params.id, name, price });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE services SET active = false WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
