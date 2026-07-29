import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Users,
  UserCog,
  ClipboardCheck,
  Scissors,
  Package,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Award,
  DollarSign,
  FileText,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/visits', label: 'Customer Visits', icon: CalendarCheck },
  { to: '/services', label: 'Services', icon: Scissors },
  { to: '/staff', label: 'Staff', icon: UserCog },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/salary', label: 'Staff Salary', icon: DollarSign },
  { to: '/commissions', label: 'Staff Commission', icon: Award },
  { to: '/staff-work', label: 'Staff Work Register', icon: FileText },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      {/* Backdrop (Active on all screen sizes when open) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer Sidebar Panel (Only visible when open is true) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 p-4 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full glass-card flex flex-col justify-between p-5 overflow-hidden shadow-luxury">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E8DFCF]">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="TRIO Logo"
                  className="h-10 w-10 object-contain rounded-xl bg-white p-1 border border-[#E8DFCF] shadow-xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-display font-bold text-dark tracking-tight text-base">TRIO</span>
                    <Sparkles size={12} className="text-[#D4AF37]" />
                  </div>
                  <span className="text-[10px] tracking-widest text-[#D4AF37] font-semibold uppercase block">
                    THE POSH
                  </span>
                </div>
              </div>

              {/* Close Drawer Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#F4F0E6] text-dark/60 hover:text-dark transition-colors"
                title="Close Sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav List */}
            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-230px)] pr-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#D4AF37] text-white shadow-md font-bold'
                          : 'text-dark/70 hover:bg-[#F4F0E6] hover:text-dark'
                      }`
                    }
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User profile & Logout */}
          <div className="pt-4 border-t border-[#E8DFCF]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-dark truncate">{user?.name || 'TRIO Admin'}</p>
                  <p className="text-[10px] text-dark/40 truncate">{user?.email || 'admin@salon.com'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 rounded-xl text-dark/50 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Sign Out"
        message="Are you sure you want to sign out of TRIO THE POSH Management System?"
        confirmText="Sign Out"
        type="danger"
      />
    </>
  );
}
