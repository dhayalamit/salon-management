// src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client from '../api/client.js';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await client.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Auto-check for appointment & stock notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Custom event listeners for instant UI updates when appointments/products change
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('appointment_updated', handleUpdate);
    window.addEventListener('products_updated', handleUpdate);
    window.addEventListener('dashboard_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('appointment_updated', handleUpdate);
      window.removeEventListener('products_updated', handleUpdate);
      window.removeEventListener('dashboard_updated', handleUpdate);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      await client.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await client.put('/notifications/mark-all-read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
