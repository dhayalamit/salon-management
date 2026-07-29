const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

async function nextVisitNumber() {
  try {
    const { rows } = await db.query(
      `SELECT visit_number FROM customer_visits ORDER BY created_at DESC LIMIT 1`
    );
    const last = rows[0]?.visit_number;
    const lastNum = last ? parseInt(last.replace(/\D/g, ''), 10) : 0;
    return `VIS-${String(lastNum + 1).padStart(5, '0')}`;
  } catch (e) {
    return `VIS-${Date.now().toString().slice(-6)}`;
  }
}

// GET /api/visits  — list customer visits
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT v.*, c.name AS customer_name, c.phone AS customer_phone, s.name AS staff_name
       FROM customer_visits v
       LEFT JOIN customers c ON c.id::text = v.customer_id::text
       LEFT JOIN staff s ON s.id::text = v.staff_id::text
       ORDER BY v.created_at DESC LIMIT 200`
    );
    res.json(rows || []);
  } catch (err) {
    console.error('Fetch visits error:', err);
    res.status(500).json({ error: 'Failed to fetch customer visits' });
  }
});

// GET /api/visits/:id  — full visit with items
router.get('/:id', authenticate, async (req, res) => {
  try {
    const visitQ = await db.query(
      `SELECT v.*, c.name AS customer_name, c.phone AS customer_phone, c.notes AS customer_notes, s.name AS staff_name
       FROM customer_visits v
       LEFT JOIN customers c ON c.id::text = v.customer_id::text
       LEFT JOIN staff s ON s.id::text = v.staff_id::text
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!visitQ.rows[0]) return res.status(404).json({ error: 'Customer visit not found' });
    const itemsQ = await db.query(
      `SELECT vi.*, s.name AS staff_name
       FROM visit_items vi
       LEFT JOIN staff s ON s.id::text = vi.staff_id::text
       WHERE vi.visit_id = $1`,
      [req.params.id]
    );
    res.json({ ...visitQ.rows[0], items: itemsQ.rows || [] });
  } catch (err) {
    console.error('Fetch visit details error:', err);
    res.status(500).json({ error: 'Failed to fetch visit details' });
  }
});

