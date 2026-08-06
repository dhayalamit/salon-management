# Salon Management System — Production Deployment Guide

This guide details step-by-step instructions to deploy the **Salon Management System** using:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Node.js + Express)
- **Database**: Supabase (PostgreSQL)
- **CI/CD**: Automatic deployments on git push to `main` branch

---

## 🏗️ Production Architecture

```
                       ┌─────────────────────────┐
                       │     Users / Clients     │
                       └────────────┬────────────┘
                                    │
                                  HTTPS
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Vercel (React + Vite)  │
                      │  https://<app>.vercel.app │
                      └─────────────┬─────────────┘
                                    │
                              VITE_API_URL
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Railway (Express API)  │
                      │  https://<api>.railway.app│
                      └─────────────┬─────────────┘
                                    │
                               DATABASE_URL
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Supabase PostgreSQL    │
                      └───────────────────────────┘
```

---

## 1. Database Setup (Supabase PostgreSQL)

1. **Create Project**: Log into [Supabase Console](https://supabase.com/dashboard) and create a new project.
2. **Get Connection String**:
   - Go to **Project Settings** → **Database** → **Connection String**.
   - Select **URI** or **Pooled Connection String** (Transaction mode, port `6543` or direct `5432`).
   - Copy the string:
     ```
     postgresql://postgres.[REF]:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres
     ```
3. **Automated Schema Initialization**:
   - The backend automatically initializes all tables and creates the default admin user (`admin@salon.com` / `admin123`) on startup when connected to Supabase.
   - Alternatively, you can copy the contents of `backend/schema.sql` into the Supabase **SQL Editor** and run it manually if desired.

---

## 2. Backend Deployment (Railway)

1. **Create Railway Project**:
   - Log into [Railway Console](https://railway.app/dashboard).
   - Click **New Project** → **Deploy from GitHub repo**.
   - Select your repository: `salon-management-system`.

2. **Configure Root Directory**:
   - Go to **Settings** → **General** → **Root Directory**.
   - Set Root Directory to `backend` (or leave root with the included `railway.json`).

3. **Set Environment Variables**:
   Go to **Variables** tab in Railway and add:

   | Variable | Example Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres` | Supabase Postgres URI |
   | `JWT_SECRET` | `salon_prod_secret_key_89237482937498237498237` | JWT Auth Secret |
   | `JWT_EXPIRES_IN` | `8h` | Token expiration |
   | `NODE_ENV` | `production` | Node environment |
   | `CORS_ORIGIN` | `https://my-salon-app.vercel.app` | Allowed frontend origin |

4. **Health Check & Auto-Deploy**:
   - Railway will detect `railway.json` and `Procfile`, start `node backend/src/index.js`, and perform health checks at `/health`.
   - Copy your Railway public domain URL (e.g. `https://salon-backend-production.up.railway.app`).

---

## 3. Frontend Deployment (Vercel)

1. **Create Vercel Project**:
   - Log into [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New...** → **Project**.
   - Import your GitHub repository: `salon-management-system`.

2. **Configure Framework & Root Directory**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Set Environment Variables**:
   Under **Environment Variables** section:

   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://salon-backend-production.up.railway.app` |

4. **Deploy**:
   - Click **Deploy**. Vercel will build the frontend and generate your production URL (e.g. `https://my-salon-app.vercel.app`).
   - If your Vercel URL is different, update `CORS_ORIGIN` in Railway variables to match your exact Vercel URL.

---

## 4. GitHub Auto-Deployment Verification

1. Go to Railway dashboard → **Settings** → **Triggers** → Ensure automatic deploys are enabled for branch `main`.
2. Go to Vercel dashboard → **Settings** → **Git** → Ensure automatic deploys are enabled for branch `main`.
3. Any push to `main` branch will automatically build and deploy both Frontend (Vercel) and Backend (Railway).

---

## 5. Production Checklist

- [x] Zero hardcoded `localhost` references in backend API & frontend client.
- [x] Backend port dynamically bound to `process.env.PORT`.
- [x] Database uses `DATABASE_URL` with SSL enabled for Supabase.
- [x] Startup connection verification and `/health` health check endpoint configured.
- [x] Axios API client normalizes `VITE_API_URL`.
- [x] Vercel `vercel.json` SPA rewrite rules enabled.
- [x] Default admin user initialized (`admin@salon.com` / `admin123`).
