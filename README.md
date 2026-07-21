# TRIO The Posh — Salon Management System

A full-stack salon management system: dashboard, staff & attendance, customers,
services, appointments, billing with automatic commission calculation, product
inventory, expenses, and reports. Built with React + Tailwind on the frontend
and Node/Express + PostgreSQL on the backend, secured with JWT auth and
Admin/Staff roles.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts, Axios
- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt
- **Auth:** JWT bearer tokens, Admin and Staff roles

## Project structure

```
salon-management-system/
  backend/
    schema.sql          # full Postgres schema
    src/
      index.js          # Express app entry
      db.js              # pg connection pool
      seed.js            # creates admin login + sample data
      middleware/auth.js  # JWT auth + admin guard
      routes/            # auth, dashboard, staff, attendance, customers,
                          # services, products, appointments, billing,
                          # salary, expenses, reports, settings
  frontend/
    src/
      pages/             # one file per screen (Dashboard, Staff, Billing, ...)
      components/        # Sidebar, Topbar, Modal, StatCard, Badge
      context/AuthContext.jsx
      api/client.js       # axios instance with JWT interceptor
```

## 1. Prerequisites

- Node.js 18+
- A running PostgreSQL instance (local install, Docker, or a hosted service
  like Supabase/Neon/Railway)

## 2. Set up the database

Create a database and load the schema:

```bash
createdb salon_db
psql -d salon_db -f backend/schema.sql
```

(If you're on a hosted Postgres provider, just run the `schema.sql` contents
against your connection string using their SQL console or `psql "<connection-string>" -f backend/schema.sql`.)

## 3. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env — set DATABASE_URL to your Postgres connection string
# and set JWT_SECRET to a long random string

npm install
npm run seed     # creates admin@salon.com / admin123 + sample services/products/staff
npm run dev       # starts the API on http://localhost:5001
```

Health check: `curl http://localhost:5001/api/health`

## 4. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev       # starts the app on http://localhost:5173
```

Open `http://localhost:5173` and log in with:

```
Email:    admin@salon.com
Password: admin123
```

If your backend runs somewhere other than `http://localhost:5001/api`, create
`frontend/.env` with:

```
VITE_API_URL=https://your-api-host/api
```

## 5. How billing/commission works

When you create an invoice in **Billing → New Invoice**:

1. Add one or more services and/or products as line items.
2. Each **service** line item carries the service's commission % (editable on
   the Services page) — the backend computes `commission_amount` per item and
   sums it onto the invoice.
3. Each **product** line item automatically decrements that product's stock
   inside the same database transaction — if stock is insufficient, the whole
   invoice is rejected (nothing is double-booked).
4. The invoice, its line items, and the resulting commission are all stored,
   so Staff Profiles, the Commission report, and the Dashboard stay in sync
   automatically.

## 6. Roles

- **Admin** — full access: staff, services, products, salary, expenses,
  settings.
- **Staff** — can log attendance, manage customers/appointments/billing, but
  cannot add/edit/delete staff, services, products, salary entries, expenses,
  or settings (enforced both in the UI and on the backend with `requireAdmin`).

Create additional logins via `POST /api/auth/register` (admin-only endpoint) —
there's no self-registration screen by design, since salons control who gets
an account.

## 7. Backup & restore

```bash
# Backup
pg_dump salon_db > backup.sql

# Restore
psql salon_db < backup.sql
```

## 8. Reports

The Reports page covers daily/monthly sales, commission by staff, staff
performance, best-selling products, inventory status, and customer lifetime
spend — each exportable to CSV (opens directly in Excel) via the **Export
CSV** button, or to PDF via **Print / Save PDF** (browser print dialog).

## Notes / next steps

This is a complete, working core of the spec. A few areas are intentionally
left as extension points rather than fully built out, so you can adapt them
to how your salon actually operates:

- **Photo uploads** (staff/product images, salon logo) — the schema has
  `photo_url` / `logo_url` columns; wiring up actual file upload (e.g. to S3
  or local disk via `multer`, which is already a backend dependency) is a
  small follow-up.
- **Salary slips as PDF** — salary payments are fully tracked; a formatted
  PDF slip generator (e.g. with `pdfkit`) can be added on top.
- **Dark mode** — the design system uses CSS-variable-friendly Tailwind
  tokens, so a dark palette can be layered in without restructuring
  components.
