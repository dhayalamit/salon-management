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
  ],
  authorized_users: [
    { id: 'auth_owner', email: 'admin@salon.com', name: 'TRIO Salon Owner', role: 'owner', added_at: new Date().toISOString() },
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
  staff: [],
  customers: [],
  advance_transactions: [],
  appointments: [],
  notifications: [],
  visits: [],
  attendance: [],
  commissions: [],
  salary_advances: [],
  salary_payments: [],
  expenses: [],
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

  // Ensure all collections are defined
  if (!db.users) db.users = [];
  if (!db.authorized_users || db.authorized_users.length === 0) {
    db.authorized_users = [
      { id: 'auth_owner', email: 'admin@salon.com', name: 'TRIO Salon Owner', role: 'owner', added_at: new Date().toISOString() },
      { id: 'auth_admin2', email: 'amitdhayal6138@gmail.com', name: 'Amit Dhayal', role: 'admin', added_at: new Date().toISOString() },
    ];
  }
  if (!db.services) db.services = [];
  if (!db.products) db.products = [];
  if (!db.staff) db.staff = [];
  if (!db.customers) db.customers = [];
  if (!db.visits) db.visits = [];
  if (!db.appointments) db.appointments = [];
  if (!db.attendance) db.attendance = [];
  if (!db.commissions) db.commissions = [];
  if (!db.salary_advances) db.salary_advances = [];
  if (!db.salary_payments) db.salary_payments = [];
  if (!db.expenses) db.expenses = [];
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
