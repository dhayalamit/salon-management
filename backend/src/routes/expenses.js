const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const STANDARD_CATEGORIES = [
  'Electricity',
  'Rent',
  'Water Bill',
  'Internet',
  'Staff Tea/Snacks',
  'Cleaning',
  'Maintenance',
  'Marketing',
  'Stationery',
  'Miscellaneous',
  'Other (Custom)',
];

// GET /api/expenses/categories — Get standard + custom expense categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT name FROM custom_expense_categories ORDER BY name ASC').catch(() => ({ rows: [] }));
    const customNames = (rows || []).map((r) => r.name);
    const all = Array.from(new Set([...STANDARD_CATEGORIES, ...customNames]));
    res.json(all);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.json(STANDARD_CATEGORIES);
  }
});

// POST /api/expenses/categories — Add custom expense category
router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

    const trimmed = name.trim();
    const id = db.generateUUID();

    await db.query(
      `INSERT INTO custom_expense_categories (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      [id, trimmed]
    );

    res.status(201).json({ name: trimmed });
  } catch (err) {
    console.error('Create custom category error:', err);
    res.status(500).json({ error: 'Failed to create custom category' });
  }
});

// GET /api/expenses
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, category, amount, expenseDate, paymentMethod, note } = req.body;
    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const id = db.generateUUID();
    const date = expenseDate || new Date().toISOString().slice(0, 10);
    const expTitle = title || `${category} Expense`;
    const pMethod = paymentMethod || 'cash';

    const { rows } = await db.query(
      `INSERT INTO expenses (id, title, category, amount, expense_date, payment_method, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, expTitle, category, Number(amount), date, pMethod, note || null]
    );

    res.status(201).json(rows[0] || { id, title: expTitle, category, amount, expense_date: date, payment_method: pMethod, note });
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
