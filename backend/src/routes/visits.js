const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: Generate next sequential Visit Number (VIS-00001)
async function nextVisitNumber() {
  const { rows } = await db.query('SELECT visit_number FROM customer_visits ORDER BY created_at DESC LIMIT 1');
  if (!rows.length || !rows[0].visit_number) return 'VIS-00001';
  const lastNum = parseInt(rows[0].visit_number.replace('VIS-', ''), 10) || 0;
  return `VIS-${String(lastNum + 1).padStart(5, '0')}`;
}

// GET /api/visits — List all customer visits
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT v.*,
              c.name AS customer_name, c.phone AS customer_phone,
              s.name AS staff_name
       FROM customer_visits v
       LEFT JOIN customers c ON c.id::text = v.customer_id::text
       LEFT JOIN staff s ON s.id::text = v.staff_id::text
       ORDER BY v.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch visits error:', err);
    res.status(500).json({ error: 'Failed to fetch customer visits' });
  }
});

// GET /api/visits/:id — Detailed customer visit view with items
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const visitQ = await db.query(
      `SELECT v.*,
              c.name AS customer_name, c.phone AS customer_phone, c.notes AS customer_notes,
              s.name AS staff_name
       FROM customer_visits v
       LEFT JOIN customers c ON c.id::text = v.customer_id::text
       LEFT JOIN staff s ON s.id::text = v.staff_id::text
       WHERE v.id = $1`,
      [id]
    );

    if (!visitQ.rows[0]) return res.status(404).json({ error: 'Customer visit not found' });

    const itemsQ = await db.query(
      `SELECT vi.*, st.name AS staff_name
       FROM visit_items vi
       LEFT JOIN staff st ON st.id::text = vi.staff_id::text
       WHERE vi.visit_id = $1
       ORDER BY vi.id ASC`,
      [id]
    );

    res.json({
      ...visitQ.rows[0],
      items: itemsQ.rows || [],
    });
  } catch (err) {
    console.error('Fetch visit details error:', err);
    res.status(500).json({ error: 'Failed to fetch visit details' });
  }
});

