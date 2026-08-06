const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/permanent-customers — List all permanent customers with wallet balances & visit stats
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*,
              COALESCE(vis.visit_count, 0) AS visit_count,
              vis.last_visit_date
       FROM customers c
       LEFT JOIN (
         SELECT customer_id,
                COUNT(*) AS visit_count,
                MAX(created_at) AS last_visit_date
         FROM customer_visits
         GROUP BY customer_id
       ) vis ON vis.customer_id::text = c.id::text
       WHERE c.is_permanent::text IN ('true', '1') OR COALESCE(c.advance_balance, 0) > 0
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch permanent customers error:', err);
    res.status(500).json({ error: 'Failed to fetch permanent customers' });
  }
});

// GET /api/permanent-customers/:id — Detailed profile, visits & advance ledger
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const customerQ = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (!customerQ.rows[0]) return res.status(404).json({ error: 'Customer not found' });

    const visitsQ = await db.query(
      `SELECT v.*, s.name AS staff_name
       FROM customer_visits v
       LEFT JOIN staff s ON s.id::text = v.staff_id::text
       WHERE v.customer_id::text = $1
       ORDER BY v.created_at DESC`,
      [id]
    );

    const transactionsQ = await db.query(
      `SELECT * FROM advance_transactions
       WHERE customer_id::text = $1
       ORDER BY created_at DESC`,
      [id]
    );

    const lifetime = await db.query(
      `SELECT COUNT(*) AS visit_count, COALESCE(SUM(total), 0) AS total_spent, MAX(created_at) AS last_visit_date
       FROM customer_visits WHERE customer_id::text = $1`,
      [id]
    );

    res.json({
      ...customerQ.rows[0],
      totalSpent: Number(lifetime.rows[0]?.total_spent || 0),
      visitCount: Number(lifetime.rows[0]?.visit_count || 0),
      lastVisitDate: lifetime.rows[0]?.last_visit_date || null,
      history: visitsQ.rows || [],
      transactions: transactionsQ.rows || [],
    });
  } catch (err) {
    console.error('Fetch permanent customer profile error:', err);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// POST /api/permanent-customers — Register permanent customer
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, phone, alternatePhone, gender, birthday, initialDeposit, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const cleanName = name.trim();
    const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;
    const cleanAltPhone = alternatePhone && alternatePhone.trim() !== '' ? alternatePhone.trim() : null;
    const cleanGender = gender && gender.trim() !== '' ? gender.trim() : 'other';
    const cleanBirthday = birthday && birthday.trim() !== '' ? birthday.trim() : null;
    const cleanNotes = notes && notes.trim() !== '' ? notes.trim() : null;
    const depositAmt = Math.max(0, Number(initialDeposit || 0));

    if (cleanPhone) {
      const existing = await db.query('SELECT id FROM customers WHERE phone = $1', [cleanPhone]);
      if (existing.rows && existing.rows.length > 0) {
        return res.status(400).json({ error: 'A customer with this mobile number already exists' });
      }
    }

    const id = db.generateUUID();
    const { rows } = await db.query(
      `INSERT INTO customers
         (id, name, phone, alternate_phone, gender, birthday, notes, is_permanent, advance_balance, total_advance_deposited, total_advance_used)
       VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,$8,0) RETURNING *`,
      [id, cleanName, cleanPhone, cleanAltPhone, cleanGender, cleanBirthday, cleanNotes, depositAmt]
    );

    // If initial deposit > 0, record initial deposit transaction
    if (depositAmt > 0) {
      const txId = db.generateUUID();
      const performedBy = req.user?.name || 'Admin';
      await db.query(
        `INSERT INTO advance_transactions
           (id, customer_id, type, amount, balance_after, payment_method, notes, performed_by)
         VALUES ($1, $2, 'deposit', $3, $3, 'cash', 'Initial Advance Deposit', $4)`,
        [txId, id, depositAmt, performedBy]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Register permanent customer error:', err);
    res.status(500).json({ error: err.message || 'Failed to register permanent customer' });
  }
});

// POST /api/permanent-customers/:id/advance — Add Advance Deposit
router.post('/:id/advance', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;
    const depositAmount = Number(amount || 0);

    if (depositAmount <= 0) {
      return res.status(400).json({ error: 'Advance deposit amount must be greater than zero' });
    }

    const custQ = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (!custQ.rows[0]) return res.status(404).json({ error: 'Customer not found' });

    const cust = custQ.rows[0];
    const currentBal = Number(cust.advance_balance || 0);
    const newBal = currentBal + depositAmount;
    const currentTotalDep = Number(cust.total_advance_deposited || 0);
    const newTotalDep = currentTotalDep + depositAmount;
    const performedBy = req.user?.name || 'Admin';

    // Update customer wallet balance
    const updatedCust = await db.query(
      `UPDATE customers
       SET advance_balance = $1, total_advance_deposited = $2, is_permanent = 1
       WHERE id = $3 RETURNING *`,
      [newBal, newTotalDep, id]
    );

    // Record advance transaction
    const txId = db.generateUUID();
    await db.query(
      `INSERT INTO advance_transactions
         (id, customer_id, type, amount, balance_after, payment_method, notes, performed_by)
       VALUES ($1, $2, 'deposit', $3, $4, $5, $6, $7)`,
      [txId, id, depositAmount, newBal, paymentMethod || 'cash', notes || 'Advance Wallet Deposit', performedBy]
    );

    res.json({
      message: `₹${depositAmount.toLocaleString('en-IN')} advance added successfully`,
      customer: updatedCust.rows[0],
      newBalance: newBal,
    });
  } catch (err) {
    console.error('Add advance deposit error:', err);
    res.status(500).json({ error: 'Failed to add advance deposit' });
  }
});

module.exports = router;
