// src/services/mockStorage.js

const STORAGE_KEY = 'salon_db_v2';

const defaultSeedData = {
  users: [
    {
      id: 'u1',
      name: 'TRIO Admin',
      email: 'admin@salon.com',
      password: 'admin123',
      role: 'owner',
    },
    {
      id: 'u2',
      name: 'Rahul Sharma',
      email: 'staff@salon.com',
      password: 'staff123',
      role: 'staff',
    },
  ],
  authorized_users: [
    { id: 'auth_owner', email: 'admin@salon.com', name: 'TRIO Salon Owner', role: 'owner', added_at: new Date().toISOString() },
    { id: 'auth_staff', email: 'staff@salon.com', name: 'Rahul Sharma (Senior Stylist)', role: 'staff', added_at: new Date().toISOString() },
    { id: 'auth_admin2', email: 'amitdhayal6138@gmail.com', name: 'Amit Dhayal', role: 'admin', added_at: new Date().toISOString() },
  ],
  services: [
    { id: 's1', name: 'Hair Cut', price: 300, duration_minutes: 30, commission_percent: 20 },
    { id: 's2', name: 'Beard Trim', price: 150, duration_minutes: 15, commission_percent: 20 },
    { id: 's3', name: 'Facial', price: 800, duration_minutes: 45, commission_percent: 15 },
    { id: 's4', name: 'Hair Spa', price: 900, duration_minutes: 60, commission_percent: 15 },
    { id: 's5', name: 'Hair Color', price: 1200, duration_minutes: 60, commission_percent: 10 },
    { id: 's6', name: 'Smoothening', price: 2500, duration_minutes: 120, commission_percent: 10 },
    { id: 's7', name: 'Keratin', price: 3000, duration_minutes: 150, commission_percent: 10 },
    { id: 's8', name: 'Cleanup', price: 500, duration_minutes: 30, commission_percent: 15 },
  ],
  products: [
    { id: 'p1', name: 'Shampoo', category: 'Hair Care', purchase_price: 150, selling_price: 300, stock_quantity: 15, low_stock_threshold: 5 },
    { id: 'p2', name: 'Hair Serum', category: 'Hair Care', purchase_price: 200, selling_price: 450, stock_quantity: 25, low_stock_threshold: 5 },
    { id: 'p3', name: 'Styling Wax', category: 'Styling', purchase_price: 100, selling_price: 250, stock_quantity: 20, low_stock_threshold: 5 },
    { id: 'p4', name: 'Hair Gel', category: 'Styling', purchase_price: 80, selling_price: 200, stock_quantity: 35, low_stock_threshold: 5 },
    { id: 'p5', name: 'Hair Color Tube', category: 'Color', purchase_price: 300, selling_price: 600, stock_quantity: 20, low_stock_threshold: 5 },
    { id: 'p6', name: 'Conditioner', category: 'Hair Care', purchase_price: 150, selling_price: 320, stock_quantity: 30, low_stock_threshold: 5 },
    { id: 'p7', name: 'Face Wash', category: 'Skin Care', purchase_price: 120, selling_price: 280, stock_quantity: 20, low_stock_threshold: 5 },
    { id: 'p8', name: 'Beard Oil', category: 'Grooming', purchase_price: 180, selling_price: 400, stock_quantity: 15, low_stock_threshold: 5 },
  ],
  staff: [
    {
      id: 'st_1',
      name: 'Rahul Sharma',
      phone: '9876543211',
      email: 'rahul@salon.com',
      role: 'Senior Stylist',
      base_salary: 28000,
      commission_percent: 15,
      joining_date: '2024-01-10',
      status: 'active',
      address: 'Piprali Road, Sikar',
    },
    {
      id: 'st_2',
      name: 'Priya Sen',
      phone: '9876543212',
      email: 'priya@salon.com',
      role: 'Makeup & Skin Expert',
      base_salary: 24000,
      commission_percent: 12,
      joining_date: '2024-02-01',
      status: 'active',
      address: 'Station Road, Sikar',
    },
    {
      id: 'st_3',
      name: 'Amit Verma',
      phone: '9876543213',
      email: 'amit@salon.com',
      role: 'Grooming & Beard Specialist',
      base_salary: 20000,
      commission_percent: 10,
      joining_date: '2024-03-15',
      status: 'active',
      address: 'Fatehpur Road, Sikar',
    },
    {
      id: 'st_4',
      name: 'Sneha Patel',
      phone: '9876543214',
      email: 'sneha@salon.com',
      role: 'Hair Color & Spa Artist',
      base_salary: 22000,
      commission_percent: 12,
      joining_date: '2024-04-01',
      status: 'active',
      address: 'Court Road, Sikar',
    },
  ],
  customers: [
    {
      id: 'c_1',
      name: 'Vikram Rathore',
      phone: '9829012345',
      email: 'vikram.rathore@gmail.com',
      gender: 'Male',
      dob: '1992-06-15',
      is_permanent: true,
      advance_balance: 4500,
      total_spent: 24800,
      total_visits: 14,
      notes: 'VIP Client — Prefers Keratin & Beard styling',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: 'c_2',
      name: 'Ananya Sharma',
      phone: '9829054321',
      email: 'ananya.sharma@gmail.com',
      gender: 'Female',
      dob: '1996-09-22',
      is_permanent: true,
      advance_balance: 2800,
      total_spent: 18200,
      total_visits: 9,
      notes: 'Prefers Organic Hair Spa & Facial treatments',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'c_3',
      name: 'Rajesh Choudhary',
      phone: '9829098765',
      email: 'rajesh.c@gmail.com',
      gender: 'Male',
      dob: '1988-12-05',
      is_permanent: false,
      advance_balance: 0,
      total_spent: 6500,
      total_visits: 6,
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: 'c_4',
      name: 'Pooja Meena',
      phone: '9829033344',
      email: 'pooja.meena@gmail.com',
      gender: 'Female',
      dob: '1998-03-18',
      is_permanent: false,
      advance_balance: 0,
      total_spent: 9400,
      total_visits: 4,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'c_5',
      name: 'Karan Singhania',
      phone: '9829077788',
      email: 'karan.s@gmail.com',
      gender: 'Male',
      dob: '1994-11-10',
      is_permanent: true,
      advance_balance: 1500,
      total_spent: 12600,
      total_visits: 8,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ],
  advance_transactions: [
    {
      id: 'adv_1',
      customer_id: 'c_1',
      customer_name: 'Vikram Rathore',
      type: 'deposit',
      amount: 5000,
      payment_source: 'UPI',
      notes: 'VIP wallet deposit',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 'adv_2',
      customer_id: 'c_2',
      customer_name: 'Ananya Sharma',
      type: 'deposit',
      amount: 3000,
      payment_source: 'UPI',
      notes: 'Advance wallet recharge',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  appointments: [
    {
      id: 'apt_1',
      customer_id: 'c_1',
      customer_name: 'Vikram Rathore',
      customer_phone: '9829012345',
      service_id: 's1',
      service_name: 'Hair Cut & Beard Trim',
      staff_id: 'st_1',
      staff_name: 'Rahul Sharma',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '11:00',
      status: 'scheduled',
      notes: 'VIP regular appointment',
      created_at: new Date().toISOString(),
    },
    {
      id: 'apt_2',
      customer_id: 'c_2',
      customer_name: 'Ananya Sharma',
      customer_phone: '9829054321',
      service_id: 's4',
      service_name: 'Hair Spa & Facial',
      staff_id: 'st_2',
      staff_name: 'Priya Sen',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '13:30',
      status: 'scheduled',
      notes: 'Special relaxation session',
      created_at: new Date().toISOString(),
    },
    {
      id: 'apt_3',
      customer_id: 'c_3',
      customer_name: 'Rajesh Choudhary',
      customer_phone: '9829098765',
      service_id: 's2',
      service_name: 'Beard Trim & Cleanup',
      staff_id: 'st_3',
      staff_name: 'Amit Verma',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '16:00',
      status: 'scheduled',
      notes: '',
      created_at: new Date().toISOString(),
    },
  ],
  notifications: [],
  visits: [
    {
      id: 'v_1',
      customer_id: 'c_1',
      customer_name: 'Vikram Rathore',
      customer_phone: '9829012345',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      staff_id: 'st_1',
      staff_name: 'Rahul Sharma',
      items: [
        { id: 's1', name: 'Hair Cut', price: 300, quantity: 1, staffId: 'st_1', staff_name: 'Rahul Sharma', commission_percent: 20 },
        { id: 's2', name: 'Beard Trim', price: 150, quantity: 1, staffId: 'st_1', staff_name: 'Rahul Sharma', commission_percent: 20 },
        { id: 'p2', name: 'Hair Serum', price: 450, quantity: 1, staffId: 'st_1', staff_name: 'Rahul Sharma' },
      ],
      subtotal: 900,
      discount: 0,
      tax: 0,
      total_amount: 900,
      final_amount: 900,
      payment_method: 'Cash',
      payment_status: 'paid',
      amount_paid: 900,
    },
    {
      id: 'v_2',
      customer_id: 'c_4',
      customer_name: 'Pooja Meena',
      customer_phone: '9829033344',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      staff_id: 'st_2',
      staff_name: 'Priya Sen',
      items: [
        { id: 's3', name: 'Facial', price: 800, quantity: 1, staffId: 'st_2', staff_name: 'Priya Sen', commission_percent: 15 },
        { id: 's8', name: 'Cleanup', price: 500, quantity: 1, staffId: 'st_2', staff_name: 'Priya Sen', commission_percent: 15 },
      ],
      subtotal: 1300,
      discount: 0,
      tax: 0,
      total_amount: 1300,
      final_amount: 1300,
      payment_method: 'UPI',
      payment_status: 'paid',
      amount_paid: 1300,
    },
  ],
  attendance: [
    { id: 'att_1', staff_id: 'st_1', staff_name: 'Rahul Sharma', date: new Date().toISOString().split('T')[0], status: 'present', check_in: '09:15' },
    { id: 'att_2', staff_id: 'st_2', staff_name: 'Priya Sen', date: new Date().toISOString().split('T')[0], status: 'present', check_in: '09:25' },
    { id: 'att_3', staff_id: 'st_3', staff_name: 'Amit Verma', date: new Date().toISOString().split('T')[0], status: 'present', check_in: '09:30' },
    { id: 'att_4', staff_id: 'st_4', staff_name: 'Sneha Patel', date: new Date().toISOString().split('T')[0], status: 'present', check_in: '09:40' },
  ],
  commissions: [],
  salary_advances: [],
  salary_payments: [],
  expenses: [
    {
      id: 'exp_1',
      title: 'Salon Electricity & Air Conditioning',
      amount: 1200,
      category: 'Electricity',
      payment_method: 'Cash',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      notes: 'Daily power consumption',
    },
    {
      id: 'exp_2',
      title: 'Staff Refreshments & Tea',
      amount: 250,
      category: 'Staff Tea/Snacks',
      payment_method: 'Cash',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      notes: 'Morning staff tea',
    },
  ],
  expense_categories: ['Electricity', 'Rent', 'Water Bill', 'Internet', 'Staff Tea/Snacks', 'Cleaning', 'Stationery', 'Miscellaneous', 'Product Supplies', 'Staff Advance', 'Other'],
  whatsapp: {
    dashboard: {
      total_sent: 0,
      delivered_rate: 100,
      failed_count: 0,
      scheduled_count: 0,
    },
    settings: {
      provider: 'meta',
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      senderPhone: '+91 98765 43210',
      webhookUrl: 'http://localhost:5173/api/whatsapp/webhook',
      webhookVerifyToken: 'trio_posh_verify_token_2026',
      isTestMode: false,
    },
    automations: [
      {
        id: 'rule_birthday',
        name: 'Birthday Wishes Automation',
        trigger: 'customer_birthday',
        type: 'birthday',
        trigger_label: 'Customer Birthday Today at 10:00 AM',
        template_id: 'tpl_birthday_1',
        template_name: 'Birthday Special Wish',
        send_time: '10:00',
        days_offset: 0,
        allow_once_per_year: true,
        is_enabled: true,
        last_run: null,
        next_run: 'Today at 10:00 AM',
      },
      {
        id: 'rule_reminder_24h',
        name: 'Appointment Reminder (24 Hours Before)',
        trigger: 'appointment_reminder',
        type: 'reminder_24h',
        trigger_label: '24 Hours Before Appointment',
        template_id: 'tpl_reminder_24h',
        template_name: '24h Appointment Reminder',
        lead_time_minutes: 1440,
        is_enabled: true,
        last_run: null,
        next_run: 'Auto Calculated',
      },
      {
        id: 'rule_reminder_30m',
        name: 'Appointment Reminder (30 Mins Before)',
        trigger: 'appointment_reminder',
        type: 'reminder_30m',
        trigger_label: '30 Minutes Before Appointment',
        template_id: 'tpl_reminder_30m',
        template_name: '30m Urgent Reminder',
        lead_time_minutes: 30,
        is_enabled: true,
        last_run: null,
        next_run: 'Auto Calculated',
      },
      {
        id: 'rule_confirmation',
        name: 'Instant Booking Confirmation',
        trigger: 'appointment_created',
        type: 'confirmation',
        trigger_label: 'When Appointment is Booked',
        template_id: 'tpl_booking_confirm',
        template_name: 'Booking Confirmation',
        is_enabled: true,
        last_run: null,
        next_run: 'On Event',
      },
      {
        id: 'rule_thankyou',
        name: 'Post-Visit Thank You & Feedback',
        trigger: 'visit_completed',
        type: 'thank_you',
        trigger_label: 'After Visit Completion',
        template_id: 'tpl_thank_you',
        template_name: 'Post-Visit Thank You',
        is_enabled: true,
        last_run: null,
        next_run: 'On Event',
      },
    ],
    templates: [
      {
        id: 'tpl_birthday_1',
        name: 'Birthday Special Wish',
        category: 'Birthday',
        language: 'en_US',
        status: 'Approved',
        body_text: 'Happy Birthday {{customer_name}}! 🎉\n\nWishing you a beautiful year ahead. Enjoy {{offer}} at {{salon_name}}.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tpl_reminder_24h',
        name: '24h Appointment Reminder',
        category: 'Appointment Reminder',
        language: 'en_US',
        status: 'Approved',
        body_text: 'Hi {{customer_name}},\n\nThis is a reminder for your appointment at {{salon_name}} tomorrow at {{appointment_time}} for {{service_name}}.\n\nAddress: {{salon_address}}\nPhone: {{salon_phone}}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tpl_reminder_30m',
        name: '30m Urgent Reminder',
        category: 'Appointment Reminder',
        language: 'en_US',
        status: 'Approved',
        body_text: 'Hi {{customer_name}},\n\nThis is a reminder for your appointment at {{salon_name}} at {{appointment_time}} for {{service_name}}.\n\nSee you soon!',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tpl_booking_confirm',
        name: 'Booking Confirmation',
        category: 'Appointment Confirmation',
        language: 'en_US',
        status: 'Approved',
        body_text: 'Hello {{customer_name}},\n\nYour appointment at {{salon_name}} has been confirmed for {{appointment_date}} at {{appointment_time}} with {{staff_name}}.\n\nThank you for choosing us!',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tpl_thank_you',
        name: 'Post-Visit Thank You',
        category: 'Thank You',
        language: 'en_US',
        status: 'Approved',
        body_text: 'Thank you {{customer_name}} for visiting {{salon_name}} today!\n\nYour bill amount was {{amount}}. We hope you loved your service! 🌟',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tpl_promotion',
        name: 'Exclusive Salon Offer',
        category: 'Offer',
        language: 'en_US',
        status: 'Approved',
        body_text: '🌟 Special Offer for {{customer_name}}!\n\nEnjoy {{offer}} on all hair and beauty services at {{salon_name}} this week.\n\nCall {{salon_phone}} to book your appointment!',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    history: [],
    sent_keys: {},
  },
  settings: {
    salon_name: 'TRIO THE POSH',
    phone: '+91 98765 43210',
    email: 'info@triotheposh.com',
    address: '123 Main Street, Sector 17, City',
    currency: '₹',
    tax_percent: 18,
    opening_time: '09:00',
    closing_time: '21:00',
  },
  daily_balance: {
    opening_balance: 0,
    closing_balance: 0,
    date: new Date().toISOString().split('T')[0],
  },
  daily_balances: {},
};

export function checkAndGenerateNotifications(db) {
  let changed = false;
  if (!db.notifications) {
    db.notifications = [];
    changed = true;
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Upcoming Appointments (within 30 mins)
  (db.appointments || []).forEach((appt) => {
    if (appt.appointment_date === todayStr && appt.status === 'scheduled') {
      const parts = (appt.appointment_time || '00:00').split(':').map(Number);
      const apptMinutes = parts[0] * 60 + (parts[1] || 0);
      const diff = apptMinutes - currentMinutes;

      if (diff >= -30 && diff <= 30) {
        const eventKey = `appointment_${appt.id}_${appt.appointment_time}`;
        const exists = db.notifications.some((n) => n.event_key === eventKey);
        if (!exists) {
          db.notifications.unshift({
            id: 'n_' + Math.random().toString(36).substr(2, 9),
            event_key: eventKey,
            title: `Upcoming Appointment: ${appt.customer_name || 'Client'}`,
            message: `${appt.service_name || 'Service'} with ${appt.staff_name || 'Stylist'} at ${appt.appointment_time} (${diff > 0 ? `in ${diff} mins` : 'due now'}).`,
            type: 'info',
            link: '/appointments',
            is_read: false,
            created_at: new Date().toISOString(),
          });
          changed = true;
        }
      }
    }
  });

  // 2. Low-Stock & Out-of-Stock Notifications
  (db.products || []).forEach((prod) => {
    const stock = Number(prod.stock_quantity || 0);
    const threshold = Number(prod.low_stock_threshold || 5);

    if (stock === 0) {
      const eventKey = `product_out_${prod.id}_${stock}`;
      const exists = db.notifications.some((n) => n.event_key === eventKey);
      if (!exists) {
        db.notifications.unshift({
          id: 'n_' + Math.random().toString(36).substr(2, 9),
          event_key: eventKey,
          title: `Out of Stock Alert: ${prod.name}`,
          message: `${prod.name} is completely out of stock (0 units remaining).`,
          type: 'danger',
          link: '/products',
          is_read: false,
          created_at: new Date().toISOString(),
        });
        changed = true;
      }
    } else if (stock <= threshold) {
      const eventKey = `product_low_${prod.id}_${stock}`;
      const exists = db.notifications.some((n) => n.event_key === eventKey);
      if (!exists) {
        db.notifications.unshift({
          id: 'n_' + Math.random().toString(36).substr(2, 9),
          event_key: eventKey,
          title: `Low Stock Alert: ${prod.name}`,
          message: `${prod.name} has only ${stock} units remaining (Low stock threshold: ${threshold}).`,
          type: 'warning',
          link: '/products',
          is_read: false,
          created_at: new Date().toISOString(),
        });
        changed = true;
      }
    }
  });

  if (changed) {
    saveDb(db);
  }
  return db.notifications;
}

// Initialize DB if empty
export function getDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let db;
  if (!raw) {
    db = defaultSeedData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } else {
    try {
      db = JSON.parse(raw);
    } catch (e) {
      db = defaultSeedData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
  }

  // Ensure all collections are defined and seeded
  if (!db.users || db.users.length === 0) db.users = [...defaultSeedData.users];
  if (!db.authorized_users || db.authorized_users.length === 0) {
    db.authorized_users = [...defaultSeedData.authorized_users];
  }
  if (!db.services || db.services.length === 0) db.services = [...defaultSeedData.services];
  if (!db.products || db.products.length === 0) db.products = [...defaultSeedData.products];
  if (!db.staff || db.staff.length === 0) db.staff = [...defaultSeedData.staff];
  if (!db.customers || db.customers.length === 0) db.customers = [...defaultSeedData.customers];
  if (!db.advance_transactions || db.advance_transactions.length === 0) db.advance_transactions = [...defaultSeedData.advance_transactions];
  if (!db.visits || db.visits.length === 0) db.visits = [...defaultSeedData.visits];
  if (!db.appointments || db.appointments.length === 0) db.appointments = [...defaultSeedData.appointments];
  if (!db.attendance || db.attendance.length === 0) db.attendance = [...defaultSeedData.attendance];
  if (!db.commissions) db.commissions = [];
  if (!db.salary_advances) db.salary_advances = [];
  if (!db.salary_payments) db.salary_payments = [];
  if (!db.expenses || db.expenses.length === 0) db.expenses = [...defaultSeedData.expenses];
  if (!db.expense_categories) db.expense_categories = ['Rent', 'Utilities', 'Inventory', 'Salary', 'Marketing', 'Maintenance'];

  checkAndGenerateNotifications(db);
  return db;
}

export function saveDb(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetDb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeedData));
  const db = defaultSeedData;
  checkAndGenerateNotifications(db);
  return db;
}
