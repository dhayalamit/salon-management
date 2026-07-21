# TRIO THE POSH — Deployment & Production Guide

This application is ready for production deployment. The backend automatically serves the pre-built frontend SPA bundle on a single unified web server, supporting both **PostgreSQL** cloud databases and **persistent SQLite** storage.

---

## 🚀 Option 1: Render.com (Recommended — Quickest Setup)

### Step 1: Push Code to GitHub / GitLab
Create a new GitHub repository and push your project:
```bash
git init
git add .
git commit -m "Production release ready"
git remote add origin https://github.com/<your-username>/salon-management-system.git
git branch -M main
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Log in to **[Render.com](https://render.com)**.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `salon-management-system`.
4. Configure service parameters:
   - **Name**: `trio-salon-pos`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build --prefix frontend && npm install --prefix backend`
   - **Start Command**: `npm start`
5. **Environment Variables**:
   - `PORT`: `5001` (or leave default assigned by Render)
   - `JWT_SECRET`: `<generate-a-strong-random-secret-key>`
   - `NODE_ENV`: `production`
   - `DATABASE_URL` (Optional): `<your-postgresql-connection-string>`
6. Click **Create Web Service**. Render will automatically build the frontend, start the backend, and deploy your live URL (e.g. `https://trio-salon-pos.onrender.com`).

---

## 🚄 Option 2: Railway.app Deployment

1. Log in to **[Railway.app](https://railway.app)**.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `salon-management-system`.
4. Add a PostgreSQL Database inside Railway (optional for PostgreSQL).
5. Set Environment Variables:
   - `JWT_SECRET`: `<random-secret>`
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
6. Deploy! Railway will automatically detect the build and start commands from `package.json`.

---

## 🌐 Option 3: Separate Frontend (Vercel / Netlify) + Backend (Render / Railway)

If you prefer hosting the React frontend on **Vercel** and Node backend on **Render**:

### Backend Deployment (Render / Railway)
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment Variables:
  - `CORS_ORIGIN`: `https://your-frontend.vercel.app`
  - `JWT_SECRET`: `<your-secret>`

### Frontend Deployment (Vercel)
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment Variables:
  - `VITE_API_URL`: `https://your-backend.onrender.com/api`

---

## 🖥️ Option 4: Self-Hosted VPS Deployment (Ubuntu / NGINX / PM2)

### Step 1: Install Node.js, PM2 & NGINX
```bash
sudo apt update && sudo apt install -y nodejs npm nginx
sudo npm install -g pm2
```

### Step 2: Clone and Build Application
```bash
git clone https://github.com/<your-username>/salon-management-system.git /var/www/salon
cd /var/www/salon
npm install
npm run build
```

### Step 3: Seed Admin Account & Start PM2
```bash
npm run seed
pm2 start backend/src/index.js --name "salon-pos"
pm2 save
pm2 startup
```

### Step 4: Configure NGINX Reverse Proxy
Create `/etc/nginx/sites-available/salon`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable site & reload NGINX:
```bash
sudo ln -s /etc/nginx/sites-available/salon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 Default Admin Credentials

- **Email**: `admin@salon.com`
- **Password**: `admin123`
