import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, CheckCheck, AlertTriangle, Info, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [greeting, setGreeting] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const notifRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    setIsNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header className="px-4 py-3 sm:px-8 sm:py-5 flex items-center justify-between gap-4 relative z-30 border-b border-[#E8DFCF]/50 bg-[#F8F5EF]">
      {/* Left Row: Greeting & Menu Button */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 sm:p-2.5 rounded-2xl glass-card text-dark hover:bg-white transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          title="Open Drawer Menu"
        >
          <Menu size={18} />
          <img src="/logo.png" alt="TRIO Logo" className="h-6 w-6 sm:h-7 sm:w-7 object-contain" />
        </button>

        <div className="min-w-0">
          <h2 className="font-display text-lg sm:text-2xl font-bold tracking-tight text-dark truncate">
            {greeting}, <span className="gold-text-gradient">{user?.name ? user.name.split(' ')[0] : 'Owner'}</span>
          </h2>
          <p className="text-[10px] sm:text-xs font-medium text-dark/50 truncate">{formattedDate}</p>
        </div>
      </div>

      {/* Right Tools: Notification Bell Button & Sign Out */}
      <div className="flex items-center gap-2">
        <div ref={notifRef} className="relative shrink-0">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2.5 sm:p-2.5 rounded-full bg-white border border-[#E8DFCF] text-dark hover:border-[#D4AF37] transition-all relative shadow-xs flex items-center justify-center cursor-pointer"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

        {/* Notification Dropdown Modal */}
        {isNotifOpen && (
          <div className="absolute right-0 top-12 w-[85vw] max-w-sm sm:w-96 glass-modal p-3.5 sm:p-4 shadow-2xl space-y-3 text-xs z-50 rounded-2xl border border-[#E8DFCF]">
            <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-2">
              <div className="flex items-center gap-1.5">
                <Bell size={14} className="text-[#D4AF37]" />
                <span className="font-bold text-dark uppercase tracking-wider text-[11px]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-[#D4AF37] hover:underline flex items-center gap-0.5"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="py-6 text-center text-dark/40 italic">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors border flex gap-2.5 items-start ${
                      !n.is_read
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-white/80 border-[#E8DFCF] hover:bg-[#F4F0E6]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'danger' && <AlertCircle size={15} className="text-red-500" />}
                      {n.type === 'warning' && <AlertTriangle size={15} className="text-amber-500" />}
                      {n.type === 'info' && <Info size={15} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`font-semibold text-xs truncate ${!n.is_read ? 'text-dark font-bold' : 'text-dark/70'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-dark/60 mt-0.5">{n.message}</p>
                      <span className="text-[9px] text-dark/40 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Sign Out Button */}
      <button
        onClick={logout}
        className="p-2 sm:px-3 sm:py-2 rounded-full bg-white border border-[#E8DFCF] text-dark/70 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-xs font-semibold shrink-0"
        title="Sign Out"
      >
        <LogOut size={15} />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  </header>
);
}