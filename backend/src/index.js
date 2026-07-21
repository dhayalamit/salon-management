require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const staffRoutes = require('./routes/staff');
const attendanceRoutes = require('./routes/attendance');
const customerRoutes = require('./routes/customers');
const serviceRoutes = require('./routes/services');
const productRoutes = require('./routes/products');
const appointmentRoutes = require('./routes/appointments');
const billingRoutes = require('./routes/billing');
const salaryRoutes = require('./routes/salary');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const commissionRoutes = require('./routes/commissions');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/commissions', commissionRoutes);

// Serve Frontend static production bundle if built
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
} else {
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
}

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Salon API running on http://localhost:${PORT}`));
