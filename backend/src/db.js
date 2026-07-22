const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

let pgPool = null;
let sqliteDb = null;
let mode = 'sqlite';

if (process.env.DATABASE_URL) {
  mode = 'pg';
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log('[DB] Connected to PostgreSQL Database');
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
        gender TEXT,
        birthday TEXT,
        notes TEXT,
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
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        staff_id TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        gst_percent REAL DEFAULT 0,
        gst_amount REAL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        payment_method TEXT,
        commission_amount REAL DEFAULT 0,
        next_appointment_date TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
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
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_date TEXT NOT NULL DEFAULT (date('now')),
        note TEXT
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

    ['tagline', 'email', 'business_hours'].forEach((col) => {
      sqliteDb.run(`ALTER TABLE settings ADD COLUMN ${col} TEXT`, () => {});
    });

    sqliteDb.run(`
      INSERT OR IGNORE INTO settings (id, salon_name, tagline, address, phone, email, gst_number, default_gst_percent)
      VALUES (1, 'TRIO THE POSH', 'Redefining Beauty & Elegance', '123 Luxury Avenue, Beverly Hills', '+1 800-POSH-SALON', 'info@triotheposh.com', 'GSTIN29AAACT1234F1Z5', 18)
    `);

    sqliteDb.get(`SELECT COUNT(*) as count FROM users`, [], (err, row) => {
      if (!err && row && row.count === 0) {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('admin123', 10);
        sqliteDb.run(
          `INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
          [generateUUID(), 'TRIO POSH Admin', 'admin@salon.com', hash, 'admin']
        );

        const services = [
          ['Signature Haircut & Styling', 800, 45, 20],
          ['Luxury Facial & Clean', 1500, 60, 15],
          ['Hair Spa & Keratin Therapy', 2500, 90, 15],
          ['Royal Beard Grooming', 450, 30, 20],
          ['Premium Hair Color', 1800, 60, 10],
          ['Bridal Makeup Package', 8500, 180, 25],
        ];
        services.forEach(([name, price, dur, comm]) => {
          sqliteDb.run(
            `INSERT INTO services (id, name, price, duration_minutes, commission_percent) VALUES (?, ?, ?, ?, ?)`,
            [generateUUID(), name, price, dur, comm]
          );
        });

        const products = [
          ['Luxe Argan Oil Shampoo', 'Hair Care', 350, 750, 25],
          ['Keratin Repair Serum', 'Hair Care', 500, 1100, 15],
          ['Matte Styling Wax', 'Styling', 200, 450, 30],
          ['Hydrating Face Mask', 'Skin Care', 180, 400, 20],
          ['Organic Beard Elixir', 'Grooming', 250, 550, 10],
        ];
        products.forEach(([name, cat, buy, sell, stock]) => {
          sqliteDb.run(
            `INSERT INTO products (id, name, category, purchase_price, selling_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)`,
            [generateUUID(), name, cat, buy, sell, stock]
          );
        });

        const staff = [
          ['Vikram Malhotra', '9876543210', 35000, 15],
          ['Sanya Kapoor', '9876543211', 30000, 15],
          ['Arjun Nair', '9876543212', 28000, 12],
        ];
        staff.forEach(([name, phone, salary, comm]) => {
          sqliteDb.run(
            `INSERT INTO staff (id, name, phone, salary, commission_percent) VALUES (?, ?, ?, ?, ?)`,
            [generateUUID(), name, phone, salary, comm]
          );
        });

        console.log('[DB] Seeded initial data for SQLite');
      }
    });
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
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        staff_id TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        gst_percent REAL DEFAULT 0,
        gst_amount REAL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        payment_method TEXT,
        commission_amount REAL DEFAULT 0,
        next_appointment_date TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
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
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_date TEXT NOT NULL DEFAULT CURRENT_DATE,
        note TEXT
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

    // Ensure active column is BOOLEAN type for Postgres if previously created as INTEGER
    await pgPool.query(`ALTER TABLE services ALTER COLUMN active SET DATA TYPE BOOLEAN USING (active::boolean)`).catch(() => {});
    await pgPool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_appointment_date TEXT`).catch(() => {});

    const userRes = await pgPool.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userRes.rows[0]?.count || 0, 10) === 0) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('admin123', 10);
      await pgPool.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
        [generateUUID(), 'TRIO POSH Admin', 'admin@salon.com', hash, 'admin']
      );

      const services = [
        ['Signature Haircut & Styling', 800, 45, 20],
        ['Luxury Facial & Clean', 1500, 60, 15],
        ['Hair Spa & Keratin Therapy', 2500, 90, 15],
        ['Royal Beard Grooming', 450, 30, 20],
        ['Premium Hair Color', 1800, 60, 10],
        ['Bridal Makeup Package', 8500, 180, 25],
      ];
      for (const [name, price, dur, comm] of services) {
        await pgPool.query(
          `INSERT INTO services (id, name, price, duration_minutes, commission_percent, active) VALUES ($1, $2, $3, $4, $5, true)`,
          [generateUUID(), name, price, dur, comm]
        );
      }

      const products = [
        ['Luxe Argan Oil Shampoo', 'Hair Care', 350, 750, 25],
        ['Keratin Repair Serum', 'Hair Care', 500, 1100, 15],
        ['Matte Styling Wax', 'Styling', 200, 450, 30],
        ['Hydrating Face Mask', 'Skin Care', 180, 400, 20],
        ['Organic Beard Elixir', 'Grooming', 250, 550, 10],
      ];
      for (const [name, cat, buy, sell, stock] of products) {
        await pgPool.query(
          `INSERT INTO products (id, name, category, purchase_price, selling_price, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6)`,
          [generateUUID(), name, cat, buy, sell, stock]
        );
      }

      const staffList = [
        ['Vikram Malhotra', '9876543210', 35000, 15],
        ['Sanya Kapoor', '9876543211', 30000, 15],
        ['Arjun Nair', '9876543212', 28000, 12],
      ];
      for (const [name, phone, salary, comm] of staffList) {
        await pgPool.query(
          `INSERT INTO staff (id, name, phone, salary, commission_percent) VALUES ($1, $2, $3, $4, $5)`,
          [generateUUID(), name, phone, salary, comm]
        );
      }

      const customersList = [
        ['Ananya Sharma', '9123456789', 'female', 'VIP Client'],
        ['Rohan Mehta', '9123456790', 'male', 'Regular Client'],
        ['Priya Patel', '9123456791', 'female', 'New Client'],
      ];
      for (const [name, phone, gender, notes] of customersList) {
        await pgPool.query(
          `INSERT INTO customers (id, name, phone, gender, notes) VALUES ($1, $2, $3, $4, $5)`,
          [generateUUID(), name, phone, gender, notes]
        );
      }

      console.log('[DB] Seeded initial data for PostgreSQL');
    }
    console.log('[DB] PostgreSQL tables initialized successfully');
  } catch (err) {
    console.error('[DB] PostgreSQL init error:', err.message);
  }
}

initSQLiteTables();
initPGTables();

// Polyfill query method for unified SQL execution across postgres / sqlite
async function query(sqlText, params = []) {
  if (mode === 'pg') {
    let text = sqlText
      .replace(/CURRENT_DATE/gi, "to_char(CURRENT_DATE, 'YYYY-MM-DD')")
      .replace(/active = true/gi, "(active::text IN ('true', '1') OR active IS NULL)")
      .replace(/active = false/gi, "(active::text IN ('false', '0'))")
      .replace(/substr\(created_at, 1, 10\)/gi, "to_char(created_at, 'YYYY-MM-DD')")
      .replace(/substr\(appointment_date, 1, 10\)/gi, "to_char(appointment_date::date, 'YYYY-MM-DD')")
      .replace(/substr\(date, 1, 10\)/gi, "date");
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
};
