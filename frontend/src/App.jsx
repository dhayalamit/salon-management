import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Staff from './pages/Staff.jsx';
import StaffProfile from './pages/StaffProfile.jsx';
import Attendance from './pages/Attendance.jsx';
import Customers from './pages/Customers.jsx';
import CustomerProfile from './pages/CustomerProfile.jsx';
import PermanentCustomers from './pages/PermanentCustomers.jsx';
import PermanentCustomerProfile from './pages/PermanentCustomerProfile.jsx';
import Services from './pages/Services.jsx';
import Products from './pages/Products.jsx';
import Appointments from './pages/Appointments.jsx';
import CustomerVisits from './pages/CustomerVisits.jsx';
import VisitDetailsView from './pages/VisitDetailsView.jsx';
import Expenses from './pages/Expenses.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import StaffSalary from './pages/StaffSalary.jsx';
import StaffCommissions from './pages/StaffCommissions.jsx';
import StaffWorkRegister from './pages/StaffWorkRegister.jsx';
import WhatsAppCenter from './pages/whatsapp/WhatsAppCenter.jsx';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/whatsapp-center" element={<WhatsAppCenter />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/staff/:id" element={<StaffProfile />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/salary" element={<StaffSalary />} />
        <Route path="/commissions" element={<StaffCommissions />} />
        <Route path="/staff-work" element={<StaffWorkRegister />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerProfile />} />
        <Route path="/permanent-customers" element={<PermanentCustomers />} />
        <Route path="/permanent-customers/:id" element={<PermanentCustomerProfile />} />
        <Route path="/services" element={<Services />} />
        <Route path="/products" element={<Products />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/visits" element={<CustomerVisits />} />
        <Route path="/visits/:id" element={<VisitDetailsView />} />
        <Route path="/billing" element={<Navigate to="/visits" replace />} />
        <Route path="/billing/:id" element={<Navigate to="/visits" replace />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
