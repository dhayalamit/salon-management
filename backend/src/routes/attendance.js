const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance?date=YYYY-MM-DD
router.get('/', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toLocaleDateString('en-CA');

    const { rows } = await db.query(
      `SELECT s.id AS staff_id, s.name AS staff_name, s.phone, s.status AS staff_status,
              a.id AS attendance_id, COALESCE(a.status, 'absent') AS status, a.note, a.date
       FROM staff s
       LEFT JOIN attendance a ON a.staff_id = s.id AND a.date = $1
       WHERE s.status = 'active'
       ORDER BY s.name ASC`,
      [targetDate]
    );

    res.json({ date: targetDate, attendance: rows });
  } catch (err) {
    console.error('Fetch attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST /api/attendance/bulk
// body: { date: 'YYYY-MM-DD', records: [{ staffId, status, note }] }
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }

    for (const record of records) {
      const { staffId, status, note } = record;
      if (!staffId || !status) continue;

      const existing = await db.query('SELECT id FROM attendance WHERE staff_id = $1 AND date = $2', [staffId, date]);
      if (existing.rows && existing.rows.length > 0) {
        await db.query(
          `UPDATE attendance SET status = $1, note = $2 WHERE staff_id = $3 AND date = $4`,
          [status, note || null, staffId, date]
        );
      } else {
        const id = db.generateUUID();
        await db.query(
          `INSERT INTO attendance (id, staff_id, date, status, note) VALUES ($1,$2,$3,$4,$5)`,
          [id, staffId, date, status, note || null]
        );
      }
    }

    res.json({ message: 'Attendance saved successfully' });
  } catch (err) {
    console.error('Save attendance error:', err);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

// GET /api/attendance/report?month=YYYY-MM
router.get('/report', authenticate, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // e.g. '2026-07'
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const staffMembers = await db.query(`SELECT id, name, phone FROM staff WHERE status = 'active' ORDER BY name ASC`);
    const logs = await db.query(
      `SELECT staff_id, status, COUNT(*) AS count
       FROM attendance
       WHERE date >= $1 AND date <= $2
       GROUP BY staff_id, status`,
      [startDate, endDate]
    );

    const countsByStaff = {};
    (logs.rows || []).forEach((row) => {
      if (!countsByStaff[row.staff_id]) {
        countsByStaff[row.staff_id] = { present: 0, absent: 0, half_day: 0, leave: 0 };
      }
      countsByStaff[row.staff_id][row.status] = Number(row.count || 0);
    });

    const report = (staffMembers.rows || []).map((s) => {
      const stats = countsByStaff[s.id] || { present: 0, absent: 0, half_day: 0, leave: 0 };
      const totalLogged = stats.present + stats.absent + stats.half_day + stats.leave;
      const effectivePresent = stats.present + stats.half_day * 0.5;
      const attendancePct = totalLogged > 0 ? Math.round((effectivePresent / totalLogged) * 100) : 0;

      return {
        staffId: s.id,
        staffName: s.name,
        phone: s.phone,
        presentCount: stats.present,
        absentCount: stats.absent,
        halfDayCount: stats.half_day,
        leaveCount: stats.leave,
        totalWorkingDays: totalLogged,
        attendancePercentage: attendancePct,
      };
    });

    res.json({ month, report });
  } catch (err) {
    console.error('Fetch attendance report error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance report' });
  }
});

module.exports = router;