// PUT /api/visits/:id/payment — Settle or update pending payment
router.put('/:id/payment', authenticate, async (req, res) => {
  try {
    const { paymentMethod, amountPaid } = req.body;
    const visitQ = await db.query('SELECT * FROM customer_visits WHERE id = $1', [req.params.id]);
    if (!visitQ.rows[0]) return res.status(404).json({ error: 'Visit not found' });

    const currentVisit = visitQ.rows[0];
    const total = Number(currentVisit.total);
    const prevPaid = Number(currentVisit.amount_paid || 0);

    const additionalPaid = Number(amountPaid || 0);
    const updatedAmountPaid = prevPaid + additionalPaid >= total ? total : prevPaid + additionalPaid;
    const updatedRemaining = Math.max(0, total - updatedAmountPaid);
    const updatedStatus = updatedRemaining === 0 ? 'Paid' : 'Partial';
    const nowIso = new Date().toISOString();

    const { rows } = await db.query(
      `UPDATE customer_visits
       SET payment_method = $1, amount_paid = $2, remaining_amount = $3, payment_status = $4, cleared_at = $5
       WHERE id = $6 RETURNING *`,
      [paymentMethod, updatedAmountPaid, updatedRemaining, updatedStatus, nowIso, req.params.id]
    );

    // Update payment status in linked Staff Work Register entries
    await db.query(
      `UPDATE staff_work_entries SET payment_status = $1 WHERE visit_id = $2`,
      [updatedStatus, req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update visit payment error:', err);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// POST /api/visits — Create Customer Visit & Automatically Create Staff Work Register Entries
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

    // Fetch customer name for staff work register traceability
    let custName = 'Walk-in Client';
    if (customerId) {
      const cQ = await db.query('SELECT name FROM customers WHERE id = $1', [customerId]);
      if (cQ.rows[0]?.name) custName = cQ.rows[0].name;
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

    // Step 2: Compute visit totals & commissions
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

    const visitNumber = await nextVisitNumber();
    const visitId = db.generateUUID();
    const createdBy = req.user?.name || 'Admin';

    // Payment calculations (Advance Wallet, Cash, UPI, Card, Split, Pending)
    let pMethod = paymentMethod || 'cash';
    let advanceUsed = 0;

    // Check if Customer has available Advance Wallet balance
    if (customerId && (pMethod === 'advance' || pMethod === 'split' || req.body.useAdvance)) {
      const custQ = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
      const cust = custQ.rows[0];
      if (cust) {
        const availAdvance = Number(cust.advance_balance || 0);
        const requestedAdvance = pMethod === 'advance' ? total : Number(req.body.advanceAmountUsed || total);
        advanceUsed = Math.min(availAdvance, Math.min(requestedAdvance, total));

        if (advanceUsed > 0) {
          const newAdvanceBal = availAdvance - advanceUsed;
          const newTotalUsed = Number(cust.total_advance_used || 0) + advanceUsed;

          await db.query(
            `UPDATE customers SET advance_balance = $1, total_advance_used = $2 WHERE id = $3`,
            [newAdvanceBal, newTotalUsed, customerId]
          );

          // Record in Advance Transaction Ledger
          const txId = db.generateUUID();
          await db.query(
            `INSERT INTO advance_transactions
               (id, customer_id, visit_id, type, amount, balance_after, payment_method, notes, performed_by)
             VALUES ($1, $2, $3, 'deduction', $4, $5, 'advance', $6, $7)`,
            [
              txId,
              customerId,
              visitId,
              advanceUsed,
              newAdvanceBal,
              `Deducted for Visit #${visitNumber}`,
              createdBy,
            ]
          );
        }
      }
    }

    const netPayable = Math.max(0, total - advanceUsed);
    let additionalPaid = Number(amountPaid !== undefined && amountPaid !== null && amountPaid !== '' ? amountPaid : (pMethod === 'advance' ? 0 : netPayable));
    if (pMethod === 'pending') additionalPaid = 0;

    const totalPaid = advanceUsed + additionalPaid;
    const remainingAmount = Math.max(0, total - totalPaid);

    let pStatus = 'Paid';
    if (remainingAmount <= 0) {
      pStatus = 'Paid';
    } else if (totalPaid > 0) {
      pStatus = 'Partial';
    } else {
      pStatus = 'Pending';
    }

    // Step 3: Insert Customer Visit
    const visitQ = await db.query(
      `INSERT INTO customer_visits
        (id, visit_number, customer_id, appointment_id, staff_id, subtotal, discount, gst_percent, gst_amount, total,
         amount_paid, remaining_amount, payment_method, payment_status, notes, commission_amount, advance_used, next_appointment_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
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
        totalPaid,
        remainingAmount,
        pMethod,
        pStatus,
        notes || null,
        totalCommission,
        advanceUsed,
        nextAppointmentDate || null,
        createdBy,
      ]
    );

    // Step 4: Insert Visit Items, Product Movement & AUTOMATIC Staff Work Register Entries
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

      // AUTOMATIC STAFF WORK REGISTER ENTRY for Services
      if (assignedStaffId && item.type === 'service') {
        const workEntryId = db.generateUUID();
        await db.query(
          `INSERT INTO staff_work_entries
            (id, staff_id, visit_id, visit_item_id, customer_name, service_name, description, amount, commission_amount, payment_status, notes, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE)`,
          [
            workEntryId,
            assignedStaffId,
            visitId,
            itemId,
            custName,
            item.name,
            item.name,
            item.lineTotal,
            item.commissionAmount || 0,
            pStatus,
            notes || null,
          ]
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

    // Step 7: Trigger Automated WhatsApp Thank You Message
    if (customerId) {
      try {
        const custQ = await db.query('SELECT name, phone FROM customers WHERE id = $1', [customerId]);
        const cust = custQ.rows[0];
        if (cust && cust.phone) {
          const { sendTextMessage } = require('../services/whatsappService');
          const thankYouMsg = `✨ Thank You for Visiting TRIO The Posh!\n\nDear ${cust.name || 'Client'},\nThank you for choosing us today! Your Customer Visit #${visitNumber} has been saved successfully.\nTotal Bill: ₹${total.toLocaleString('en-IN')}\n\nWe look forward to pampering you again soon! 💖`;
          
          sendTextMessage({
            to: cust.phone,
            body: thankYouMsg,
            customerName: cust.name,
            customerId,
            messageType: 'thank_you',
          }).catch((err) => console.error('[WhatsApp Visit Trigger Exception]', err.message));
        }
      } catch (waErr) {
        console.error('[WhatsApp Trigger Fetch Error]', waErr.message);
      }
    }

    res.status(201).json(visitQ.rows[0]);
  } catch (err) {
    console.error('Create visit error:', err);
    res.status(500).json({ error: 'Failed to record customer visit' });
  }
});

// DELETE /api/visits/:id — Cancel visit & remove linked staff work entries
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

    // Automatically remove linked Staff Work Register entries
    await db.query('DELETE FROM staff_work_entries WHERE visit_id = $1', [visitId]);
    await db.query('DELETE FROM visit_items WHERE visit_id = $1', [visitId]);
    await db.query('DELETE FROM customer_visits WHERE id = $1', [visitId]);

    res.status(204).end();
  } catch (err) {
    console.error('Delete visit error:', err);
    res.status(500).json({ error: 'Failed to cancel customer visit' });
  }
});

module.exports = router;
