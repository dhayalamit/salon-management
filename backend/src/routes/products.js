const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/products
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/movements — stock sales history
router.get('/movements', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ii.*, i.invoice_number, i.created_at, c.name AS customer_name
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       LEFT JOIN customers c ON c.id = i.customer_id
       WHERE ii.item_type = 'product'
       ORDER BY i.created_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch movements error:', err);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// POST /api/products
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, category, purchasePrice, sellingPrice, stockQuantity, lowStockThreshold } = req.body;
    if (!name || sellingPrice === undefined) {
      return res.status(400).json({ error: 'Name and selling price are required' });
    }

    const id = db.generateUUID();
    const { rows } = await db.query(
      `INSERT INTO products (id, name, category, purchase_price, selling_price, stock_quantity, low_stock_threshold)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        id,
        name,
        category || 'General',
        Number(purchasePrice || 0),
        Number(sellingPrice),
        Number(stockQuantity || 0),
        Number(lowStockThreshold || 5),
      ]
    );
    res.status(201).json(rows[0] || { id, name, selling_price: sellingPrice });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, category, purchasePrice, sellingPrice, stockQuantity, lowStockThreshold } = req.body;
    const { rows } = await db.query(
      `UPDATE products SET name = COALESCE($1,name), category = COALESCE($2,category),
         purchase_price = COALESCE($3,purchase_price), selling_price = COALESCE($4,selling_price),
         stock_quantity = COALESCE($5,stock_quantity), low_stock_threshold = COALESCE($6,low_stock_threshold)
       WHERE id = $7 RETURNING *`,
      [name, category, purchasePrice, sellingPrice, stockQuantity, lowStockThreshold, req.params.id]
    );
    res.json(rows[0] || { id: req.params.id, name, selling_price: sellingPrice });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
