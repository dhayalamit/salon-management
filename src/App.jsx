import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';

import Login from './pages/Login.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090909] flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#D4AF37] tracking-widest uppercase">Authenticating Session...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function OwnerOnlyRoute({ children }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  if (!isOwner) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user && !loading ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/whatsapp-center" element={<WhatsAppCenter />} />
        <Route path="/staff" element={<OwnerOnlyRoute><Staff /></OwnerOnlyRoute>} />
        <Route path="/staff/:id" element={<OwnerOnlyRoute><StaffProfile /></OwnerOnlyRoute>} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/salary" element={<OwnerOnlyRoute><StaffSalary /></OwnerOnlyRoute>} />
        <Route path="/commissions" element={<OwnerOnlyRoute><StaffCommissions /></OwnerOnlyRoute>} />
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
        <Route path="/expenses" element={<OwnerOnlyRoute><Expenses /></OwnerOnlyRoute>} />
        <Route path="/reports" element={<OwnerOnlyRoute><Reports /></OwnerOnlyRoute>} />
        <Route path="/settings" element={<OwnerOnlyRoute><Settings /></OwnerOnlyRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
