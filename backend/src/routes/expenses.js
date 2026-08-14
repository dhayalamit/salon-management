const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_STANDARD_CATEGORIES = [
  'Electricity',
  'Rent',
  'Water Bill',
  'Internet',
  'Staff Tea/Snacks',
  'Cleaning',
  'Stationery',
  'Miscellaneous',
  'Other',
];

// GET /api/expenses/categories — Get active standard + custom categories (excluding deleted ones)
router.get('/categories', authenticate, async (req, res) => {
  try {
    const customQ = await db.query('SELECT name FROM custom_expense_categories ORDER BY name ASC').catch(() => ({ rows: [] }));
    const deletedQ = await db.query('SELECT name FROM deleted_expense_categories').catch(() => ({ rows: [] }));

    const deletedNames = new Set((deletedQ.rows || []).map((r) => r.name));
    const customNames = (customQ.rows || []).map((r) => r.name);

    const activeStandard = DEFAULT_STANDARD_CATEGORIES.filter((cat) => !deletedNames.has(cat));
    const activeCustom = customNames.filter((cat) => !deletedNames.has(cat));

    const all = Array.from(new Set([...activeStandard, ...activeCustom]));

    res.json({ categories: all, customCategories: customNames, deletedCategories: Array.from(deletedNames) });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.json({ categories: DEFAULT_STANDARD_CATEGORIES, customCategories: [], deletedCategories: [] });
  }
});

// POST /api/expenses/categories — Add or un-delete category
router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

    const trimmed = name.trim();
    const id = db.generateUUID();

    // If it was previously deleted, remove from deleted list
    await db.query('DELETE FROM deleted_expense_categories WHERE name = $1', [trimmed]).catch(() => {});

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

// DELETE /api/expenses/categories/:name — Delete ANY category (Standard or Custom)
router.delete('/categories/:name', authenticate, async (req, res) => {
  try {
    const categoryName = decodeURIComponent(req.params.name);

    // Delete from custom if present
    await db.query('DELETE FROM custom_expense_categories WHERE name = $1', [categoryName]).catch(() => {});

    // Add to deleted categories table so standard categories can also be deleted
    await db.query(
      `INSERT INTO deleted_expense_categories (name) VALUES ($1) ON CONFLICT DO NOTHING`,
      [categoryName]
    ).catch(() => {});

    res.status(204).end();
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// GET /api/expenses
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM expenses ORDER BY expense_date DESC');
    res.json(rows || []);
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses
router.post('/', authenticate, async (req, res) => {
  try {
    const { category, amount, expenseDate, paymentMethod, note } = req.body;
    if (!category || amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ error: 'Category and valid amount are required' });
    }

    const id = db.generateUUID();
    const date = expenseDate || new Date().toISOString().slice(0, 10);
    const pMethod = paymentMethod || 'cash';
    const expTitle = category;

    // Ensure columns exist on legacy tables
    await db.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS title TEXT`).catch(() => {});
    await db.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'`).catch(() => {});
    await db.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS note TEXT`).catch(() => {});

    let resultRows = [];
    try {
      const { rows } = await db.query(
        `INSERT INTO expenses (id, title, category, amount, expense_date, payment_method, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, expTitle, category, Number(amount), date, pMethod, note || null]
      );
      resultRows = rows || [];
    } catch (insertErr) {
      // Fallback query if RETURNING or title causes an issue
      const { rows } = await db.query(
        `INSERT INTO expenses (id, category, amount, expense_date, payment_method, note)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [id, category, Number(amount), date, pMethod, note || null]
      );
      resultRows = rows || [];
    }

    res.status(201).json(resultRows[0] || { id, title: expTitle, category, amount: Number(amount), expense_date: date, payment_method: pMethod, note });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: err.message || 'Failed to create expense' });
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
