import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Settings as SettingsIcon, Save, Key, User, ShieldCheck, RotateCcw, Trash2, AlertTriangle, UserPlus, CheckCircle, Lock, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { getDb, saveDb } from '../services/mockStorage.js';

export default function Settings() {
  const { showSuccess, showError } = useToast();
  const { user, setUser, isOwner } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resettingData, setResettingData] = useState(false);

  // Authorized Users Access Control state
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [newAuthData, setNewAuthData] = useState({
    name: '',
    email: '',
    role: 'admin',
  });

  // User Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchAuthorizedUsers();
  }, []);

  const fetchAuthorizedUsers = () => {
    const db = getDb();
    setAuthorizedUsers(db.authorized_users || []);
  };

  const handleAddAuthorizedUser = (e) => {
    e.preventDefault();
    if (!isOwner) {
      return showError('Only the Salon Owner can add new authorized portal login emails.');
    }
    if (!newAuthData.email || !newAuthData.email.includes('@')) {
      return showError('Please enter a valid email address');
    }

    const db = getDb();
    db.authorized_users = db.authorized_users || [];
    const cleanEmail = newAuthData.email.trim().toLowerCase();

    const exists = db.authorized_users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return showError(`Email "${cleanEmail}" is already registered!`);
    }

    const newUser = {
      id: 'auth_' + Date.now(),
      name: newAuthData.name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: newAuthData.role || 'admin',
      added_at: new Date().toISOString(),
    };

    db.authorized_users.push(newUser);
    saveDb(db);
    setAuthorizedUsers([...db.authorized_users]);
    setNewAuthData({ name: '', email: '', role: 'admin' });
    showSuccess(`Authorized ${newUser.role.toUpperCase()} access granted to ${cleanEmail}`);
  };

  const handleRemoveAuthorizedUser = (id, email) => {
    if (!isOwner) {
      return showError('Only the Salon Owner can revoke authorized portal access.');
    }
    if (email.toLowerCase() === 'admin@salon.com') {
      return showError('Master Owner account cannot be removed!');
    }

    const db = getDb();
    db.authorized_users = (db.authorized_users || []).filter((u) => u.id !== id);
    saveDb(db);
    setAuthorizedUsers([...db.authorized_users]);
    showSuccess(`Revoked portal access for ${email}`);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await client.put('/auth/profile', profileData);
      showSuccess('Profile updated successfully');
      if (setUser) setUser(res.data);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showError('New passwords do not match');
    }
    if (passwordData.newPassword.length < 6) {
      return showError('Password must be at least 6 characters');
    }

    try {
      setChangingPassword(true);
      await client.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError('Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResetData = async () => {
    try {
      setResettingData(true);
      const res = await client.post('/settings/reset-data');
      showSuccess(res.data?.message || 'All counts & system transaction data have been reset to zero!');
      setShowResetConfirm(false);
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to reset system counts and data');
    } finally {
      setResettingData(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-dark flex items-center gap-2">
          <SettingsIcon size={24} className="text-[#D4AF37]" /> System Settings
        </h1>
        <p className="text-xs text-dark/50">Manage authorized users, portal security, profile credentials, and data resets</p>
      </div>

      {/* 1. AUTHORIZED PORTAL USERS & ACCESS CONTROL */}
      <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DFCF] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-dark">Authorized Portal Users & Access Control</h3>
              <p className="text-xs text-dark/50">Only registered Owner & Admin emails can log in via Google or Email/Password</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1.5 shrink-0">
            <Lock size={12} /> Access Protection Active
          </span>
        </div>

        {/* Security Warning Badge */}
        <div className="p-3.5 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF] text-xs text-dark/70 flex items-start gap-2.5">
          <CheckCircle size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-dark">Role-Based Protection:</strong> Unregistered emails are blocked from logging in. To allow a manager or staff member to sign in, add their email address below.
          </p>
        </div>

        {/* List of Registered Authorized Users */}
        <div className="space-y-3">
          <h4 className="font-bold text-dark text-xs uppercase tracking-wider">Registered Access Roster ({authorizedUsers.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {authorizedUsers.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-2xl bg-white border border-[#E8DFCF] flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-full font-bold flex items-center justify-center text-xs text-white shadow-xs ${
                      u.role === 'owner' ? 'bg-[#D4AF37]' : 'bg-blue-600'
                    }`}
                  >
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-dark text-xs">{u.name}</p>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'owner' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark/50">{u.email}</p>
                  </div>
                </div>

                {isOwner && u.email.toLowerCase() !== 'admin@salon.com' && (
                  <button
                    onClick={() => handleRemoveAuthorizedUser(u.id, u.email)}
                    className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    title="Revoke Access"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Authorized User Form (Owner Only) */}
        {isOwner ? (
          <form onSubmit={handleAddAuthorizedUser} className="p-4 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF] space-y-3">
            <h4 className="font-bold text-dark text-xs flex items-center gap-1.5">
              <UserPlus size={15} className="text-[#D4AF37]" /> Add New Authorized Admin / Staff Email
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-dark/70 mb-1">User Full Name</label>
                <input
                  type="text"
                  required
                  value={newAuthData.name}
                  onChange={(e) => setNewAuthData({ ...newAuthData, name: e.target.value })}
                  placeholder="e.g. Manager Name"
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-xs text-dark focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-dark/70 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newAuthData.email}
                  onChange={(e) => setNewAuthData({ ...newAuthData, email: e.target.value })}
                  placeholder="e.g. staff@gmail.com"
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-xs text-dark focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-dark/70 mb-1">Access Role</label>
                <select
                  value={newAuthData.role}
                  onChange={(e) => setNewAuthData({ ...newAuthData, role: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-xs text-dark focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="admin">Admin / Staff</option>
                  <option value="owner">Co-Owner</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold text-xs hover:bg-[#C59F2E] transition-all shadow-sm flex items-center gap-1.5"
              >
                <UserPlus size={14} /> Grant Portal Access
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs text-amber-900 flex items-center gap-2.5 font-medium">
            <Lock size={18} className="text-[#D4AF37] shrink-0" />
            <span>Owner Privilege Restricted: Only the Salon Owner can register new authorized portal login emails or revoke portal access.</span>
          </div>
        )}
      </div>

      {/* 2. Administrator Profile */}
      <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <User size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-dark">My Active Profile</h3>
            <p className="text-xs text-dark/50">Manage account display name and email address</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Administrator Name *</label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Account Email Address *</label>
              <input
                type="email"
                required
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all shadow-md"
            >
              {savingProfile ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Security & Password */}
      <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <Key size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Security & Password</h3>
            <p className="text-xs text-dark/50">Change your login password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Current Password *</label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">New Password *</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Confirm New Password *</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-6 py-2.5 rounded-full bg-dark text-white font-semibold text-xs hover:bg-dark/80 transition-all shadow-md"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Danger Zone — Reset All Counts & Data */}
      <div className="glass-card p-6 border border-red-200 bg-red-50/40 space-y-4">
        <div className="flex items-center gap-3 border-b border-red-200 pb-4">
          <div className="p-2 rounded-xl bg-red-100 text-red-700">
            <RotateCcw size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-red-900">Reset All System Counts & Data</h3>
            <p className="text-xs text-red-700/80">
              Clear all Customer Visits, Customers, Permanent Customers, Wallet Balances, Staff Work Register, Appointments, and Expenses to start with 0 counts.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="text-xs text-dark/70 space-y-1">
            <p className="font-semibold text-red-800 flex items-center gap-1">
              <AlertTriangle size={14} /> Warning: This action will zero out all counts and delete transaction records.
            </p>
            <p className="text-dark/50">Services menu, staff roster, products catalog, and login credentials will be preserved.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 shrink-0 self-end sm:self-auto"
          >
            <Trash2 size={15} /> Reset All Counts to Zero
          </button>
        </div>
      </div>

      {/* CONFIRM RESET MODAL */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetData}
        title="Reset All System Counts & Data?"
        message="Are you sure you want to clear all customer visits, customers, advance wallet balances, staff work entries, appointments, and revenue counts? All system counts will become ZERO. This action cannot be undone."
        confirmText={resettingData ? 'Resetting...' : 'Yes, Reset All to Zero'}
        danger
      />
    </div>
  );
}