// PUT /api/visits/:id/payment — Clear/Settle pending or partial payment & record timestamp
router.put('/:id/payment', authenticate, async (req, res) => {
  try {
    const { paymentMethod, amountPaid } = req.body;
    if (!paymentMethod) return res.status(400).json({ error: 'Payment method is required' });

    const visitQ = await db.query('SELECT * FROM customer_visits WHERE id = $1', [req.params.id]);
    const visit = visitQ.rows[0];
    if (!visit) return res.status(404).json({ error: 'Customer visit not found' });

    const totalAmt = Number(visit.total || 0);
    const existingPaid = Number(visit.amount_paid || 0);
    const newAddition = amountPaid !== undefined && amountPaid !== null && amountPaid !== '' ? Number(amountPaid) : (totalAmt - existingPaid);
    const updatedAmountPaid = existingPaid + newAddition;
    const updatedRemaining = Math.max(0, totalAmt - updatedAmountPaid);
    const updatedStatus = updatedRemaining <= 0 ? 'Paid' : 'Partial';
    const nowIso = new Date().toISOString();

    const { rows } = await db.query(
      `UPDATE customer_visits
       SET payment_method = $1, amount_paid = $2, remaining_amount = $3, payment_status = $4, cleared_at = $5
       WHERE id = $6 RETURNING *`,
      [paymentMethod, updatedAmountPaid, updatedRemaining, updatedStatus, nowIso, req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update visit payment error:', err);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// POST /api/visits — Create Customer Visit & Update Inventory, Staff Commission, Appointments & Customer Profile
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      customerId,
      appointmentId,
      staffId,
      gstPercent,
      discount,
      paymentMethod,
      amountPaid,
      notes,
      nextAppointmentDate,
      items,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'At least one service or product item is required' });
    }

    // Step 1: Pre-verify product stock availability
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

    // Step 2: Compute visit totals
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

    const visitDiscount = Number(discount || 0);
    const taxableAmount = Math.max(0, subtotal - visitDiscount);
    const gstPct = Number(gstPercent || 0);
    const gstAmount = (taxableAmount * gstPct) / 100;
    const total = taxableAmount + gstAmount;

    // Payment calculations (Full, Partial, Pending)
    let pMethod = paymentMethod || 'cash';
    let pStatus = 'Paid';
    let amtPaid = Number(amountPaid !== undefined && amountPaid !== null && amountPaid !== '' ? amountPaid : total);

    if (pMethod === 'pending' || amtPaid <= 0) {
      pStatus = 'Pending';
      amtPaid = 0;
    } else if (amtPaid < total) {
      pStatus = 'Partial';
    } else {
      pStatus = 'Paid';
      amtPaid = Math.min(amtPaid, total);
    }

    const remainingAmount = Math.max(0, total - amtPaid);
    const visitNumber = await nextVisitNumber();
    const visitId = db.generateUUID();
    const createdBy = req.user?.name || 'Admin';

    // Step 3: Insert Customer Visit
    const visitQ = await db.query(
      `INSERT INTO customer_visits
        (id, visit_number, customer_id, appointment_id, staff_id, subtotal, discount, gst_percent, gst_amount, total,
         amount_paid, remaining_amount, payment_method, payment_status, notes, commission_amount, next_appointment_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        visitId,
        visitNumber,
        customerId || null,
        appointmentId || null,
        staffId || null,
        subtotal,
        visitDiscount,
        gstPct,
        gstAmount,
        total,
        amtPaid,
        remainingAmount,
        pMethod,
        pStatus,
        notes || null,
        totalCommission,
        nextAppointmentDate || null,
        createdBy,
      ]
    );

    // Step 4: Insert Visit Items & process inventory + commissions
    for (const item of computedItems) {
      const itemId = db.generateUUID();
      const assignedStaffId = item.staffId || staffId || null;

      await db.query(
        `INSERT INTO visit_items
          (id, visit_id, item_type, service_id, product_id, staff_id, name, quantity, unit_price, discount, commission_percent, commission_amount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          itemId,
          visitId,
          item.type,
          item.type === 'service' ? item.id : null,
          item.type === 'product' ? item.id : null,
          assignedStaffId,
          item.name,
          Number(item.quantity || 1),
          Number(item.unitPrice),
          Number(item.discount || 0),
          item.commissionPercent,
          item.commissionAmount,
          item.lineTotal,
        ]
      );

      // Deduct stock if item is a product
      if (item.type === 'product' && item.id) {
        const prodQ = await db.query('SELECT stock_quantity FROM products WHERE id = $1', [item.id]);
        const stockBefore = Number(prodQ.rows[0]?.stock_quantity || 0);
        const qtySold = Number(item.quantity || 1);
        const stockAfter = Math.max(0, stockBefore - qtySold);

        await db.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [stockAfter, item.id]);

        // Record Product Movement
        const movId = db.generateUUID();
        await db.query(
          `INSERT INTO product_movements
            (id, product_id, product_name, invoice_id, invoice_number, type, quantity, stock_before, stock_after, sold_by)
           VALUES ($1,$2,$3,$4,$5,'sale',$6,$7,$8,$9)`,
          [movId, item.id, item.name, visitId, visitNumber, qtySold, stockBefore, stockAfter, createdBy]
        );
      }

      // Record staff commission if applicable
      if (assignedStaffId && item.commissionAmount > 0) {
        const commId = db.generateUUID();
        await db.query(
          `INSERT INTO staff_commissions
            (id, staff_id, customer_id, service_name, commission_type, commission_rate, base_amount, commission_amount, status, date)
           VALUES ($1,$2,$3,$4,'percent',$5,$6,$7,'Pending',CURRENT_DATE)`,
          [
            commId,
            assignedStaffId,
            customerId || null,
            item.name,
            item.commissionPercent,
            item.lineTotal,
            item.commissionAmount,
          ]
        );
      }
    }

    // Step 5: Automatically complete appointment if linked
    if (appointmentId) {
      await db.query(`UPDATE appointments SET status = 'completed' WHERE id = $1`, [appointmentId]);
    }

    // Step 6: Update customer's next appointment date if provided
    if (customerId && nextAppointmentDate) {
      await db.query(`UPDATE customers SET next_appointment_date = $1 WHERE id = $2`, [
        nextAppointmentDate,
        customerId,
      ]);
    }

    res.status(201).json(visitQ.rows[0]);
  } catch (err) {
    console.error('Create visit error:', err);
    res.status(500).json({ error: 'Failed to record customer visit' });
  }
});

// DELETE /api/visits/:id — Cancel visit & restore product inventory stock
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const visitId = req.params.id;
    const itemsQ = await db.query('SELECT * FROM visit_items WHERE visit_id = $1', [visitId]);

    // Restore product stock
    for (const item of itemsQ.rows || []) {
      if (item.item_type === 'product' && item.product_id) {
        const qtyToRestore = Number(item.quantity || 1);
        await db.query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [
          qtyToRestore,
          item.product_id,
        ]);
      }
    }

    await db.query('DELETE FROM visit_items WHERE visit_id = $1', [visitId]);
    await db.query('DELETE FROM customer_visits WHERE id = $1', [visitId]);

    res.status(204).end();
  } catch (err) {
    console.error('Delete visit error:', err);
    res.status(500).json({ error: 'Failed to cancel customer visit' });
  }
});

module.exports = router;
