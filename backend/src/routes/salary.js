const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: Get current month string YYYY-MM
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper: Get previous month string YYYY-MM
function getPreviousYearMonth(yearMonthStr) {
  const [y, m] = yearMonthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// GET /api/salary — Get month-wise payroll list with negative balances & carry-forward excess
router.get('/', authenticate, async (req, res) => {
  try {
    const yearMonth = req.query.month || getCurrentYearMonth();
    const prevYearMonth = getPreviousYearMonth(yearMonth);

    // 1. Fetch active staff
    const staffRes = await db.query(
      `SELECT id, name, phone, salary, status FROM staff WHERE status = 'active' ORDER BY name ASC`
    );
    const staffList = staffRes.rows || [];

    // 2. Fetch existing payrolls for this specific month
    const existingPayrollsRes = await db.query(
      `SELECT sp.*, s.name AS staff_name, s.phone AS staff_phone
       FROM staff_payrolls sp
       JOIN staff s ON s.id::text = sp.staff_id::text
       WHERE sp.year_month = $1`,
      [yearMonth]
    );

    const existingMap = new Map();
    (existingPayrollsRes.rows || []).forEach((row) => {
      existingMap.set(String(row.staff_id), row);
    });

    // 3. Fetch previous month payrolls to calculate carried-forward excess advances
    const prevPayrollsRes = await db.query(
      `SELECT * FROM staff_payrolls WHERE year_month = $1`,
      [prevYearMonth]
    );
    const prevMap = new Map();
    (prevPayrollsRes.rows || []).forEach((row) => {
      prevMap.set(String(row.staff_id), row);
    });

    // 4. Auto-initialize missing payroll records for this month
    const payrollRecords = [];
    for (const st of staffList) {
      const staffIdStr = String(st.id);
      let record = existingMap.get(staffIdStr);

      if (!record) {
        const id = db.generateUUID();
        const baseSalary = Number(st.salary || 0);

        // Carried-forward advance from previous month
        const prevRec = prevMap.get(staffIdStr);
        let carryForwardAdvance = 0;
        if (prevRec) {
          const prevAdvance = Number(prevRec.advance_paid || 0);
          const prevSalary = Number(prevRec.monthly_salary || 0);
          if (prevAdvance > prevSalary) {
            carryForwardAdvance = prevAdvance - prevSalary;
          }
        }

        const initialAdvance = carryForwardAdvance;
        const initialRemaining = baseSalary - initialAdvance;
        let initialStatus = 'Pending';
        if (initialRemaining < 0) {
          initialStatus = 'Overpaid';
        } else if (initialRemaining === 0) {
          initialStatus = 'Paid';
        } else if (initialAdvance > 0) {
          initialStatus = 'Partially Paid';
        }

        const initRes = await db.query(
          `INSERT INTO staff_payrolls
            (id, staff_id, year_month, monthly_salary, advance_paid, salary_paid, remaining_salary, status)
           VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
           ON CONFLICT(staff_id, year_month) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [id, staffIdStr, yearMonth, baseSalary, initialAdvance, initialRemaining, initialStatus]
        );

        record = initRes.rows[0] || {
          id,
          staff_id: staffIdStr,
          year_month: yearMonth,
          monthly_salary: baseSalary,
          advance_paid: initialAdvance,
          salary_paid: 0,
          remaining_salary: initialRemaining,
          status: initialStatus,
        };
      }

      record.staff_name = st.name;
      record.staff_phone = st.phone;
      payrollRecords.push(record);
    }

    // 5. Fetch payment logs for this month
    const paymentsRes = await db.query(
      `SELECT * FROM salary_payments WHERE month_covered = $1 ORDER BY payment_date DESC`,
      [yearMonth]
    );
    const allPayments = paymentsRes.rows || [];

    // Attach computed statistics & overpayment details
    const finalRecords = payrollRecords.map((rec) => {
      const history = allPayments.filter((p) => String(p.staff_id) === String(rec.staff_id));
      const monthlySalary = Number(rec.monthly_salary || 0);
      const advancePaid = Number(rec.advance_paid || 0);
      const salaryPaid = Number(rec.salary_paid || 0);

      // Remaining salary can be negative if overpaid!
      const remainingSalary = monthlySalary - advancePaid - salaryPaid;
      const overpaidAmount = remainingSalary < 0 ? Math.abs(remainingSalary) : 0;
      const excessAdvance = Math.max(0, advancePaid - monthlySalary);

      const totalPaidSoFar = advancePaid + salaryPaid;
      const progressPercent = monthlySalary > 0 ? Math.min(100, Math.round((totalPaidSoFar / monthlySalary) * 100)) : 0;

      let computedStatus = rec.status;
      if (remainingSalary < 0) {
        computedStatus = 'Paid'; // Marked as paid with overpaid badge
      } else if (remainingSalary === 0 && monthlySalary > 0) {
        computedStatus = 'Paid';
      } else if (advancePaid > 0 || salaryPaid > 0) {
        computedStatus = 'Partially Paid';
      }

      return {
        ...rec,
        monthly_salary: monthlySalary,
        advance_paid: advancePaid,
        salary_paid: salaryPaid,
        remaining_salary: remainingSalary,
        overpaid_amount: overpaidAmount,
        total_paid: totalPaidSoFar,
        progress_percent: progressPercent,
        excess_advance: excessAdvance,
        status: computedStatus,
        history,
      };
    });

    // 6. Dashboard Summary Cards
    const summary = {
      year_month: yearMonth,
      total_monthly_expense: finalRecords.reduce((sum, r) => sum + r.monthly_salary, 0),
      total_salary_paid: finalRecords.reduce((sum, r) => sum + r.salary_paid, 0),
      total_advances_paid: finalRecords.reduce((sum, r) => sum + r.advance_paid, 0),
      total_remaining_to_pay: finalRecords.reduce((sum, r) => sum + Math.max(0, r.remaining_salary), 0),
      total_overpaid_amount: finalRecords.reduce((sum, r) => sum + r.overpaid_amount, 0),
      paid_employees_count: finalRecords.filter((r) => r.remaining_salary <= 0).length,
      partially_paid_count: finalRecords.filter((r) => r.remaining_salary > 0 && (r.advance_paid > 0 || r.salary_paid > 0)).length,
      pending_count: finalRecords.filter((r) => r.remaining_salary === r.monthly_salary).length,
    };

    res.json({
      month: yearMonth,
      summary,
      payrolls: finalRecords,
    });
  } catch (err) {
    console.error('Fetch payroll error:', err);
    res.status(500).json({ error: 'Failed to load staff salary records' });
  }
});

// POST /api/salary/advance — Record Advance Salary Payout
router.post('/advance', authenticate, requireAdmin, async (req, res) => {
  try {
    const { payrollId, staffId, month, amount, paymentMode, paymentDate, note } = req.body;

    if (!staffId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid staff ID and advance amount are required' });
    }

    const yearMonth = month || getCurrentYearMonth();
    const advanceAmt = Number(amount);

    const payrollQ = await db.query(
      `SELECT * FROM staff_payrolls WHERE staff_id::text = $1 AND year_month = $2`,
      [String(staffId), yearMonth]
    );

    if (!payrollQ.rows[0]) {
      return res.status(404).json({ error: 'Payroll record for this month not found' });
    }

    const currentRec = payrollQ.rows[0];
    const newAdvancePaid = Number(currentRec.advance_paid || 0) + advanceAmt;
    const newSalaryPaid = Number(currentRec.salary_paid || 0);
    const monthlySalary = Number(currentRec.monthly_salary || 0);

    const newRemaining = monthlySalary - newAdvancePaid - newSalaryPaid;
    let newStatus = 'Partially Paid';
    if (newRemaining <= 0) {
      newStatus = 'Paid';
    }

    await db.query(
      `UPDATE staff_payrolls
       SET advance_paid = $1, salary_paid = $2, remaining_salary = $3, status = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [newAdvancePaid, newSalaryPaid, newRemaining, newStatus, currentRec.id]
    );

    const payId = db.generateUUID();
    const pDate = (paymentDate && typeof paymentDate === 'string' && paymentDate.trim().length > 0)
      ? paymentDate.trim()
      : new Date().toLocaleDateString('en-CA');

    await db.query(
      `INSERT INTO salary_payments (id, payroll_id, staff_id, payment_date, amount, payment_mode, payment_type, month_covered, note)
       VALUES ($1, $2, $3, $4, $5, $6, 'advance', $7, $8)`,
      [payId, currentRec.id, String(staffId), pDate, advanceAmt, paymentMode || 'cash', yearMonth, note || null]
    );

    res.json({
      message: 'Advance payment recorded successfully',
      status: newStatus,
      advance_paid: newAdvancePaid,
      remaining_salary: newRemaining,
    });
  } catch (err) {
    console.error('Record advance error:', err);
    res.status(500).json({ error: 'Failed to record advance salary payout' });
  }
});

// POST /api/salary/clear-advance — Clear / Adjust Outstanding Advance
router.post('/clear-advance', authenticate, requireAdmin, async (req, res) => {
  try {
    const { staffId, month, option, clearAmount } = req.body;

    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }

    const yearMonth = month || getCurrentYearMonth();

    const payrollQ = await db.query(
      `SELECT * FROM staff_payrolls WHERE staff_id::text = $1 AND year_month = $2`,
      [String(staffId), yearMonth]
    );

    if (!payrollQ.rows[0]) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    const currentRec = payrollQ.rows[0];
    const monthlySalary = Number(currentRec.monthly_salary || 0);
    const salaryPaid = Number(currentRec.salary_paid || 0);
    let newAdvancePaid = 0;

    if (option === 'mark_cleared') {
      // Option 2: Employee returned money separately -> Reset advance_paid to 0
      newAdvancePaid = 0;
    } else {
      // Option 1: Adjust from next salary -> deduct clearAmount or reset advance_paid to base salary level
      const currentAdv = Number(currentRec.advance_paid || 0);
      const amtToDeduct = Number(clearAmount || currentAdv);
      newAdvancePaid = Math.max(0, currentAdv - amtToDeduct);
    }

    const newRemaining = monthlySalary - newAdvancePaid - salaryPaid;
    const newStatus = newRemaining <= 0 ? 'Paid' : (newAdvancePaid > 0 || salaryPaid > 0 ? 'Partially Paid' : 'Pending');

    await db.query(
      `UPDATE staff_payrolls
       SET advance_paid = $1, remaining_salary = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newAdvancePaid, newRemaining, newStatus, currentRec.id]
    );

    res.json({
      message: option === 'mark_cleared' ? 'Advance marked as cleared successfully' : 'Advance adjusted from salary successfully',
      advance_paid: newAdvancePaid,
      remaining_salary: newRemaining,
      status: newStatus,
    });
  } catch (err) {
    console.error('Clear advance error:', err);
    res.status(500).json({ error: 'Failed to clear advance' });
  }
});

// POST /api/salary/pay-remaining — Pay Remaining Salary & Complete Month
router.post('/pay-remaining', authenticate, requireAdmin, async (req, res) => {
  try {
    const { payrollId, staffId, month, paymentMode, paymentDate, note } = req.body;

    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }

    const yearMonth = month || getCurrentYearMonth();

    const payrollQ = await db.query(
      `SELECT * FROM staff_payrolls WHERE staff_id::text = $1 AND year_month = $2`,
      [String(staffId), yearMonth]
    );

    if (!payrollQ.rows[0]) {
      return res.status(404).json({ error: 'Payroll record for this month not found' });
    }

    const currentRec = payrollQ.rows[0];
    const remainingToPay = Number(currentRec.monthly_salary || 0) - Number(currentRec.advance_paid || 0) - Number(currentRec.salary_paid || 0);
    const amountToPay = Math.max(0, remainingToPay);

    const newSalaryPaid = Number(currentRec.salary_paid || 0) + amountToPay;

    await db.query(
      `UPDATE staff_payrolls
       SET salary_paid = $1, remaining_salary = 0, status = 'Paid', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newSalaryPaid, currentRec.id]
    );

    const payId = db.generateUUID();
    const pDate = (paymentDate && typeof paymentDate === 'string' && paymentDate.trim().length > 0)
      ? paymentDate.trim()
      : new Date().toLocaleDateString('en-CA');

    await db.query(
      `INSERT INTO salary_payments (id, payroll_id, staff_id, payment_date, amount, payment_mode, payment_type, month_covered, note)
       VALUES ($1, $2, $3, $4, $5, $6, 'salary', $7, $8)`,
      [payId, currentRec.id, String(staffId), pDate, amountToPay, paymentMode || 'cash', yearMonth, note || null]
    );

    res.json({ message: 'Remaining salary paid and month completed!', amountPaid: amountToPay, status: 'Paid' });
  } catch (err) {
    console.error('Pay remaining salary error:', err);
    res.status(500).json({ error: 'Failed to record salary payout' });
  }
});

// GET /api/salary/history — Month-wise archive history for staff
router.get('/history', authenticate, async (req, res) => {
  try {
    const { staffId } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (staffId) {
      params.push(String(staffId));
      where += ` AND sp.staff_id::text = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT sp.*, s.name AS staff_name, s.phone AS staff_phone
       FROM staff_payrolls sp
       JOIN staff s ON s.id::text = sp.staff_id::text
       ${where}
       ORDER BY sp.year_month DESC`,
      params
    );

    res.json(rows || []);
  } catch (err) {
    console.error('Fetch payroll history error:', err);
    res.status(500).json({ error: 'Failed to fetch payroll history' });
  }
});

module.exports = router;
