const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

async function nextInvoiceNumber() {
  try {
    const { rows } = await db.query(
      `SELECT invoice_number FROM invoices ORDER BY created_at DESC LIMIT 1`
    );
    const last = rows[0]?.invoice_number;
    const lastNum = last ? parseInt(last.replace(/\D/g, ''), 10) : 0;
    return `INV-${String(lastNum + 1).padStart(5, '0')}`;
  } catch (e) {
    return `INV-${Date.now().toString().slice(-6)}`;
  }
}

// GET /api/billing  — list invoices
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT i.*, c.name AS customer_name, c.phone AS customer_phone, s.name AS staff_name
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       LEFT JOIN staff s ON s.id = i.staff_id
       ORDER BY i.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch invoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/billing/:id  — full invoice with items
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoiceQ = await db.query(
      `SELECT i.*, c.name AS customer_name, c.phone AS customer_phone, c.notes AS customer_notes, s.name AS staff_name
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       LEFT JOIN staff s ON s.id = i.staff_id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!invoiceQ.rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    const itemsQ = await db.query(
      `SELECT ii.*, s.name AS staff_name
       FROM invoice_items ii
       LEFT JOIN staff s ON s.id = ii.staff_id
       WHERE ii.invoice_id = $1`,
      [req.params.id]
    );
    res.json({ ...invoiceQ.rows[0], items: itemsQ.rows || [] });
  } catch (err) {
    console.error('Fetch invoice details error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// POST /api/billing — Create Invoice & Deduct Product Stock
router.post('/', authenticate, async (req, res) => {
  try {
    const { customerId, staffId, gstPercent, discount, paymentMethod, nextAppointmentDate, items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Step 1: Pre-verify product stock availability to prevent negative inventory
    for (const item of items) {
      if (item.type === 'product' && item.id) {
        const prodQ = await db.query('SELECT * FROM products WHERE id = $1', [item.id]);
        const prod = prodQ.rows[0];
        const requestedQty = Number(item.quantity || 1);
        if (prod) {
          const currentStock = Number(prod.stock_quantity || 0);
          if (currentStock < requestedQty) {
            return res.status(400).json({
              error: `Insufficient stock for "${prod.name}". Only ${currentStock} in stock.`,
            });
          }
        }
      }
    }

    // Step 2: Compute invoice totals
    let subtotal = 0;
    let totalCommission = 0;
    const computedItems = items.map((item) => {
      const lineDiscount = Number(item.discount || 0);
      const lineTotal = Number(item.unitPrice) * Number(item.quantity || 1) - lineDiscount;
      const commissionPercent = Number(item.commissionPercent || 0);
      const commissionAmount = item.type === 'service' ? (lineTotal * commissionPercent) / 100 : 0;
      subtotal += lineTotal;
      totalCommission += commissionAmount;
      return { ...item, lineTotal, commissionAmount, commissionPercent };
    });

    const billDiscount = Number(discount || 0);
    const taxableAmount = Math.max(0, subtotal - billDiscount);
    const gstPct = Number(gstPercent || 0);
    const gstAmount = (taxableAmount * gstPct) / 100;
    const total = taxableAmount + gstAmount;

    const invoiceNumber = await nextInvoiceNumber();
    const invoiceId = db.generateUUID();

    // Step 3: Insert Invoice
    const invoiceQ = await db.query(
      `INSERT INTO invoices
        (id, invoice_number, customer_id, staff_id, subtotal, discount, gst_percent, gst_amount, total,
         payment_method, commission_amount, next_appointment_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        invoiceId,
        invoiceNumber,
        customerId || null,
        staffId || null,
        subtotal,
        billDiscount,
        gstPct,
        gstAmount,
        total,
        paymentMethod || 'cash',
        totalCommission,
        nextAppointmentDate || null,
      ]
    );

    // Step 4: Insert Line Items & Deduct Product Stock + Log Movements
    for (const item of computedItems) {
      const itemId = db.generateUUID();
      const itemStaffId = item.type === 'service' ? (item.staffId || staffId || null) : null;

      await db.query(
        `INSERT INTO invoice_items
          (id, invoice_id, item_type, service_id, product_id, staff_id, name, quantity, unit_price,
           discount, commission_percent, commission_amount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          itemId,
          invoiceId,
          item.type,
          item.type === 'service' ? item.id : null,
          item.type === 'product' ? item.id : null,
          itemStaffId,
          item.name,
          item.quantity || 1,
          item.unitPrice,
          item.discount || 0,
          item.commissionPercent || 0,
          item.commissionAmount || 0,
          item.lineTotal,
        ]
      );

      // Decrement product stock & record stock movement log
      if (item.type === 'product' && item.id) {
        const prodQ = await db.query('SELECT * FROM products WHERE id = $1', [item.id]);
        const prod = prodQ.rows[0];
        if (prod) {
          const stockBefore = Number(prod.stock_quantity || 0);
          const qtySold = Number(item.quantity || 1);
          const stockAfter = Math.max(0, stockBefore - qtySold);

          await db.query(`UPDATE products SET stock_quantity = $1 WHERE id = $2`, [stockAfter, item.id]);

          const movementId = db.generateUUID();
          await db.query(
            `INSERT INTO product_movements
              (id, product_id, product_name, invoice_id, invoice_number, type, quantity, stock_before, stock_after, sold_by)
             VALUES ($1,$2,$3,$4,$5,'sale',$6,$7,$8,$9)`,
            [
              movementId,
              item.id,
              prod.name,
              invoiceId,
              invoiceNumber,
              qtySold,
              stockBefore,
              stockAfter,
              req.user?.name || 'Admin',
            ]
          );
        }
      }
    }

    const createdInvoice = invoiceQ.rows[0] || {
      id: invoiceId,
      invoice_number: invoiceNumber,
      customer_id: customerId,
      staff_id: staffId,
      subtotal,
      discount: billDiscount,
      gst_percent: gstPct,
      gst_amount: gstAmount,
      total,
      payment_method: paymentMethod || 'cash',
      created_at: new Date().toISOString(),
    };

    res.status(201).json({ ...createdInvoice, items: computedItems });
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

// DELETE /api/billing/:id — Cancel/Delete invoice & restore product inventory stock
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const invQ = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    const invoice = invQ.rows[0];
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Fetch product items to restore stock
    const itemsQ = await db.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 AND item_type = 'product'`,
      [id]
    );

    for (const item of (itemsQ.rows || [])) {
      if (item.product_id) {
        const prodQ = await db.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
        const prod = prodQ.rows[0];
        if (prod) {
          const stockBefore = Number(prod.stock_quantity || 0);
          const qtyRestored = Number(item.quantity || 1);
          const stockAfter = stockBefore + qtyRestored;

          await db.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [stockAfter, item.product_id]);

          const movementId = db.generateUUID();
          await db.query(
            `INSERT INTO product_movements
              (id, product_id, product_name, invoice_id, invoice_number, type, quantity, stock_before, stock_after, sold_by)
             VALUES ($1,$2,$3,$4,$5,'cancellation',$6,$7,$8,$9)`,
            [
              movementId,
              item.product_id,
              prod.name,
              invoice.id,
              invoice.invoice_number,
              qtyRestored,
              stockBefore,
              stockAfter,
              req.user?.name || 'Admin',
            ]
          );
        }
      }
    }

    await db.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
    await db.query('DELETE FROM invoices WHERE id = $1', [id]);

    res.json({ message: 'Invoice cancelled and product stock restored successfully' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Failed to delete invoice and restore stock' });
  }
});

module.exports = router;
