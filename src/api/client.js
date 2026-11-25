// src/api/client.js
import { getDb, saveDb, resetDb, checkAndGenerateNotifications } from '../services/mockStorage.js';

function delay(ms = 50) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).substr(2, 9);
}

function getLocalDateString(d = new Date()) {
  if (!d) return '';
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d).split('T')[0];
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Client object mirroring Axios API structure ({ data: ... })
const client = {
  async get(url, config = {}) {
    await delay();
    const db = getDb();
    const cleanUrl = url.split('?')[0];

    // Notifications
    if (cleanUrl === '/notifications') {
      const list = checkAndGenerateNotifications(db);
      return { data: list };
    }

    // Auth
    if (cleanUrl === '/auth/profile') {
      const user = db.users[0] || { name: 'Admin', email: 'admin@salon.com', role: 'admin' };
      return { data: user };
    }

    // Dashboard Stats
    if (cleanUrl === '/dashboard/stats') {
      const today = getLocalDateString();

      // Filter today's visits
      const todayVisits = (db.visits || []).filter((v) => {
        const cDate = getLocalDateString(v.created_at || v.date || v.visit_date);
        return cDate === today;
      });

      // Categorize Today's Visits for Revenue Breakdown
      let todayCashRevenue = 0;
      let todayCashCount = 0;
      let todayOnlineRevenue = 0;
      let todayOnlineCount = 0;
      let advanceUsedToday = 0;

      todayVisits.forEach((v) => {
        const pm = (v.payment_method || v.paymentMethod || '').toString().toLowerCase();
        const amt = Number(v.final_amount || v.total || v.total_amount || v.amountPaid || 0);

        if (pm === 'cash') {
          todayCashRevenue += amt;
          todayCashCount += 1;
        } else if (pm === 'advance' || pm === 'use_advance' || pm === 'advance wallet') {
          advanceUsedToday += amt;
        } else {
          todayOnlineRevenue += amt;
          todayOnlineCount += 1;
        }
      });

      const todayRevenue = todayCashRevenue + todayOnlineRevenue + advanceUsedToday;

      // Expenses Today
      const todayExpenses = (db.expenses || [])
        .filter((e) => e.date === today || (e.created_at && e.created_at.startsWith(today)))
        .reduce((acc, e) => acc + Number(e.amount || 0), 0);

      // Pending Payments Total
      const pendingVisitsList = (db.visits || []).filter((v) => {
        const ps = (v.payment_status || '').toLowerCase();
        const pm = (v.payment_method || v.paymentMethod || '').toLowerCase();
        return ps === 'pending' || ps === 'partial' || pm === 'pending';
      });
      const pendingPayments = pendingVisitsList.reduce((acc, v) => {
        const total = Number(v.final_amount || v.total || v.total_amount || 0);
        const paid = Number(v.amountPaid || v.amount_paid || 0);
        const ps = (v.payment_status || '').toLowerCase();
        const pm = (v.payment_method || v.paymentMethod || '').toLowerCase();
        return acc + Math.max(0, total - (ps === 'pending' || pm === 'pending' ? 0 : paid));
      }, 0);

      // Appointments Today
      const todayAppointmentsList = (db.appointments || []).filter((a) => {
        const aDate = a.appointment_date || a.appointmentDate || a.date || '';
        const cDate = a.created_at || '';
        return aDate === today || cDate.startsWith(today);
      });
      const todayAppointments = todayAppointmentsList.length;

      // Customers Today
      const todayCustomersCount = new Set(
        todayVisits.map((v) => v.customer_id || v.customerId || v.id || v.customer_name).filter(Boolean)
      ).size;

      // Staff Attendance Present
      const todayAttendance = (db.attendance || []).filter((a) => a.date === today);
      const todayStaffPresentList = (db.staff || [])
        .filter((s) => s.status !== 'inactive')
        .filter((s) => {
          const att = todayAttendance.find((a) => String(a.staff_id || a.staffId) === String(s.id));
          if (!att) return true;
          return att.status === 'present' || att.status === 'half_day';
        })
        .map((s) => ({
          id: s.id,
          name: s.name,
          staff_name: s.name,
          phone: s.phone || '',
          staff_phone: s.phone || '',
          role: s.role || 'Stylist',
        }));
      const staffPresent = todayStaffPresentList.length;

      // Low Stock Inventory Count
      const lowStockProductsList = (db.products || []).filter(
        (p) => (p.stock_quantity || 0) <= (p.low_stock_threshold || 5)
      );
      const lowStockCount = lowStockProductsList.length;

      // Staff Work Value (Unified with Staff Work Register)
      let staffWorkValue = 0;
      todayVisits.forEach((v) => {
        const items = Array.isArray(v.items) && v.items.length > 0 ? v.items : [
          {
            name: v.service_name || 'Salon Service',
            price: v.total || v.final_amount || 0,
            quantity: 1,
            staffId: v.staff_id || v.staffId,
            staff_name: v.staff_name,
          },
        ];

        items.forEach((item) => {
          const itemStaffId = item.staffId || item.staff_id || v.staff_id || v.staffId;
          const itemStaffName = item.staff_name || item.staffName || v.staff_name || '';

          if (
            itemStaffId === 'counter' ||
            itemStaffId === 'counter_sale' ||
            (itemStaffName || '').toLowerCase().includes('counter sale')
          ) {
            return;
          }

          const itemTotal = Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1) - Number(item.discount || 0);
          staffWorkValue += itemTotal;
        });
      });

      // Expenses Paid in Cash Today
      const todayCashExpenses = (db.expenses || [])
        .filter((e) => {
          const eDate = getLocalDateString(e.date || e.created_at);
          const pm = (e.payment_method || e.paymentMethod || 'cash').toString().toLowerCase();
          return eDate === today && pm === 'cash';
        })
        .reduce((acc, e) => acc + Number(e.amount || 0), 0);

      // Automated Daily Register Balance (All Payment Methods: Cash, UPI, Card, Advance)
      if (!db.daily_balances) db.daily_balances = {};
      const todayBalanceRec = db.daily_balances[today] || db.daily_balance || {};
      const todayOpeningBalance = todayBalanceRec.opening_balance !== undefined ? Number(todayBalanceRec.opening_balance) : 0;
      const todayClosingBalance = todayOpeningBalance + todayRevenue - todayExpenses;

      return {
        data: {
          todayRevenue,
          todayCashRevenue,
          todayCashCount,
          todayCashExpenses,
          todayOnlineRevenue,
          todayOnlineCount,
          todayExpenses,
          staffWorkValue,
          advanceUsedToday,
          todayOpeningBalance,
          todayClosingBalance,
          todayBalanceNotes: todayBalanceRec.notes || '',
          todayAppointments,
          todayAppointmentsList,
          todayCustomers: todayVisits.length,
          pendingPayments,
          pendingVisits: pendingVisitsList,
          paidPayments: todayRevenue,
          staffPresent,
          todayStaffPresentList,
          lowStockCount,
          lowStockProductsList,
          todayInvoicesList: todayVisits,
          monthlyRevenueTrend: [
            { month: 'Jan', revenue: 0 },
            { month: 'Feb', revenue: 0 },
            { month: 'Mar', revenue: 0 },
            { month: 'Apr', revenue: todayRevenue },
          ],
          recentInvoices: (db.visits || []).slice(0, 5),
          upcomingAppointments: (db.appointments || []).slice(0, 5),
        },
      };
    }

    if (cleanUrl === '/dashboard/balance') {
      const { date } = config.params || {};
      const targetDate = date || getLocalDateString();
      if (!db.daily_balances) db.daily_balances = {};

      const dateVisits = (db.visits || []).filter((v) => {
        const cDate = getLocalDateString(v.created_at || v.date || v.visit_date);
        return cDate === targetDate;
      });

      let cashRevenue = 0;
      let onlineRevenue = 0;
      let cardRevenue = 0;
      let advanceRevenue = 0;

      dateVisits.forEach((v) => {
        const pm = (v.payment_method || v.paymentMethod || '').toString().toLowerCase();
        const amt = Number(v.final_amount || v.total || v.total_amount || v.amountPaid || 0);

        if (pm === 'cash') {
          cashRevenue += amt;
        } else if (pm === 'card') {
          cardRevenue += amt;
        } else if (pm === 'advance' || pm === 'use_advance' || pm === 'advance wallet') {
          advanceRevenue += amt;
        } else {
          onlineRevenue += amt;
        }
      });

      const totalInflow = cashRevenue + onlineRevenue + cardRevenue + advanceRevenue;

      const totalExpenses = (db.expenses || [])
        .filter((e) => {
          const eDate = getLocalDateString(e.date || e.created_at);
          return eDate === targetDate;
        })
        .reduce((acc, e) => acc + Number(e.amount || 0), 0);

      const storedRec = db.daily_balances[targetDate] || db.daily_balance || {};
      const openingBalance = storedRec.opening_balance !== undefined ? Number(storedRec.opening_balance) : 0;
      const autoClosingBalance = openingBalance + totalInflow - totalExpenses;
      const closingBalance = storedRec.closing_balance !== undefined ? Number(storedRec.closing_balance) : autoClosingBalance;

      return {
        data: {
          date: targetDate,
          openingBalance,
          closingBalance,
          autoClosingBalance,
          totalInflow,
          totalExpenses,
          cashRevenue,
          onlineRevenue,
          cardRevenue,
          advanceRevenue,
          revenue: totalInflow,
          expenses: totalExpenses,
          notes: storedRec.notes || '',
        },
      };
    }

    // Staff
    if (cleanUrl === '/staff') {
      const today = new Date().toISOString().split('T')[0];
      const attendanceList = db.attendance || [];

      const staffWithStatus = (db.staff || []).map((s) => {
        const att = attendanceList.find(
          (a) => a.date === today && String(a.staff_id || a.staffId || a.id) === String(s.id)
        );
        return {
          ...s,
          today_status: att ? att.status : 'present',
        };
      });

      return { data: staffWithStatus };
    }
    if (cleanUrl.startsWith('/staff/')) {
      const id = cleanUrl.split('/')[2];
      const staffMember = db.staff.find((s) => s.id === id);
      if (!staffMember) throw { response: { status: 404, data: { error: 'Staff not found' } } };
      return { data: staffMember };
    }

    // Attendance
    if (cleanUrl === '/attendance') {
      const date = config.params?.date || new Date().toISOString().split('T')[0];
      const records = db.attendance || [];
      const staffList = (db.staff || []).map((s) => {
        const existing = records.find((a) => a.staff_id === s.id && a.date === date);
        return {
          id: s.id,
          staff_id: s.id,
          name: s.name,
          phone: s.phone,
          status: existing ? existing.status : 'present',
          note: existing ? existing.note || '' : '',
          date,
        };
      });
      return { data: { attendance: staffList } };
    }
    if (cleanUrl === '/attendance/report') {
      const staffReport = (db.staff || []).map((s) => {
        const staffAtt = (db.attendance || []).filter((a) => a.staff_id === s.id);
        const presentDays = staffAtt.filter((a) => a.status === 'present').length;
        const absentDays = staffAtt.filter((a) => a.status === 'absent').length;
        const halfDays = staffAtt.filter((a) => a.status === 'halfday').length;
        const totalDays = Math.max(1, presentDays + absentDays + halfDays);
        return {
          staff_id: s.id,
          name: s.name,
          phone: s.phone,
          present_days: presentDays,
          absent_days: absentDays,
          half_days: halfDays,
          attendance_percentage: Math.round((presentDays / totalDays) * 100),
        };
      });
      return { data: { report: staffReport } };
    }

    // Customers
    if (cleanUrl === '/customers') {
      const enriched = (db.customers || []).map((c) => {
        const custVisits = (db.visits || []).filter((v) => String(v.customer_id || v.customerId) === String(c.id));
        const totalSpent = custVisits.reduce((sum, v) => sum + Number(v.final_amount || v.total || v.total_amount || 0), 0);
        const totalVisits = custVisits.length;
        const sortedVisits = [...custVisits].sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
        const lastVisitDate = sortedVisits.length > 0 ? (sortedVisits[0].created_at || sortedVisits[0].date || '') : null;
        return {
          ...c,
          total_spent: totalSpent,
          total_visits: totalVisits,
          visit_count: totalVisits,
          last_visit_date: lastVisitDate,
        };
      });
      return { data: enriched };
    }
    if (cleanUrl.startsWith('/customers/')) {
      const id = cleanUrl.split('/')[2];
      const customer = db.customers.find((c) => c.id === id);
      if (!customer) throw { response: { status: 404, data: { error: 'Customer not found' } } };
      const visits = (db.visits || []).filter((v) => String(v.customer_id || v.customerId) === String(id));
      const advances = (db.advance_transactions || []).filter((a) => String(a.customer_id) === String(id));
      const totalSpent = visits.reduce((sum, v) => sum + Number(v.final_amount || v.total || v.total_amount || 0), 0);
      const sortedVisits = [...visits].sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
      const lastVisitDate = sortedVisits.length > 0 ? (sortedVisits[0].created_at || sortedVisits[0].date || '') : null;

      // Format visits with visit_number and staff_name for display
      const formattedVisits = visits.map((v) => {
        const staffSummary = computeVisitStaffSummary(v);
        return {
          ...v,
          visit_number: v.visit_number || v.visit_code || `V-${v.id}`,
          staff_name: staffSummary,
          total: Number(v.total || v.final_amount || v.total_amount || 0),
          payment_method: v.payment_method || v.paymentMethod || 'Cash',
          payment_status: v.payment_status || 'Paid',
        };
      });

      return {
        data: {
          ...customer,
          visits: formattedVisits,
          history: formattedVisits,
          advanceHistory: advances,
          ledger: advances,
          visitCount: visits.length,
          total_visits: visits.length,
          lifetimeSpend: totalSpent,
          total_spent: totalSpent,
          last_visit_date: lastVisitDate,
        },
      };
    }

    // Permanent Customers
    if (cleanUrl === '/permanent-customers') {
      const list = (db.customers || []).filter((c) => c.is_permanent === 1).map((c) => {
        const custVisits = (db.visits || []).filter((v) => String(v.customer_id || v.customerId) === String(c.id));
        const totalSpent = custVisits.reduce((sum, v) => sum + Number(v.final_amount || v.total || v.total_amount || 0), 0);
        const totalVisits = custVisits.length;
        const sortedVisits = [...custVisits].sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
        const lastVisitDate = sortedVisits.length > 0 ? (sortedVisits[0].created_at || sortedVisits[0].date || '') : null;
        return {
          ...c,
          total_spent: totalSpent,
          total_visits: totalVisits,
          visit_count: totalVisits,
          last_visit_date: lastVisitDate,
        };
      });
      return { data: list };
    }

    // Permanent Customer Profile (GET /permanent-customers/:id)
    if (cleanUrl.match(/^\/permanent-customers\/[^/]+$/)) {
      const id = cleanUrl.split('/')[2];
      const customer = (db.customers || []).find((c) => String(c.id) === String(id));
      if (!customer) throw { response: { status: 404, data: { error: 'Permanent customer not found' } } };
      const visits = (db.visits || []).filter((v) => String(v.customer_id || v.customerId) === String(id));
      const advances = (db.advance_transactions || []).filter((a) => String(a.customer_id) === String(id));
      const totalSpent = visits.reduce((sum, v) => sum + Number(v.final_amount || v.total || v.total_amount || 0), 0);
      const sortedVisits = [...visits].sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
      const lastVisitDate = sortedVisits.length > 0 ? (sortedVisits[0].created_at || sortedVisits[0].date || '') : null;

      const totalAdvanceDeposited = advances.filter((a) => a.type === 'deposit').reduce((sum, a) => sum + Number(a.amount || 0), 0);
      const totalAdvanceUsed = advances.filter((a) => a.type === 'usage' || a.type === 'deduction').reduce((sum, a) => sum + Number(a.amount || 0), 0);

      // Format visits for display
      const formattedVisits = visits.map((v) => {
        const staffSummary = computeVisitStaffSummary(v);
        return {
          ...v,
          visit_number: v.visit_number || v.visit_code || `V-${v.id}`,
          staff_name: staffSummary,
          total: Number(v.total || v.final_amount || v.total_amount || 0),
          payment_method: v.payment_method || v.paymentMethod || 'Cash',
          payment_status: v.payment_status || 'Paid',
        };
      });

      return {
        data: {
          ...customer,
          visits: formattedVisits,
          history: formattedVisits,
          transactions: advances,
          ledger: advances,
          advanceHistory: advances,
          visitCount: visits.length,
          total_visits: visits.length,
          visit_count: visits.length,
          lifetimeSpend: totalSpent,
          total_spent: totalSpent,
          last_visit_date: lastVisitDate,
          lastVisitDate: lastVisitDate,
          advance_balance: customer.advance_balance || 0,
          total_advance_deposited: totalAdvanceDeposited || customer.total_advance_deposited || 0,
          total_advance_used: totalAdvanceUsed || customer.total_advance_used || 0,
        },
      };
    }

    // Services
    if (cleanUrl === '/services') {
      return { data: db.services };
    }

    // Products
    if (cleanUrl === '/products') {
      return { data: db.products };
    }

    // Appointments
    if (cleanUrl === '/appointments') {
      const formattedAppts = (db.appointments || []).map((a) => {
        const custObj = a.customer_id || a.customerId ? db.customers.find((c) => String(c.id) === String(a.customer_id || a.customerId)) : null;
        const staffObj = a.staff_id || a.staffId ? db.staff.find((s) => String(s.id) === String(a.staff_id || a.staffId)) : null;

        const sIds = a.service_ids || (a.serviceId ? [a.serviceId] : (a.service_id ? [a.service_id] : []));
        const matchedServices = (db.services || []).filter((s) => sIds.includes(String(s.id)) || sIds.includes(s.id));

        const serviceNames = matchedServices.length > 0
          ? matchedServices.map((s) => s.name).join(', ')
          : (a.service_name || 'Salon Service');

        const totalPrice = matchedServices.length > 0
          ? matchedServices.reduce((sum, s) => sum + Number(s.price || 0), 0)
          : Number(a.service_price || a.price || 0);

        const totalDuration = matchedServices.length > 0
          ? matchedServices.reduce((sum, s) => sum + Number(s.duration_minutes || 30), 0)
          : Number(a.duration_minutes || 30);

        return {
          ...a,
          customer_id: a.customer_id || a.customerId || null,
          customer_name: custObj ? custObj.name : (a.customer_name || 'Walk-in Client'),
          customer_phone: custObj ? custObj.phone : (a.customer_phone || a.phone || ''),
          staff_id: a.staff_id || a.staffId || null,
          staff_name: staffObj ? staffObj.name : (a.staff_name || 'Any Stylist'),
          service_ids: sIds,
          service_name: serviceNames,
          service_price: totalPrice,
          duration_minutes: totalDuration,
          selected_services: matchedServices,
        };
      });
      return { data: formattedAppts };
    }

function computeVisitStaffSummary(v) {
  if (!v) return 'Counter Sale';
  const items = v.items || [];

  const staffNamesSet = new Set();
  let hasProduct = false;

  items.forEach((item) => {
    const isProd = item.type === 'product' || item.item_type === 'product';
    const sName = item.staff_name || item.staffName;

    if (isProd || (sName && sName.includes('Counter Sale')) || item.staffId === 'counter') {
      hasProduct = true;
    }

    if (
      sName &&
      !sName.includes('Counter Sale') &&
      sName !== 'Walk-in' &&
      sName !== 'Salon Team'
    ) {
      const cleanName = sName.replace(/&\s*Counter Sale.*/g, '').trim();
      if (cleanName) staffNamesSet.add(cleanName);
    }
  });

  if (staffNamesSet.size === 0 && v.staff_name) {
    const topName = v.staff_name.replace(/&\s*Counter Sale.*/g, '').trim();
    if (
      topName &&
      !topName.includes('Counter Sale') &&
      topName !== 'Walk-in' &&
      topName !== 'Salon Team'
    ) {
      staffNamesSet.add(topName);
    }
  }

  const staffListArray = Array.from(staffNamesSet);

  if (staffListArray.length > 0 && hasProduct) {
    return `${staffListArray.join(', ')} & Counter Sale`;
  } else if (staffListArray.length > 0) {
    return staffListArray.join(', ');
  } else {
    return 'Counter Sale';
  }
}

    // Visits / Billing
    if (cleanUrl === '/visits') {
      const formattedVisits = (db.visits || []).map((v) => {
        const itemSum = (v.items || []).reduce((s, i) => s + Number(i.unitPrice || i.price || 0) * Number(i.quantity || 1), 0);
        const netTotal = Number(v.total || v.final_amount || v.total_amount || itemSum || 0);
        const amountPaid = v.amount_paid !== undefined ? Number(v.amount_paid) : (v.amountPaid !== undefined ? Number(v.amountPaid) : netTotal);
        const remaining = Math.max(0, netTotal - amountPaid);

        const pmRaw = (v.payment_method || v.paymentMethod || 'Cash').toString().toLowerCase();
        let normMethod = 'Cash';
        if (pmRaw === 'use_advance' || pmRaw === 'advance' || pmRaw === 'advance wallet') {
          normMethod = 'Advance';
        } else if (pmRaw === 'upi' || pmRaw === 'online') {
          normMethod = 'UPI';
        } else if (pmRaw === 'card') {
          normMethod = 'Card';
        } else if (pmRaw === 'pending') {
          normMethod = 'Pending';
        }

        const staffSummary = computeVisitStaffSummary(v);

        return {
          ...v,
          visit_number: v.visit_number || v.visit_code || `V-${v.id}`,
          visit_code: v.visit_code || v.visit_number || `V-${v.id}`,
          staff_name: staffSummary,
          staffName: staffSummary,
          total: netTotal,
          final_amount: netTotal,
          total_amount: netTotal,
          subtotal: v.subtotal || netTotal,
          amount_paid: amountPaid,
          amountPaid: amountPaid,
          remaining_amount: remaining,
          payment_method: normMethod,
          paymentMethod: normMethod,
          payment_status: v.payment_status || (remaining === 0 ? 'Paid' : 'Partial'),
        };
      });
      return { data: formattedVisits };
    }
    if (cleanUrl.startsWith('/visits/')) {
      const id = cleanUrl.split('/')[2];
      const visit = db.visits.find((v) => v.id === id);
      if (!visit) throw { response: { status: 404, data: { error: 'Visit not found' } } };
      const itemSum = (visit.items || []).reduce((s, i) => s + Number(i.unitPrice || i.price || 0) * Number(i.quantity || 1), 0);
      const netTotal = Number(visit.total || visit.final_amount || visit.total_amount || itemSum || 0);
      const staffSummary = computeVisitStaffSummary(visit);
      const formatted = {
        ...visit,
        visit_number: visit.visit_number || visit.visit_code || `V-${visit.id}`,
        visit_code: visit.visit_code || visit.visit_number || `V-${visit.id}`,
        staff_name: staffSummary,
        staffName: staffSummary,
        total: netTotal,
        final_amount: netTotal,
        subtotal: visit.subtotal || netTotal,
        amount_paid: visit.amount_paid !== undefined ? Number(visit.amount_paid) : netTotal,
      };
      return { data: formatted };
    }

    // Commissions
    if (cleanUrl === '/commissions') {
      return { data: db.commissions };
    }

    // Salary & Staff Work
    if (cleanUrl === '/salary') {
      let totalMonthlySalary = 0;
      let totalSalaryPaid = 0;
      let totalAdvancePaid = 0;
      let totalRemainingSalary = 0;
      let settledStaffCount = 0;

      const payrollList = (db.staff || []).map((s) => {
        const monthlySalary = Number(s.salary || 0);
        const staffComms = (db.commissions || [])
          .filter((c) => String(c.staff_id || c.staffId) === String(s.id))
          .reduce((acc, c) => acc + Number(c.commission_amount || 0), 0);

        const advancePaid = (db.salary_advances || [])
          .filter((a) => String(a.staff_id || a.staffId) === String(s.id))
          .reduce((acc, a) => acc + Number(a.amount || 0), 0);

        const salaryPaid = (db.salary_payments || [])
          .filter((sp) => String(sp.staff_id || sp.staffId) === String(s.id))
          .reduce((acc, sp) => acc + Number(sp.amount || 0), 0);

        const totalPayable = monthlySalary + staffComms;
        const remainingBalance = Math.max(0, totalPayable - advancePaid - salaryPaid);

        totalMonthlySalary += monthlySalary;
        totalSalaryPaid += salaryPaid;
        totalAdvancePaid += advancePaid;
        totalRemainingSalary += remainingBalance;
        if (remainingBalance === 0) settledStaffCount++;

        return {
          id: s.id,
          staff_id: s.id,
          staff_name: s.name,
          name: s.name,
          phone: s.phone || '',
          staff_phone: s.phone || '',
          monthly_salary: monthlySalary,
          total_commission: staffComms,
          advance_paid: advancePaid,
          salary_paid: salaryPaid,
          remaining_salary: remainingBalance,
          remaining_balance: remainingBalance,
          excess_advance: Math.max(0, advancePaid + salaryPaid - totalPayable),
          overpaid_amount: Math.max(0, advancePaid + salaryPaid - totalPayable),
          payroll_status: remainingBalance === 0 ? 'SETTLED' : 'PENDING',
        };
      });

      return {
        data: {
          payrolls: payrollList,
          summary: {
            totalMonthlySalary,
            total_monthly_expense: totalMonthlySalary,
            totalSalaryPaid,
            total_salary_paid: totalSalaryPaid,
            totalAdvancePaid,
            total_advances_paid: totalAdvancePaid,
            totalRemainingSalary,
            total_remaining_to_pay: totalRemainingSalary,
            totalOverpaidAmount: 0,
            total_overpaid_amount: 0,
            settledStaffCount,
            total_settled_staff: settledStaffCount,
          },
        },
      };
    }

    if (cleanUrl === '/salary/history') {
      return { data: db.salary_payments || [] };
    }

    if (cleanUrl === '/staff-work') {
      const entries = [];
      let totalWorkAmount = 0;
      let completedServicesCount = 0;
      const { staffId, date, month } = config.params || {};

      const filteredVisits = (db.visits || []).filter((v) => {
        const vDate = getLocalDateString(v.created_at || v.date || v.visit_date);
        if (date && vDate !== date && !vDate.startsWith(date)) return false;
        if (month && !vDate.startsWith(month)) return false;
        return true;
      });

      filteredVisits.forEach((v) => {
        const visitNo = v.visit_number || v.visit_code || `V-${v.id}`;
        const items = Array.isArray(v.items) && v.items.length > 0 ? v.items : [
          {
            name: v.service_name || 'Salon Service',
            price: v.total || v.final_amount || 0,
            quantity: 1,
            staffId: v.staff_id || v.staffId,
            staff_name: v.staff_name,
          },
        ];

        items.forEach((item) => {
          const itemStaffId = item.staffId || item.staff_id || v.staff_id || v.staffId;
          const itemStaffName = item.staff_name || item.staffName || v.staff_name || '';

          // Skip Counter Sale items or products assigned to counter
          if (
            itemStaffId === 'counter' ||
            itemStaffId === 'counter_sale' ||
            (itemStaffName || '').toLowerCase().includes('counter sale')
          ) {
            return;
          }

          // If filtering by specific staffId, skip non-matching
          if (staffId && String(itemStaffId) !== String(staffId)) {
            return;
          }

          const itemTotal = Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1) - Number(item.discount || 0);
          totalWorkAmount += itemTotal;
          completedServicesCount += Number(item.quantity || 1);

          const staffObj = (db.staff || []).find((s) => String(s.id) === String(itemStaffId));

          entries.push({
            id: `we_${v.id}_${item.id || item.item_id || Math.random().toString(36).substr(2, 6)}`,
            visit_id: v.id,
            visit_number: visitNo,
            staff_id: itemStaffId,
            staff_name: staffObj?.name || itemStaffName || v.staff_name || 'Staff Member',
            staff_phone: staffObj?.phone || v.phone || '',
            customer_name: v.customer_name || 'Walk-in Client',
            service_name: item.name || 'Salon Service',
            amount: itemTotal,
            payment_status: v.payment_status || 'Paid',
            created_at: v.created_at,
          });
        });
      });

      return {
        data: {
          entries,
          totalWorkAmount,
          totalCommission: Math.round(totalWorkAmount * 0.15),
          completedServicesCount,
        },
      };
    }

    // Expenses
    if (cleanUrl === '/expenses') {
      return { data: db.expenses };
    }
    if (cleanUrl === '/expenses/categories') {
      const defaultCats = [
        'Electricity',
        'Rent',
        'Water Bill',
        'Internet',
        'Staff Tea/Snacks',
        'Cleaning',
        'Stationery',
        'Miscellaneous',
        'Product Supplies',
        'Staff Advance',
        'Other',
      ];
      if (!db.expense_categories || !db.expense_categories.length) {
        db.expense_categories = defaultCats;
        saveDb(db);
      }
      return { data: { categories: db.expense_categories, customCategories: db.expense_categories } };
    }

    // Reports
    if (cleanUrl === '/reports/monthly') {
      const visits = db.visits || [];
      const expenses = db.expenses || [];
      const services = db.services || [];
      const staffList = db.staff || [];
      const products = db.products || [];

      const totalRevenue = visits.reduce((acc, v) => acc + Number(v.final_amount || v.total || 0), 0);
      const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
      const netRevenue = totalRevenue - totalExpenses;
      const totalGst = Math.round(totalRevenue * 0.18);
      const totalAppointments = (db.appointments || []).length;
      const totalCustomersServed = new Set(visits.map((v) => v.customer_id)).size;
      const totalProductsSold = visits.reduce((acc, v) => {
        const prodCount = (v.items || []).filter((i) => i.item_type === 'product').reduce((a, b) => a + (b.quantity || 1), 0);
        return acc + prodCount;
      }, 0);

      const totalSalaryPaid = (db.salary_payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);
      const totalCommissionPaid = (db.commissions || []).reduce((acc, c) => acc + Number(c.amount || c.commission_amount || 0), 0);

      const cashPayments = visits.filter((v) => (v.payment_method || '').toLowerCase() === 'cash').reduce((acc, v) => acc + Number(v.final_amount || 0), 0);
      const onlinePayments = visits.filter((v) => (v.payment_method || '').toLowerCase() === 'upi' || (v.payment_method || '').toLowerCase() === 'online').reduce((acc, v) => acc + Number(v.final_amount || 0), 0);
      const cardPayments = visits.filter((v) => (v.payment_method || '').toLowerCase() === 'card').reduce((acc, v) => acc + Number(v.final_amount || 0), 0);
      const pendingPayments = visits.filter((v) => (v.payment_status || '').toLowerCase() === 'pending').reduce((acc, v) => acc + Number(v.final_amount || 0), 0);

      // Real Service Performance from visits
      const servicePerformance = services.map((s) => {
        let bookingsCount = 0;
        let rev = 0;
        visits.forEach((v) => {
          (v.items || []).forEach((item) => {
            if (String(item.item_id || item.id) === String(s.id) || (item.name || '').toLowerCase() === (s.name || '').toLowerCase()) {
              bookingsCount += Number(item.quantity || 1);
              rev += Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1) - Number(item.discount || 0);
            }
          });
        });
        return {
          service_name: s.name,
          name: s.name,
          bookings_count: bookingsCount,
          total_bookings: bookingsCount,
          revenue_generated: rev,
          total_revenue: rev,
        };
      });

      // Real Stylist Performance from visits
      const stylistPerformance = staffList.map((st) => {
        let visitsCount = 0;
        let rev = 0;
        visits.forEach((v) => {
          const vStaffId = v.staff_id || v.staffId;
          let matched = String(vStaffId) === String(st.id);
          (v.items || []).forEach((item) => {
            const iStaffId = item.staffId || item.staff_id || vStaffId;
            if (String(iStaffId) === String(st.id)) {
              matched = true;
              rev += Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1) - Number(item.discount || 0);
            }
          });
          if (matched) visitsCount += 1;
        });
        return {
          staff_name: st.name,
          customer_visits_developed: visitsCount,
          visits_count: visitsCount,
          total_revenue_generated: rev,
        };
      });

      // Real Product Sales Performance from visits
      const productSalesPerformance = products.map((p) => {
        let unitsSold = 0;
        let rev = 0;
        visits.forEach((v) => {
          (v.items || []).forEach((item) => {
            if (String(item.item_id || item.id) === String(p.id) || (item.name || '').toLowerCase() === (p.name || '').toLowerCase()) {
              unitsSold += Number(item.quantity || 1);
              rev += Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1) - Number(item.discount || 0);
            }
          });
        });
        return {
          product_name: p.name,
          name: p.name,
          units_sold: unitsSold,
          revenue_generated: rev,
        };
      });

      return {
        data: {
          summary: {
            totalRevenue,
            netRevenue,
            totalGst,
            totalAppointments,
            totalCustomersServed,
            totalProductsSold,
            totalSalaryPaid,
            totalCommissionPaid,
            revenueGrowth: 0,
            appointmentsGrowth: 0,
            customerGrowth: 0,
            productSalesGrowth: 0,
            cashPayments,
            onlinePayments,
            cardPayments,
            pendingPayments,
          },
          growth: {
            revenueGrowth: 0,
            appointmentGrowth: 0,
            customerGrowth: 0,
            productSalesGrowth: 0,
          },
          servicePerformance,
          stylistPerformance,
          productSalesPerformance,
          monthlyBreakdown: [
            { month: 'Jan', revenue: 0, expenses: 0 },
            { month: 'Feb', revenue: 0, expenses: 0 },
            { month: 'Mar', revenue: 0, expenses: 0 },
            { month: 'Apr', revenue: totalRevenue, expenses: totalExpenses },
          ],
        },
      };
    }

    // Settings
    if (cleanUrl === '/settings') {
      return { data: db.settings };
    }

    // WhatsApp
    if (cleanUrl === '/whatsapp/dashboard') {
      const history = db.whatsapp?.history || [];
      const today = new Date().toISOString().split('T')[0];
      const todaySentCount = history.filter((h) => h.created_at && h.created_at.startsWith(today)).length;
      const deliveredCount = history.filter((h) => h.status === 'delivered' || h.status === 'read').length;
      const failedCount = history.filter((h) => h.status === 'failed').length;
      const totalSent = history.length;
      const deliveryRate = totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100;
      const pendingCount = db.whatsapp?.dashboard?.pending || 0;
      const scheduledCount = db.whatsapp?.dashboard?.scheduled_count || 0;
      const activeRulesCount = (db.whatsapp?.automations || []).filter((a) => a.is_enabled).length;

      return {
        data: {
          todaySent: todaySentCount,
          total_sent: totalSent,
          delivered: deliveredCount,
          failed: failedCount,
          pending: pendingCount,
          scheduled: scheduledCount,
          deliveryRate: deliveryRate,
          delivered_rate: deliveryRate,
          activeRulesCount,
          recentActivity: history.slice(0, 5),
        },
      };
    }
    if (cleanUrl === '/whatsapp/automations') {
      return { data: db.whatsapp.automations };
    }
    if (cleanUrl === '/whatsapp/templates') {
      return { data: db.whatsapp.templates };
    }
    if (cleanUrl === '/whatsapp/history') {
      return { data: db.whatsapp.history };
    }
    if (cleanUrl === '/whatsapp/settings') {
      return { data: db.whatsapp.settings };
    }

    return { data: [] };
  },

  async post(url, payload = {}) {
    await delay();
    const db = getDb();
    const cleanUrl = url.split('?')[0];

    // Auth Login
    if (cleanUrl === '/auth/login') {
      const { email, password } = payload;
      const foundUser = db.users.find((u) => u.email === email && (u.password === password || password === 'admin123'));
      if (foundUser || email === 'admin@salon.com') {
        const userObj = foundUser || { id: 'u1', name: 'Salon Admin', email: 'admin@salon.com', role: 'admin' };
        localStorage.setItem('salon_token', 'mock_jwt_token_12345');
        localStorage.setItem('salon_user', JSON.stringify(userObj));
        return { data: { token: 'mock_jwt_token_12345', user: userObj } };
      }
      throw { response: { status: 401, data: { error: 'Invalid email or password' } } };
    }

    // Settings Reset
    if (cleanUrl === '/settings/reset-data') {
      const freshDb = resetDb();
      return { data: { message: 'Database reset to default mock state', settings: freshDb.settings } };
    }

    // Staff
    if (cleanUrl === '/staff') {
      const newStaff = { id: generateId('st'), status: 'active', ...payload };
      db.staff.push(newStaff);

      const today = new Date().toISOString().split('T')[0];
      const existingAtt = (db.attendance || []).find((a) => a.date === today && String(a.staff_id || a.staffId) === String(newStaff.id));
      if (!existingAtt) {
        db.attendance.push({
          id: generateId('att'),
          staff_id: newStaff.id,
          staffId: newStaff.id,
          date: today,
          status: 'present',
          note: 'Auto-marked present on staff creation',
        });
      }

      saveDb(db);
      return { data: newStaff };
    }

    // Attendance bulk & single
    if (cleanUrl === '/attendance/bulk' || cleanUrl === '/attendance') {
      const date = payload.date || new Date().toISOString().split('T')[0];
      const records = payload.records || payload.attendance || {};
      db.attendance = (db.attendance || []).filter((a) => a.date !== date);

      if (Array.isArray(records)) {
        records.forEach((rec) => {
          const sId = rec.staff_id || rec.staffId || rec.id;
          if (sId) {
            db.attendance.push({
              id: generateId('att'),
              staff_id: sId,
              staffId: sId,
              date,
              status: rec.status || 'present',
              note: rec.note || '',
            });
          }
        });
      } else {
        Object.entries(records || {}).forEach(([staff_id, status]) => {
          db.attendance.push({ id: generateId('att'), staff_id, staffId: staff_id, date, status, note: '' });
        });
      }
      saveDb(db);
      return { data: { message: 'Attendance saved successfully' } };
    }

    // Customers
    if (cleanUrl === '/customers') {
      const newCustomer = {
        id: generateId('c'),
        is_permanent: 0,
        advance_balance: 0,
        total_advance_deposited: 0,
        total_advance_used: 0,
        created_at: new Date().toISOString(),
        ...payload,
      };
      db.customers.push(newCustomer);
      saveDb(db);
      return { data: newCustomer };
    }

    // Permanent Customers Register
    if (cleanUrl === '/permanent-customers') {
      const initialAdvance = parseFloat(payload.initial_advance || payload.initialDeposit || 0);
      const newCustomer = {
        id: generateId('c'),
        is_permanent: 1,
        advance_balance: initialAdvance,
        total_advance_deposited: initialAdvance,
        total_advance_used: 0,
        created_at: new Date().toISOString(),
        ...payload,
      };
      db.customers.push(newCustomer);
      if (initialAdvance > 0) {
        db.advance_transactions.push({
          id: generateId('tx'),
          customer_id: newCustomer.id,
          customer_name: newCustomer.name,
          type: 'deposit',
          amount: initialAdvance,
          balance_after: initialAdvance,
          payment_method: payload.paymentMethod || payload.payment_method || 'Cash',
          notes: 'Initial Permanent Customer Deposit',
          created_at: new Date().toISOString(),
        });
      }
      saveDb(db);
      return { data: newCustomer };
    }

    // Customer Advance Deposit
    if (cleanUrl.includes('/advance')) {
      const parts = cleanUrl.split('/');
      const customerId = parts[2];
      const customer = db.customers.find((c) => c.id === customerId);
      if (customer) {
        const amt = parseFloat(payload.amount || 0);
        customer.advance_balance = (customer.advance_balance || 0) + amt;
        customer.total_advance_deposited = (customer.total_advance_deposited || 0) + amt;
        db.advance_transactions.push({
          id: generateId('tx'),
          customer_id: customerId,
          customer_name: customer.name,
          type: 'deposit',
          amount: amt,
          balance_after: customer.advance_balance,
          payment_method: payload.paymentMethod || payload.payment_method || 'Cash',
          notes: payload.notes || 'Advance Deposit',
          created_at: new Date().toISOString(),
        });
        saveDb(db);
      }
      return { data: customer };
    }

    // Services
    if (cleanUrl === '/services') {
      const newService = { id: generateId('s'), ...payload };
      db.services.push(newService);
      saveDb(db);
      return { data: newService };
    }

    // Products
    if (cleanUrl === '/products') {
      const newProduct = { id: generateId('p'), ...payload };
      db.products.push(newProduct);
      saveDb(db);
      return { data: newProduct };
    }

    // Appointments
    if (cleanUrl === '/appointments') {
      const custObj = payload.customerId ? db.customers.find((c) => String(c.id) === String(payload.customerId)) : null;
      const staffObj = payload.staffId ? db.staff.find((s) => String(s.id) === String(payload.staffId)) : null;

      const sIds = payload.service_ids || (payload.serviceId ? [payload.serviceId] : (payload.service_id ? [payload.service_id] : []));
      const matchedServices = (db.services || []).filter((s) => sIds.includes(String(s.id)) || sIds.includes(s.id));

      const serviceNames = matchedServices.length > 0
        ? matchedServices.map((s) => s.name).join(', ')
        : (payload.service_name || 'Salon Service');

      const totalPrice = matchedServices.length > 0
        ? matchedServices.reduce((sum, s) => sum + Number(s.price || 0), 0)
        : Number(payload.service_price || payload.price || 0);

      const totalDuration = matchedServices.length > 0
        ? matchedServices.reduce((sum, s) => sum + Number(s.duration_minutes || 30), 0)
        : Number(payload.duration_minutes || 30);

      const newAppt = {
        id: generateId('ap'),
        status: payload.status || 'booked',
        created_at: new Date().toISOString(),
        customer_id: payload.customerId || payload.customer_id || null,
        customer_name: custObj ? custObj.name : (payload.customer_name || 'Walk-in Client'),
        customer_phone: custObj ? custObj.phone : (payload.customer_phone || payload.phone || ''),
        staff_id: payload.staffId || payload.staff_id || null,
        staff_name: staffObj ? staffObj.name : (payload.staff_name || 'Any Stylist'),
        service_ids: sIds,
        service_name: serviceNames,
        service_price: totalPrice,
        duration_minutes: totalDuration,
        appointment_date: payload.appointmentDate || payload.appointment_date || getTodayDateString(),
        appointment_time: payload.appointmentTime || payload.appointment_time || '10:00',
        ...payload,
      };
      db.appointments.unshift(newAppt);
      saveDb(db);
      return { data: newAppt };
    }

    // Visits / Billing Invoice
    if (cleanUrl === '/visits') {
      const visitCode = 'V-' + (100 + db.visits.length + 1);
      const custObj = payload.customerId ? db.customers.find((c) => c.id === payload.customerId) : null;
      const staffId = payload.staffId || payload.staff_id;
      const staffObj = staffId && staffId !== 'counter' ? db.staff.find((s) => s.id === staffId) : null;

      const pmRaw = (payload.paymentMethod || payload.payment_method || 'Cash').toString().toLowerCase();
      let normMethod = 'Cash';
      if (pmRaw === 'use_advance' || pmRaw === 'advance' || pmRaw === 'advance wallet') {
        normMethod = 'Advance';
      } else if (pmRaw === 'upi' || pmRaw === 'online') {
        normMethod = 'UPI';
      } else if (pmRaw === 'card') {
        normMethod = 'Card';
      } else if (pmRaw === 'pending') {
        normMethod = 'Pending';
      }

      const netTotal = Number(payload.total || payload.final_amount || 0);
      const paidAmt = normMethod === 'Pending'
        ? 0
        : (payload.amountPaid !== undefined && payload.amountPaid !== null && payload.amountPaid !== ''
          ? Number(payload.amountPaid)
          : netTotal);
      const remainingAmt = Math.max(0, netTotal - paidAmt);
      const payStatus = remainingAmt === 0 ? 'Paid' : (paidAmt === 0 ? 'Pending' : 'Partial');

      const newVisit = {
        id: generateId('v'),
        visit_code: visitCode,
        visit_number: visitCode,
        customer_id: payload.customerId || null,
        customer_name: custObj ? custObj.name : (payload.customer_name || 'Walk-in Client'),
        phone: custObj ? custObj.phone : (payload.phone || ''),
        staff_id: staffId === 'counter' ? null : staffId,
        staff_name: staffId === 'counter' ? 'Counter Sale' : (staffObj ? staffObj.name : 'Walk-in'),
        ...payload,
        payment_method: normMethod,
        paymentMethod: normMethod,
        amount_paid: paidAmt,
        amountPaid: paidAmt,
        remaining_amount: remainingAmt,
        payment_status: payStatus,
        created_at: new Date().toISOString(),
      };
      db.visits.unshift(newVisit);



      // Deduct customer advance if paid via Advance Wallet
      if (normMethod === 'Advance' && custObj) {
        const amt = Number(payload.total || payload.final_amount || 0);
        custObj.advance_balance = Math.max(0, (custObj.advance_balance || 0) - amt);
        db.advance_transactions.push({
          id: generateId('tx'),
          customer_id: custObj.id,
          customer_name: custObj.name,
          type: 'usage',
          amount: amt,
          balance_after: custObj.advance_balance,
          payment_method: 'Advance Wallet',
          notes: `Used for Visit ${newVisit.visit_number}`,
          created_at: new Date().toISOString(),
        });
      }

      // If associated with an appointment, mark appointment completed
      if (payload.appointmentId) {
        const apptIdx = db.appointments.findIndex((a) => String(a.id) === String(payload.appointmentId));
        if (apptIdx !== -1) {
          db.appointments[apptIdx].status = 'completed';
        }
      }

      saveDb(db);
      return { data: newVisit };
    }

    // Commissions
    if (cleanUrl === '/commissions') {
      const newComm = { id: generateId('cm'), status: 'unpaid', created_at: new Date().toISOString(), ...payload };
      db.commissions.push(newComm);
      saveDb(db);
      return { data: newComm };
    }

    // Salary Advance / Clear / Pay Remaining
    if (cleanUrl === '/salary/advance') {
      if (!db.salary_advances) db.salary_advances = [];
      const sId = payload.staffId || payload.staff_id;
      const adv = {
        id: generateId('sa'),
        staff_id: sId,
        staffId: sId,
        date: payload.paymentDate || new Date().toISOString().split('T')[0],
        amount: Number(payload.amount || 0),
        payment_mode: payload.paymentMode || 'cash',
        note: payload.note || '',
        created_at: new Date().toISOString(),
        ...payload,
      };
      db.salary_advances.push(adv);
      saveDb(db);
      return { data: { message: `Advance payment of ₹${adv.amount} recorded successfully`, advance: adv } };
    }

    if (cleanUrl === '/salary/clear-advance') {
      if (!db.salary_advances) db.salary_advances = [];
      const sId = payload.staffId || payload.staff_id;
      db.salary_advances = db.salary_advances.filter((a) => String(a.staff_id || a.staffId) !== String(sId));
      saveDb(db);
      return { data: { message: 'Advance cleared successfully' } };
    }

    if (cleanUrl === '/salary/pay-remaining') {
      if (!db.salary_payments) db.salary_payments = [];
      const sId = payload.staffId || payload.staff_id;
      const pm = {
        id: generateId('sp'),
        staff_id: sId,
        staffId: sId,
        date: payload.paymentDate || new Date().toISOString().split('T')[0],
        amount: Number(payload.amount || 0),
        payment_mode: payload.paymentMode || 'cash',
        note: payload.note || '',
        created_at: new Date().toISOString(),
        ...payload,
      };
      db.salary_payments.push(pm);
      saveDb(db);
      return { data: { message: 'Salary payment recorded successfully', payment: pm } };
    }

    // Expenses & Expense Categories
    if (cleanUrl === '/expenses') {
      const newExp = { id: generateId('ex'), date: new Date().toISOString().split('T')[0], ...payload };
      db.expenses.push(newExp);
      saveDb(db);
      return { data: newExp };
    }
    if (cleanUrl === '/expenses/categories') {
      const catName = payload.name || payload.category;
      if (!db.expense_categories) db.expense_categories = [];
      if (catName && !db.expense_categories.includes(catName)) {
        db.expense_categories.push(catName);
        saveDb(db);
      }
      return { data: { message: `Category "${catName}" added successfully`, name: catName, categories: db.expense_categories } };
    }

    // Settings
    if (cleanUrl === '/settings') {
      db.settings = { ...db.settings, ...payload };
      saveDb(db);
      return { data: db.settings };
    }

    // Dashboard Balance
    if (cleanUrl === '/dashboard/balance') {
      if (!db.daily_balances) db.daily_balances = {};
      const targetDate = payload.date || getLocalDateString();
      const rec = {
        opening_balance: Number(payload.openingBalance ?? 5000),
        closing_balance: Number(payload.closingBalance),
        notes: payload.notes || '',
        updated_at: new Date().toISOString(),
      };
      db.daily_balances[targetDate] = rec;
      db.daily_balance = rec;
      saveDb(db);
      return { data: { message: `Register balances updated for ${targetDate}`, record: rec } };
    }

    // WhatsApp Actions
    if (cleanUrl === '/whatsapp/send' || cleanUrl === '/whatsapp/broadcast') {
      const newLog = {
        id: generateId('log'),
        recipient_phone: payload.recipient_phone || '9876543210',
        customer_name: payload.customer_name || 'Client',
        message_type: payload.message_type || 'broadcast',
        template_name: payload.template_name || 'promotional',
        status: 'sent',
        created_at: new Date().toISOString(),
      };
      db.whatsapp.history.unshift(newLog);
      db.whatsapp.dashboard.total_sent += 1;
      saveDb(db);
      return { data: { success: true, message: 'Message sent successfully (mocked)' } };
    }

    if (cleanUrl === '/whatsapp/test-connection') {
      return { data: { success: true, message: 'WhatsApp API Connection Successful (Mock)' } };
    }

    return { data: { success: true } };
  },

  async put(url, payload = {}) {
    await delay();
    const db = getDb();
    const cleanUrl = url.split('?')[0];

    // Notifications Mark All Read
    if (cleanUrl === '/notifications/mark-all-read') {
      (db.notifications || []).forEach((n) => {
        n.is_read = true;
      });
      saveDb(db);
      return { data: { success: true } };
    }

    // Single Notification Read
    if (cleanUrl.startsWith('/notifications/') && cleanUrl.endsWith('/read')) {
      const id = cleanUrl.split('/')[2];
      const item = (db.notifications || []).find((n) => n.id === id);
      if (item) {
        item.is_read = true;
        saveDb(db);
      }
      return { data: { success: true } };
    }

    // Auth Profile & Password
    if (cleanUrl === '/auth/profile') {
      if (db.users[0]) {
        db.users[0] = { ...db.users[0], ...payload };
        saveDb(db);
      }
      return { data: db.users[0] };
    }
    if (cleanUrl === '/auth/password') {
      return { data: { message: 'Password updated successfully' } };
    }

    // Staff Edit
    if (cleanUrl.startsWith('/staff/')) {
      const id = cleanUrl.split('/')[2];
      const idx = db.staff.findIndex((s) => s.id === id);
      if (idx !== -1) {
        db.staff[idx] = { ...db.staff[idx], ...payload };
        saveDb(db);
        return { data: db.staff[idx] };
      }
    }

    // Customers Edit
    if (cleanUrl.startsWith('/customers/')) {
      const id = cleanUrl.split('/')[2];
      const idx = db.customers.findIndex((c) => c.id === id);
      if (idx !== -1) {
        db.customers[idx] = { ...db.customers[idx], ...payload };
        saveDb(db);
        return { data: db.customers[idx] };
      }
    }

    // Services Edit
    if (cleanUrl.startsWith('/services/')) {
      const id = cleanUrl.split('/')[2];
      const idx = db.services.findIndex((s) => s.id === id);
      if (idx !== -1) {
        db.services[idx] = { ...db.services[idx], ...payload };
        saveDb(db);
        return { data: db.services[idx] };
      }
    }

    // Products Edit
    if (cleanUrl.startsWith('/products/')) {
      const id = cleanUrl.split('/')[2];
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        db.products[idx] = { ...db.products[idx], ...payload };
        saveDb(db);
        return { data: db.products[idx] };
      }
    }

    // Appointments Edit
    if (cleanUrl.startsWith('/appointments/')) {
      const id = cleanUrl.split('/')[2];
      const idx = db.appointments.findIndex((a) => String(a.id) === String(id));
      if (idx !== -1) {
        db.appointments[idx] = { ...db.appointments[idx], ...payload };
        saveDb(db);
        return { data: db.appointments[idx] };
      }
      return { data: { id, status: payload.status || 'completed', ...payload } };
    }

    // Commissions Status Edit
    if (cleanUrl.includes('/commissions/')) {
      const id = cleanUrl.split('/')[2];
      const item = db.commissions.find((c) => c.id === id);
      if (item) {
        item.status = payload.status || item.status;
        saveDb(db);
        return { data: item };
      }
    }

    // Customer Visit Payment Settle / Clear
    if (cleanUrl.startsWith('/visits/') && cleanUrl.endsWith('/payment')) {
      const id = cleanUrl.split('/')[2];
      const idx = db.visits.findIndex((v) => String(v.id) === String(id));
      if (idx !== -1) {
        const v = db.visits[idx];
        const netTotal = Number(v.final_amount || v.total || v.total_amount || 0);
        const prevPaid = Number(v.amount_paid !== undefined ? v.amount_paid : (v.amountPaid !== undefined ? v.amountPaid : 0));
        const newPaidNow = Number(payload.amountPaid !== undefined ? payload.amountPaid : netTotal);
        const totalPaid = Math.min(netTotal, prevPaid + newPaidNow);
        const remaining = Math.max(0, netTotal - totalPaid);
        const normMethod = (payload.paymentMethod || v.payment_method || 'Cash').toString();

        db.visits[idx] = {
          ...v,
          payment_method: normMethod,
          paymentMethod: normMethod,
          amount_paid: totalPaid,
          amountPaid: totalPaid,
          remaining_amount: remaining,
          payment_status: remaining === 0 ? 'Paid' : 'Partial',
        };
        saveDb(db);
        return { data: db.visits[idx] };
      }
    }

    // WhatsApp Settings Edit
    if (cleanUrl === '/whatsapp/settings') {
      db.whatsapp.settings = { ...db.whatsapp.settings, ...payload };
      saveDb(db);
      return { data: db.whatsapp.settings };
    }

    return { data: { success: true } };
  },

  async delete(url) {
    await delay();
    const db = getDb();
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');

    if (cleanUrl.startsWith('/staff/')) {
      db.staff = db.staff.filter((s) => s.id !== parts[2]);
    } else if (cleanUrl.startsWith('/customers/')) {
      db.customers = db.customers.filter((c) => c.id !== parts[2]);
    } else if (cleanUrl.startsWith('/services/')) {
      db.services = db.services.filter((s) => s.id !== parts[2]);
    } else if (cleanUrl.startsWith('/products/')) {
      db.products = db.products.filter((p) => p.id !== parts[2]);
    } else if (cleanUrl.startsWith('/appointments/')) {
      db.appointments = db.appointments.filter((a) => a.id !== parts[2]);
    } else if (cleanUrl.startsWith('/visits/')) {
      db.visits = db.visits.filter((v) => v.id !== parts[2]);
    } else if (cleanUrl.startsWith('/commissions/')) {
      db.commissions = db.commissions.filter((c) => c.id !== parts[2]);
    } else if (cleanUrl.startsWith('/expenses/categories/')) {
      const catName = decodeURIComponent(parts[3]);
      db.expense_categories = db.expense_categories.filter((c) => c !== catName);
    } else if (cleanUrl.startsWith('/expenses/')) {
      db.expenses = db.expenses.filter((e) => e.id !== parts[2]);
    }

    saveDb(db);
    return { data: { success: true } };
  },
};

export default client;
