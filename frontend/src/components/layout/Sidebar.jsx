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
          className="fixed inset-0 z-30 bg-[#1A1A1A]/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Luxury Editorial Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 p-4 transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full glass-card flex flex-col justify-between p-5 overflow-hidden shadow-luxury border border-[#1A1A1A]/15 bg-[#F9F8F6]">
          {/* Header & Branding */}
          <div>
            <div className="flex items-center gap-3.5 px-2 py-2 border-b border-[#1A1A1A]/15 pb-4">
              <div className="h-11 w-11 bg-[#1A1A1A] p-1 border border-[#D4AF37] shrink-0 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="TRIO"
                  className="h-full w-full object-contain filter invert brightness-200"
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-lg font-bold tracking-tight text-[#1A1A1A] leading-none uppercase">
                  TRIO THE POSH
                </h1>
                <p className="text-[9px] font-sans font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mt-1">
                  Luxury Unisex Salon
                </p>
              </div>
            </div>

            {/* Nav List */}
            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] pt-4 pr-1">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3.5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${
                        isActive
                          ? 'bg-[#1A1A1A] text-[#D4AF37] border-l-2 border-[#D4AF37] shadow-sm'
                          : 'text-[#1A1A1A]/70 hover:bg-[#EBE5DE] hover:text-[#1A1A1A]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`flex h-7 w-7 items-center justify-center transition-all duration-300 ${
                            isActive
                              ? 'text-[#D4AF37]'
                              : 'text-[#1A1A1A]/60 group-hover:text-[#1A1A1A]'
                          }`}
                        >
                          <Icon size={16} />
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
          <div className="pt-4 border-t border-[#1A1A1A]/15">
            <div className="flex items-center justify-between p-3 bg-[#1A1A1A] text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#D4AF37] font-display text-sm font-bold text-[#1A1A1A]">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white uppercase tracking-wider">{user?.name || 'Admin User'}</p>
                  <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]">{user?.role || 'Administrator'}</p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Logout"
                className="p-1.5 text-white/60 hover:text-[#D4AF37] transition-colors"
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
