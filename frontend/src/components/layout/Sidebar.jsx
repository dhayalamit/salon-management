import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
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
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/services', label: 'Services', icon: Scissors },
  { to: '/staff', label: 'Staff', icon: UserCog },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/salary', label: 'Staff Salary', icon: DollarSign },
  { to: '/commissions', label: 'Staff Commission', icon: Award },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-dark/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Glass Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 p-4 transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full glass-card flex flex-col justify-between p-5 overflow-hidden shadow-luxury">
          {/* Header & Branding */}
          <div>
            <div className="flex items-center gap-3.5 px-2 py-2">
              <img
                src="/logo.png"
                alt="TRIO"
                className="h-11 w-11 rounded-2xl object-contain bg-white shadow-md p-1 border border-[#E8DFCF]"
              />
              <div className="min-w-0">
                <h1 className="font-display text-lg font-bold tracking-tight text-dark leading-none">
                  TRIO THE POSH
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mt-1">
                  Luxury Unisex Salon
                </p>
              </div>
            </div>

            <div className="my-5 h-px bg-gradient-to-r from-[#E8DFCF] via-[#D4AF37]/30 to-transparent" />

            {/* Nav List */}
            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-[#D4AF37] text-white font-semibold shadow-md shadow-[#D4AF37]/20'
                          : 'text-dark/70 hover:bg-[#F4F0E6] hover:text-dark'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#F4F0E6] text-dark/60 group-hover:bg-white group-hover:text-dark'
                          }`}
                        >
                          <Icon size={18} />
                        </span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User Profile Card Footer */}
          <div className="pt-4 border-t border-[#E8DFCF]">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F4F0E6]/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] font-display text-sm font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-dark">{user?.name || 'Admin User'}</p>
                  <p className="text-[10px] capitalize text-dark/50">{user?.role || 'Administrator'}</p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Logout"
                className="p-2 text-dark/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="⚠️ Confirm Logout"
        message="Are you sure you want to log out of your salon management system session?"
        confirmText="Log Out"
        variant="warning"
      />
    </>
  );
}
