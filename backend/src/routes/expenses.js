const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/expenses
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM expenses ORDER BY expense_date DESC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses
router.post('/', authenticate, async (req, res) => {
  try {
    const { category, amount, expenseDate, note } = req.body;
    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const id = db.generateUUID();
    const date = expenseDate || new Date().toLocaleDateString('en-CA');
    const { rows } = await db.query(
      `INSERT INTO expenses (id, category, amount, expense_date, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, category, Number(amount), date, note || null]
    );

    res.status(201).json(rows[0] || { id, category, amount, expense_date: date, note });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
