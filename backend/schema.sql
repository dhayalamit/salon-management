-- ============================================================
-- Salon Management System — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- USERS (Admin / Staff login) ----------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  staff_id UUID, -- linked staff profile, if role = staff
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- STAFF ----------
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  photo_url TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  salary NUMERIC(10,2) DEFAULT 0,
  commission_percent NUMERIC(5,2) DEFAULT 0,
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ADD CONSTRAINT fk_users_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;

-- ---------- ATTENDANCE ----------
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
  note TEXT,
  UNIQUE (staff_id, date)
);

-- ---------- CUSTOMERS ----------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  alternate_phone VARCHAR(20),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  birthday DATE,
  notes TEXT,
  is_permanent BOOLEAN DEFAULT false,
  advance_balance NUMERIC(10,2) DEFAULT 0,
  total_advance_deposited NUMERIC(10,2) DEFAULT 0,
  total_advance_used NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- ADVANCE TRANSACTIONS ----------
CREATE TABLE IF NOT EXISTS advance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES customer_visits(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'deduction', 'refund', 'adjustment')),
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(30),
  notes TEXT,
  performed_by VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- SERVICES ----------
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  duration_minutes INT DEFAULT 30,
  commission_percent NUMERIC(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80),
  purchase_price NUMERIC(10,2) DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5
);

-- ---------- APPOINTMENTS ----------
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- CUSTOMER VISITS ----------
CREATE TABLE IF NOT EXISTS customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst_percent NUMERIC(5,2) DEFAULT 0,
  gst_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  remaining_amount NUMERIC(10,2) DEFAULT 0,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'upi', 'card', 'pending')),
  payment_status VARCHAR(20) DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Partial', 'Pending')),
  notes TEXT,
  commission_amount NUMERIC(10,2) DEFAULT 0,
  next_appointment_date DATE,
  cleared_at TIMESTAMPTZ,
  created_by VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- VISIT ITEMS ----------
CREATE TABLE IF NOT EXISTS visit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES customer_visits(id) ON DELETE CASCADE,
  item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('service', 'product')),
  service_id UUID REFERENCES services(id),
  product_id UUID REFERENCES products(id),
  staff_id UUID REFERENCES staff(id),
  name VARCHAR(120) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_percent NUMERIC(5,2) DEFAULT 0,
  commission_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL
);

-- ---------- SALARY PAYMENTS ----------
CREATE TABLE IF NOT EXISTS salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL,
  payment_mode VARCHAR(10) CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
  month_covered VARCHAR(7), -- e.g. '2026-07'
  note TEXT
);

-- ---------- STAFF WORK ENTRIES ----------
CREATE TABLE IF NOT EXISTS staff_work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES customer_visits(id) ON DELETE CASCADE,
  visit_item_id UUID REFERENCES visit_items(id) ON DELETE CASCADE,
  customer_name VARCHAR(120),
  service_name VARCHAR(160),
  description TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'Paid',
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- EXPENSES ----------
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(60) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT
);

-- ---------- SALON SETTINGS (single row) ----------
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  salon_name VARCHAR(160) DEFAULT 'My Salon',
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(20),
  gst_number VARCHAR(30),
  default_gst_percent NUMERIC(5,2) DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO settings (id, salon_name) VALUES (1, 'My Salon') ON CONFLICT (id) DO NOTHING;

-- ---------- Helpful indexes ----------
CREATE INDEX IF NOT EXISTS idx_customer_visits_created_at ON customer_visits (created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
