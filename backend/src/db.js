const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

let mode = 'sqlite'; // 'pg' or 'sqlite'
let pgPool = null;
let sqliteDb = null;

// Ensure local data folder exists for SQLite persistence
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'salon_data.db');

// Try connecting to Postgres first if DATABASE_URL is set
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql')) {
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
    mode = 'pg';
    console.log('[DB] Configured for PostgreSQL');
  } catch (err) {
    console.warn('[DB] PostgreSQL pool init failed, falling back to local SQLite:', err.message);
    mode = 'sqlite';
  }
}

if (mode === 'sqlite') {
  const sqlite3 = require('sqlite3').verbose();
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[DB] SQLite Connection error:', err.message);
    } else {
      console.log(`[DB] Connected to local persistent SQLite DB at ${dbPath}`);
    }
  });
}

function generateUUID() {
  return crypto.randomUUID();
}

function initSQLiteTables() {
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
        logo_url TEXT,
        address TEXT,
        phone TEXT,
        gst_number TEXT,
        default_gst_percent REAL DEFAULT 0
      )
    `);

    sqliteDb.run(`
      INSERT OR IGNORE INTO settings (id, salon_name, address, phone, gst_number, default_gst_percent)
      VALUES (1, 'TRIO THE POSH', '123 Luxury Avenue, Beverly Hills', '+1 800-POSH-SALON', 'GSTIN29AAACT1234F1Z5', 18)
    `);

    // Seed default admin if missing
    sqliteDb.get(`SELECT COUNT(*) as count FROM users`, [], (err, row) => {
      if (!err && row && row.count === 0) {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('admin123', 10);
        sqliteDb.run(
          `INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
          [generateUUID(), 'TRIO POSH Admin', 'admin@salon.com', hash, 'admin']
        );

        // Seed initial services
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

        // Seed initial products
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

        // Seed initial staff
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

initSQLiteTables();

// Polyfill query method for unified SQL execution across postgres / sqlite
async function query(sqlText, params = []) {
  if (mode === 'pg') {
    return await pgPool.query(sqlText, params);
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

    // Replace $1, $2 with ?
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

      // Ensure ID is passed if table has UUID primary key
      if (!params || params.length === 0 || text.includes('(name,')) {
        // Handled dynamically if needed
      }

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

// Transaction client mock for SQLite / PG compatibility
async function getClient() {
  if (mode === 'pg') {
    return await pgPool.connect();
  }
  return {
    query: (sql, params) => query(sql, params),
    release: () => {},
  };
}

module.exports = {
  query,
  pool: { connect: getClient },
  generateUUID,
  mode,
};
