const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const bcrypt = require('bcryptjs');

let pgPool = null;
let sqliteDb = null;
let mode = 'sqlite';

if (process.env.DATABASE_URL) {
  mode = 'pg';
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });
  console.log('[DB] PostgreSQL Pool configured.');
} else {
  mode = 'sqlite';
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'salon_data.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[DB] SQLite connection error:', err);
    } else {
      console.log('[DB] Connected to local SQLite database:', dbPath);
    }
  });
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function initSQLiteTables() {
  if (mode !== 'sqlite') return;

  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        staff_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        photo_url TEXT,
        joining_date TEXT DEFAULT (date('now')),
        salary REAL DEFAULT 0,
        commission_percent REAL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        note TEXT,
        UNIQUE (staff_id, date)
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        alternate_phone TEXT,
        gender TEXT,
        birthday TEXT,
        notes TEXT,
        is_permanent INTEGER DEFAULT 0,
        advance_balance REAL DEFAULT 0,
        total_advance_deposited REAL DEFAULT 0,
        total_advance_used REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS advance_transactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        visit_id TEXT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        payment_method TEXT,
        notes TEXT,
        performed_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        commission_percent REAL DEFAULT 0,
        active INTEGER DEFAULT 1
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        purchase_price REAL DEFAULT 0,
        selling_price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS product_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        invoice_id TEXT,
        invoice_number TEXT,
        type TEXT NOT NULL DEFAULT 'sale',
        quantity INTEGER NOT NULL,
        stock_before INTEGER NOT NULL,
        stock_after INTEGER NOT NULL,
        sold_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        staff_id TEXT,
        service_id TEXT,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'booked',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS customer_visits (
        id TEXT PRIMARY KEY,
        visit_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        appointment_id TEXT,
        staff_id TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        gst_percent REAL DEFAULT 0,
        gst_amount REAL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        amount_paid REAL DEFAULT 0,
        remaining_amount REAL DEFAULT 0,
        payment_method TEXT,
        payment_status TEXT NOT NULL DEFAULT 'Paid',
        notes TEXT,
        commission_amount REAL DEFAULT 0,
        advance_used REAL DEFAULT 0,
        next_appointment_date TEXT,
        cleared_at TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS visit_items (
        id TEXT PRIMARY KEY,
        visit_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        service_id TEXT,
        product_id TEXT,
        staff_id TEXT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0,
        commission_percent REAL DEFAULT 0,
        commission_amount REAL DEFAULT 0,
        line_total REAL NOT NULL
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS salary_payments (
        id TEXT PRIMARY KEY,
        payroll_id TEXT,
        staff_id TEXT NOT NULL,
        payment_date TEXT NOT NULL DEFAULT (date('now')),
        amount REAL NOT NULL,
        payment_mode TEXT,
        payment_type TEXT DEFAULT 'salary',
        month_covered TEXT,
        note TEXT
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS staff_payrolls (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        year_month TEXT NOT NULL,
        monthly_salary REAL NOT NULL DEFAULT 0,
        advance_paid REAL NOT NULL DEFAULT 0,
        salary_paid REAL NOT NULL DEFAULT 0,
        remaining_salary REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(staff_id, year_month)
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS staff_commissions (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        customer_id TEXT,
        service_name TEXT,
        commission_type TEXT NOT NULL DEFAULT 'percent',
        commission_rate REAL DEFAULT 0,
        base_amount REAL DEFAULT 0,
        commission_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Pending',
        payment_date TEXT,
        paid_by TEXT,
        date TEXT NOT NULL DEFAULT (date('now')),
        remarks TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_date TEXT NOT NULL DEFAULT (date('now')),
        payment_method TEXT DEFAULT 'cash',
        note TEXT
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS custom_expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS deleted_expense_categories (
        name TEXT PRIMARY KEY,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS staff_work_entries (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        visit_id TEXT,
        visit_item_id TEXT,
        customer_name TEXT,
        service_name TEXT,
        description TEXT,
        amount REAL NOT NULL,
        commission_amount REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'Paid',
        notes TEXT,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS daily_balances (
        id TEXT PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        opening_balance REAL DEFAULT 0,
        closing_balance REAL DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        salon_name TEXT DEFAULT 'TRIO THE POSH',
        tagline TEXT DEFAULT 'Redefining Beauty & Elegance',
        logo_url TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        gst_number TEXT,
        default_gst_percent REAL DEFAULT 0,
        business_hours TEXT
      )
    `);

    ['title', 'payment_method'].forEach((col) => {
      sqliteDb.run(`ALTER TABLE expenses ADD COLUMN ${col} TEXT`, () => {});
    });

    ['amount_paid', 'remaining_amount', 'payment_status', 'notes', 'created_by'].forEach((col) => {
      sqliteDb.run(`ALTER TABLE customer_visits ADD COLUMN ${col} TEXT`, () => {});
    });

    ['cleared_at'].forEach((col) => {
      sqliteDb.run(`ALTER TABLE customer_visits ADD COLUMN ${col} TEXT`, () => {});
    });

    sqliteDb.run(`
      INSERT OR IGNORE INTO settings (id, salon_name, tagline, address, phone, email, gst_number, default_gst_percent)
      VALUES (1, 'TRIO THE POSH', 'Redefining Beauty & Elegance', '123 Luxury Avenue, Beverly Hills', '+1 800-POSH-SALON', 'info@triotheposh.com', 'GSTIN29AAACT1234F1Z5', 18)
    `);
  });
}

async function initPGTables() {
  if (mode !== 'pg') return;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        staff_id TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        photo_url TEXT,
        joining_date DATE DEFAULT CURRENT_DATE,
        salary REAL DEFAULT 0,
        commission_percent REAL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        note TEXT,
        UNIQUE (staff_id, date)
      );
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        gender TEXT,
        birthday TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        commission_percent REAL DEFAULT 0,
        active BOOLEAN DEFAULT true
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        purchase_price REAL DEFAULT 0,
        selling_price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5
      );
      CREATE TABLE IF NOT EXISTS product_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        invoice_id TEXT,
        invoice_number TEXT,
        type TEXT NOT NULL DEFAULT 'sale',
        quantity INTEGER NOT NULL,
        stock_before INTEGER NOT NULL,
        stock_after INTEGER NOT NULL,
        sold_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        staff_id TEXT,
        service_id TEXT,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'booked',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS customer_visits (
        id TEXT PRIMARY KEY,
        visit_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        appointment_id TEXT,
        staff_id TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        gst_percent REAL DEFAULT 0,
        gst_amount REAL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        amount_paid REAL DEFAULT 0,
        remaining_amount REAL DEFAULT 0,
        payment_method TEXT,
        payment_status TEXT NOT NULL DEFAULT 'Paid',
        notes TEXT,
        commission_amount REAL DEFAULT 0,
        next_appointment_date TEXT,
        cleared_at TIMESTAMPTZ,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS visit_items (
        id TEXT PRIMARY KEY,
        visit_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        service_id TEXT,
        product_id TEXT,
        staff_id TEXT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0,
        commission_percent REAL DEFAULT 0,
        commission_amount REAL DEFAULT 0,
        line_total REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS salary_payments (
        id TEXT PRIMARY KEY,
        payroll_id TEXT,
        staff_id TEXT NOT NULL,
        payment_date TEXT NOT NULL DEFAULT CURRENT_DATE,
        amount REAL NOT NULL,
        payment_mode TEXT,
        payment_type TEXT DEFAULT 'salary',
        month_covered TEXT,
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS staff_payrolls (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        year_month TEXT NOT NULL,
        monthly_salary REAL NOT NULL DEFAULT 0,
        advance_paid REAL NOT NULL DEFAULT 0,
        salary_paid REAL NOT NULL DEFAULT 0,
        remaining_salary REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(staff_id, year_month)
      );
      CREATE TABLE IF NOT EXISTS staff_commissions (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        customer_id TEXT,
        service_name TEXT,
        commission_type TEXT NOT NULL DEFAULT 'percent',
        commission_rate REAL DEFAULT 0,
        base_amount REAL DEFAULT 0,
        commission_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Pending',
        payment_date TEXT,
        paid_by TEXT,
        date TEXT NOT NULL DEFAULT CURRENT_DATE,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_date TEXT NOT NULL DEFAULT CURRENT_DATE,
        payment_method TEXT DEFAULT 'cash',
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS custom_expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS deleted_expense_categories (
        name TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS staff_work_entries (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        visit_id TEXT,
        visit_item_id TEXT,
        customer_name TEXT,
        service_name TEXT,
        description TEXT,
        amount REAL NOT NULL,
        commission_amount REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'Paid',
        notes TEXT,
        date TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE staff_work_entries ADD COLUMN IF NOT EXISTS visit_id TEXT;
      ALTER TABLE staff_work_entries ADD COLUMN IF NOT EXISTS visit_item_id TEXT;
      ALTER TABLE staff_work_entries ADD COLUMN IF NOT EXISTS customer_name TEXT;
      ALTER TABLE staff_work_entries ADD COLUMN IF NOT EXISTS service_name TEXT;
      ALTER TABLE staff_work_entries ADD COLUMN IF NOT EXISTS commission_amount REAL DEFAULT 0;
      ALTER TABLE staff_work_entries ADD COLUMN IF NOT EXISTS notes TEXT;

      ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_phone TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_permanent INTEGER DEFAULT 0;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS advance_balance REAL DEFAULT 0;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_advance_deposited REAL DEFAULT 0;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_advance_used REAL DEFAULT 0;

      ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS advance_used REAL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS advance_transactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        visit_id TEXT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        payment_method TEXT,
        notes TEXT,
        performed_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS daily_balances (
        id TEXT PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        opening_balance REAL DEFAULT 0,
        closing_balance REAL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        salon_name TEXT DEFAULT 'TRIO THE POSH',
        tagline TEXT DEFAULT 'Redefining Beauty & Elegance',
        logo_url TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        gst_number TEXT,
        default_gst_percent REAL DEFAULT 0,
        business_hours TEXT
      );
      INSERT INTO settings (id, salon_name, tagline, address, phone, email, gst_number, default_gst_percent)
      VALUES (1, 'TRIO THE POSH', 'Redefining Beauty & Elegance', '123 Luxury Avenue, Beverly Hills', '+1 800-POSH-SALON', 'info@triotheposh.com', 'GSTIN29AAACT1234F1Z5', 18)
      ON CONFLICT (id) DO NOTHING;
    `);

    await pgPool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS title TEXT`).catch(() => {});
    await pgPool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'`).catch(() => {});
    await pgPool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS amount_paid REAL DEFAULT 0`).catch(() => {});
    await pgPool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS remaining_amount REAL DEFAULT 0`).catch(() => {});
    await pgPool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid'`).catch(() => {});
    await pgPool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS notes TEXT`).catch(() => {});
    await pgPool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ`).catch(() => {});
    await pgPool.query(`ALTER TABLE services ALTER COLUMN active SET DATA TYPE BOOLEAN USING (active::boolean)`).catch(() => {});
    await pgPool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_appointment_date TEXT`).catch(() => {});

    // Seed default admin user if no users exist
    const userCountRes = await pgPool.query('SELECT COUNT(*) FROM users').catch(() => null);
    if (userCountRes && parseInt(userCountRes.rows[0].count, 10) === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const adminId = generateUUID();
      await pgPool.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1, 'Salon Admin', 'admin@salon.com', $2, 'admin')`,
        [adminId, passwordHash]
      );
      console.log('[DB] Default admin user created: admin@salon.com / admin123');
    }

    console.log('[DB] PostgreSQL tables initialized successfully');
  } catch (err) {
    console.error('[DB] PostgreSQL init error:', err.message);
  }
}

