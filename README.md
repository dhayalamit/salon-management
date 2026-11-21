# 👑 TRIO THE POSH — Luxury Salon Management System

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Storage-Cloud%20Database-3B82F6?style=for-the-badge&logo=icloud&logoColor=white)](#)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy%20Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

An enterprise-grade, luxury salon and spa management platform designed for high-end unisex salons. Backed by a centralized **Cloud Database** for real-time synchronization across multiple devices (reception front-desk computers, salon owner smartphones, and staff workstations), featuring a luxury glassmorphism dark aesthetic, dual-tier role access (Salon Owner Command & Staff Workstation), 1-click live demo logins, multi-tenant workspace isolation for new salon owners, client billing, VIP permanent customer deposit wallets, WhatsApp automated notifications *(in progress)*, inventory, expenses, and financial analytics.

> [!NOTE]
> **Active Production Pilot & Working Demo Notice:**
> This web application is **currently in active daily use at TRIO The Posh Salon** (Piprali Road, Sikar) for managing live appointments, client checkout, and stylist work registers. Its underlying production data is **hosted on the Cloud** for multi-device real-time sync across reception and staff phones.
> This public deployment serves as an interactive **working demonstration prototype** with an integrated offline sandbox fallback. Because it is an actively evolving production testbed, you may encounter minor edge-case quirks or ongoing UI refinements. We welcome your feedback!

---

## ⚡ Instant Live Demo & Login Credentials

Anyone visiting the deployed app or evaluating the repository can log in instantly using the built-in **1-Click Quick Demo** buttons on the login screen, or with the credentials below:

| Portal | Email / ID | Password | Access Level & Scope |
| :--- | :--- | :--- | :--- |
| 👑 **Salon Owner** | `admin@salon.com` | `admin123` | **Full Executive Command:** Total Revenue, Daily Balances, Expenses, Reports, Staff Salaries & Settings |
| ✂️ **Staff Portal** | `staff@salon.com` | `staff123` | **Staff Workstation:** Daily Appointments, Customer Visits, Attendance, Clients & Work Register *(Financials & Reports strictly restricted)* |

> 💡 **Multi-Tenant Workspace & Demo Sandbox:**
> - Anyone can register a new salon using **Register Salon** on the login page. Each registered Salon Owner receives their own clean, isolated salon workspace (own salon name, own staff roster, own clients, and 0 initial transactions).
> - Staff accounts cannot self-register; they are created and authorized directly by the Salon Owner from within their portal.
> - Built-in 1-Click Demo accounts (`admin@salon.com` / `staff@salon.com`) provide pre-populated records for instant evaluation.

---

## 🛡️ Role-Based Access Control (RBAC)

The application enforces strict visual and route-level segregation between **Salon Owners** and **Staff Members**:

| Feature / Workspace | 👑 Salon Owner | ✂️ Staff Workstation |
| :--- | :---: | :---: |
| **Today's Appointments & Booking** | ✅ Full Access | ✅ Full Access |
| **Customer Visits & Checkout** | ✅ Full Access | ✅ Full Access |
| **Clients & VIP Permanent Wallets** | ✅ Full Access | ✅ Full Access |
| **Daily Attendance Register** | ✅ Full Access | ✅ Mark Attendance |
| **Staff Work Register** | ✅ Full Access | ✅ Log Work Entries |
| **Products & Inventory** | ✅ Full Access | ✅ View Stock |
| **WhatsApp Center & Automations** | 🚧 *In Progress (WIP)* | 🚧 *In Progress (WIP)* |
| **Today's Salon Revenue & Cash Inflow** | ✅ Visible | 🔒 **Restricted (Hidden)** |
| **Daily Multi-Method Register Balances** | ✅ Visible | 🔒 **Restricted (Hidden)** |
| **Monthly Revenue Trend Analytics Chart** | ✅ Visible | 🔒 **Restricted (Replaced by Appointments Schedule)** |
| **Salon Expenses Manager** | ✅ Full Access | 🔒 **Restricted (Hidden & Route Guarded)** |
| **Financial Reports & Audit** | ✅ Full Access | 🔒 **Restricted (Hidden & Route Guarded)** |
| **Staff Team Roster & Salaries** | ✅ Full Access | 🔒 **Restricted (Hidden & Route Guarded)** |
| **Branding & System Settings** | ✅ Full Access | 🔒 **Restricted (Hidden & Route Guarded)** |

---

## ✨ Key Features

### 👑 Executive Dashboard & Financial Command
- Real-time revenue tracking categorized by payment mode (**Cash**, **UPI / Online**, **Advance Wallet**).
- Automated daily cash register (opening balance, daily collection, cash expenses, closing balance).
- Visual charts for monthly revenue trends, top performing services, and stylist productivity.

### 📅 Appointments & Smart Booking
- Interactive appointment calendar with status filters (Scheduled, In-Progress, Completed, Cancelled).
- Automatic slot conflict detection and staff availability tracking.
- Pre-appointment automated WhatsApp notifications (24h reminder & 30m urgent reminder).

### 💳 Customer Visits & Instant Invoicing
- Fast checkout with multiple service and product line items.
- Line-item staff assignment for accurate commission calculation.
- Flexible payment methods: Cash, Card, UPI, Partial / Split, and VIP Advance Wallet.

### 💎 VIP Permanent Customers & Advance Deposit Wallets
- Dedicated permanent customer profiles with prepaid wallet deposits.
- Deposit history and automated balance deductions upon checkout.
- Detailed visit history, customer preferences, and total lifetime spend metrics.

### 👥 Staff Management, Work Register & Attendance
- Complete stylist roster with commission rates and base salary configurations.
- Daily digital attendance register (Present, Absent, Half-Day).
- Detailed **Staff Work Register** tracking daily service count and total work value generated by each staff member.
- Automated monthly salary calculation factoring in attendance, advances, and earned commissions.

### 💬 WhatsApp Marketing & Notification Center `(🚧 In Active Progress — Not Completed)`
> ⚠️ **Status:** The WhatsApp automation engine and Meta Cloud API integration are currently **under active development and not yet finalized**. While message template builders, scheduled trigger rules, and UI previews are functional, live background message dispatch is being finalized.
- Built-in WhatsApp automation workflow builder for customer lifecycle engagement.
- Automated trigger design: **Instant Booking Confirmations**, **Birthday Specials**, **24h & 30m Appointment Reminders**, and **Post-Visit Thank You / Review requests**.
- Template customizer with dynamic variables (`{{customer_name}}`, `{{service_name}}`, `{{appointment_time}}`, `{{amount}}`).

### 📦 Product Inventory & Low-Stock Alerts
- Product catalog tracking purchase price, selling price, and stock levels.
- Automated notification badges for low-stock and out-of-stock items.

### 💸 Salon Expense Tracking & Category Reports
- Categorized expense logging (Rent, Electricity, Supplies, Staff Tea/Snacks, Marketing).
- Cash vs. Bank expense segregation for accurate net profit computation.

---

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom luxury glassmorphism design system
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Database / Cloud Storage:** Centralized Cloud Database & Cloud Storage API with real-time multi-device sync & offline demo fallback
- **Routing:** [React Router DOM v6](https://reactrouter.com/)

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/dhayalamit/salon-management.git
cd salon-management
```

### 2. Install dependencies
```bash
npm install
```

### 3. (Optional) Set up Cloud Database credentials
Copy `.env.example` to `.env` and fill in your Cloud Database API credentials:
```bash
cp .env.example .env
```
*(If omitted, the app will automatically run using the pre-loaded offline demo sandbox!)*

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploy to Vercel (1-Click Deployment)

This repository includes a preconfigured `vercel.json` for SPA routing.

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import the `salon-management` repository.
4. *(Optional)* In **Environment Variables**, add your Cloud Database keys:
   - `VITE_API_URL`
   - `VITE_CLOUD_STORAGE_KEY`
5. Click **Deploy**. Your salon management system is live!

---

## 📄 License
This project is proprietary software developed for **TRIO THE POSH Salon**. All rights reserved.
