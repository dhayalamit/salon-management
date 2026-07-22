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
  'Other',
];

// GET /api/expenses/categories — Get standard + custom expense categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT name FROM custom_expense_categories ORDER BY name ASC').catch(() => ({ rows: [] }));
    const customNames = (rows || []).map((r) => r.name);
    const all = Array.from(new Set([...STANDARD_CATEGORIES, ...customNames]));
    res.json({ categories: all, customCategories: customNames });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.json({ categories: STANDARD_CATEGORIES, customCategories: [] });
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

// DELETE /api/expenses/categories/:name — Remove custom category
router.delete('/categories/:name', authenticate, async (req, res) => {
  try {
    const categoryName = decodeURIComponent(req.params.name);
    await db.query('DELETE FROM custom_expense_categories WHERE name = $1', [categoryName]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete custom category error:', err);
    res.status(500).json({ error: 'Failed to delete custom category' });
  }
});

// GET /api/expenses — Safe PostgreSQL query without created_at column error
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM expenses ORDER BY expense_date DESC');
    res.json(rows || []);
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses — Simple expense creation (No Title field needed)
router.post('/', authenticate, async (req, res) => {
  try {
    const { category, amount, expenseDate, paymentMethod, note } = req.body;
    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const id = db.generateUUID();
    const date = expenseDate || new Date().toISOString().slice(0, 10);
    const pMethod = paymentMethod || 'cash';
    const expTitle = category;

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