initSQLiteTables();

async function verifyConnection() {
  if (mode === 'pg') {
    try {
      const res = await pgPool.query('SELECT NOW()');
      console.log('[DB] PostgreSQL connected successfully at:', res.rows[0].now);
      await initPGTables();
      return true;
    } catch (err) {
      console.error('[DB ERROR] Failed to connect to PostgreSQL Database:', err.message);
      throw err;
    }
  } else {
    console.log('[DB] Operating in SQLite mode');
    return true;
  }
}

// Polyfill query method for unified SQL execution across postgres / sqlite
async function query(sqlText, params = []) {
  if (mode === 'pg') {
    let text = sqlText
      .replace(/CURRENT_DATE/gi, "to_char(CURRENT_DATE, 'YYYY-MM-DD')")
      .replace(/active = true/gi, "(active::text IN ('true', '1') OR active IS NULL)")
      .replace(/active = false/gi, "(active::text IN ('false', '0'))");
    return await pgPool.query(text, params);
  }

  return new Promise((resolve, reject) => {
    let text = sqlText
      .replace(/ILIKE/gi, 'LIKE')
      .replace(/TIMESTAMPTZ/gi, 'TEXT')
      .replace(/COALESCE\(SUM\((.*?)\),\s*0\)/gi, 'IFNULL(SUM($1), 0)')
      .replace(/json_agg\(.*?\)/gi, "''")
      .replace(/FOR UPDATE/gi, '')
      .replace(/::text/gi, '')
      .replace(/::date/gi, '')
      .replace(/::timestamp/gi, '')
      .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");

    let paramIndex = 1;
    text = text.replace(/\$(\d+)/g, () => '?');

    const isInsert = /^\s*INSERT/i.test(text);
    const isUpdate = /^\s*UPDATE/i.test(text);
    const isSelect = /^\s*SELECT/i.test(text);

    if (isSelect) {
      sqliteDb.all(text, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
      });
    } else if (isInsert) {
      let hasReturning = /RETURNING/i.test(text);
      let cleanedText = text.replace(/RETURNING\s+\*/i, '').replace(/RETURNING\s+\w+/i, '');

      sqliteDb.run(cleanedText, params, function (err) {
        if (err) return reject(err);
        if (hasReturning) {
          let tableName = text.match(/INTO\s+(\w+)/i)?.[1];
          if (params.length > 0 && typeof params[0] === 'string' && params[0].length > 20) {
            sqliteDb.get(`SELECT * FROM ${tableName} WHERE id = ?`, [params[0]], (sErr, row) => {
              resolve({ rows: [row || {}], rowCount: 1 });
            });
          } else {
            sqliteDb.get(`SELECT * FROM ${tableName} WHERE rowid = ?`, [this.lastID], (sErr, row) => {
              resolve({ rows: [row || {}], rowCount: 1 });
            });
          }
        } else {
          resolve({ rows: [], rowCount: this.changes });
        }
      });
    } else {
      let hasReturning = /RETURNING/i.test(text);
      let cleanedText = text.replace(/RETURNING\s+\*/i, '').replace(/RETURNING\s+\w+/i, '');
      sqliteDb.run(cleanedText, params, function (err) {
        if (err) return reject(err);
        if (hasReturning) {
          const targetTable = text.match(/UPDATE\s+(\w+)/i)?.[1];
          const lastParam = params[params.length - 1];
          if (targetTable && lastParam) {
            sqliteDb.get(`SELECT * FROM ${targetTable} WHERE id = ?`, [lastParam], (sErr, row) => {
              resolve({ rows: [row || {}], rowCount: this.changes });
            });
          } else {
            resolve({ rows: [], rowCount: this.changes });
          }
        } else {
          resolve({ rows: [], rowCount: this.changes });
        }
      });
    }
  });
}

module.exports = {
  query,
  generateUUID,
  verifyConnection,
};
