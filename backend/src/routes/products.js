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

// GET /api/products/movements — stock sales & movement history log
router.get('/movements', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pm.*, pm.product_name AS name, pm.created_at
       FROM product_movements pm
       ORDER BY pm.created_at DESC
       LIMIT 100`
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

    // Record initial stock creation movement
    const movementId = db.generateUUID();
    const initialQty = Number(stockQuantity || 0);
    await db.query(
      `INSERT INTO product_movements
        (id, product_id, product_name, invoice_id, invoice_number, type, quantity, stock_before, stock_after, sold_by)
       VALUES ($1,$2,$3,NULL,NULL,'initial_stock',$4,0,$4,$5)`,
      [movementId, id, name, initialQty, req.user?.name || 'Admin']
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
    
    // Fetch product before update to check stock change
    const prodQ = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    const oldProd = prodQ.rows[0];

    const { rows } = await db.query(
      `UPDATE products SET name = COALESCE($1,name), category = COALESCE($2,category),
         purchase_price = COALESCE($3,purchase_price), selling_price = COALESCE($4,selling_price),
         stock_quantity = COALESCE($5,stock_quantity), low_stock_threshold = COALESCE($6,low_stock_threshold)
       WHERE id = $7 RETURNING *`,
      [name, category, purchasePrice, sellingPrice, stockQuantity, lowStockThreshold, req.params.id]
    );

    if (oldProd && stockQuantity !== undefined && Number(stockQuantity) !== Number(oldProd.stock_quantity)) {
      const movementId = db.generateUUID();
      const newStock = Number(stockQuantity);
      const oldStock = Number(oldProd.stock_quantity);
      await db.query(
        `INSERT INTO product_movements
          (id, product_id, product_name, invoice_id, invoice_number, type, quantity, stock_before, stock_after, sold_by)
         VALUES ($1,$2,$3,NULL,NULL,'adjustment',$4,$5,$6,$7)`,
        [movementId, req.params.id, name || oldProd.name, newStock - oldStock, oldStock, newStock, req.user?.name || 'Admin']
      );
    }

    res.json(rows[0] || { id: req.params.id, name, selling_price: sellingPrice });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM product_movements WHERE product_id = $1', [req.params.id]);
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
