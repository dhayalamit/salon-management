const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/appointments?date=2026-07-20
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, status, staffId } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (date) {
      params.push(date);
      where += ` AND a.appointment_date = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      where += ` AND a.status = $${params.length}`;
    }

    if (staffId && staffId !== 'all') {
      params.push(staffId);
      where += ` AND a.staff_id = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT a.*, c.name AS customer_name, c.phone AS customer_phone, s.name AS staff_name, sv.name AS service_name, sv.price AS service_price, sv.duration_minutes
       FROM appointments a
       LEFT JOIN customers c ON c.id = a.customer_id
       LEFT JOIN staff s ON s.id = a.staff_id
       LEFT JOIN services sv ON sv.id = a.service_id
       ${where}
       ORDER BY a.appointment_date DESC, a.appointment_time ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { customerId, staffId, serviceId, appointmentDate, appointmentTime, notes } = req.body;
    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    const id = db.generateUUID();
    const { rows } = await db.query(
      `INSERT INTO appointments (id, customer_id, staff_id, service_id, appointment_date, appointment_time, status)
       VALUES ($1,$2,$3,$4,$5,$6,'booked') RETURNING *`,
      [id, customerId || null, staffId || null, serviceId || null, appointmentDate, appointmentTime]
    );

    const created = rows[0] || {
      id, customer_id: customerId, staff_id: staffId, service_id: serviceId,
      appointment_date: appointmentDate, appointment_time: appointmentTime, status: 'booked'
    };

    res.status(201).json(created);
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, appointmentDate, appointmentTime, staffId, serviceId } = req.body;
    const { rows } = await db.query(
      `UPDATE appointments SET status = COALESCE($1,status), appointment_date = COALESCE($2,appointment_date),
         appointment_time = COALESCE($3,appointment_time), staff_id = COALESCE($4,staff_id),
         service_id = COALESCE($5,service_id) WHERE id = $6 RETURNING *`,
      [status, appointmentDate, appointmentTime, staffId, serviceId, req.params.id]
    );
    res.json(rows[0] || { id: req.params.id, status, appointmentDate, appointmentTime });
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete appointment error:', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;
