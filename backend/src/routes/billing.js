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
       LEFT JOIN customers c ON c.id::text = i.customer_id::text
       LEFT JOIN staff s ON s.id::text = i.staff_id::text
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
       LEFT JOIN customers c ON c.id::text = i.customer_id::text
       LEFT JOIN staff s ON s.id::text = i.staff_id::text
       WHERE i.id::text = $1::text`,
      [req.params.id]
    );
    if (!invoiceQ.rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    const itemsQ = await db.query(
      `SELECT ii.*, s.name AS staff_name
       FROM invoice_items ii
       LEFT JOIN staff s ON s.id::text = ii.staff_id::text
       WHERE ii.invoice_id::text = $1::text`,
      [req.params.id]
    );
    res.json({ ...invoiceQ.rows[0], items: itemsQ.rows || [] });
  } catch (err) {
    console.error('Fetch invoice details error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// POST /api/billing
router.post('/', authenticate, async (req, res) => {
  try {
    const { customerId, staffId, gstPercent, discount, paymentMethod, nextAppointmentDate, items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

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

      // Decrement product stock if product
      if (item.type === 'product' && item.id) {
        await db.query(
          `UPDATE products SET stock_quantity = CASE WHEN stock_quantity - $1 > 0 THEN stock_quantity - $1 ELSE 0 END WHERE id::text = $2::text`,
          [item.quantity || 1, item.id]
        );
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

module.exports = router;
