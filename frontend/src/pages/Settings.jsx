import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { Settings as SettingsIcon, Store, Lock, Save, User, FileText, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import Modal from '../components/ui/Modal.jsx';

export default function Settings() {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [settings, setSettings] = useState({
    salon_name: 'TRIO THE POSH',
    tagline: 'Redefining Beauty & Elegance',
    address: 'Piprali Road, Near MBA Chai Wala, Sikar - 332001',
    phone: '+91 98765 43210',
    email: 'info@triotheposh.com',
    gst_number: 'GSTIN08AAACT1234F1Z5',
    default_gst_percent: 0,
    logo_url: '/logo.png',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await client.get('/settings');
      if (res.data) setSettings(res.data);
    } catch (err) {
      showError('Failed to load salon settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await client.get('/auth/me');
      if (res.data) {
        setProfileData({
          name: res.data.name || '',
          email: res.data.email || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile details', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileData.name || !profileData.email) {
      return showError('Name and Email address are required');
    }

    try {
      setSavingProfile(true);
      const res = await client.put('/settings/profile', profileData);
      showSuccess(res.data.message || 'Administrator profile updated successfully');
      const stored = localStorage.getItem('salon_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('salon_user', JSON.stringify({ ...u, name: profileData.name, email: profileData.email }));
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update administrator profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await client.put('/settings', settings);
      showSuccess('Salon information saved successfully and updated across all modules!');
    } catch (err) {
      showError('Failed to save salon information');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showError('New passwords do not match');
    }

    try {
      setChangingPassword(true);
      await client.post('/settings/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResetAllData = async () => {
    try {
      setResettingData(true);
      await client.post('/settings/reset-data');
      showSuccess('All salon data, invoices, appointments & balances reset to 0 successfully!');
      setIsResetModalOpen(false);
      window.dispatchEvent(new CustomEvent('dashboard_updated'));
      window.dispatchEvent(new CustomEvent('billing_updated'));
      window.dispatchEvent(new CustomEvent('customers_updated'));
      window.dispatchEvent(new CustomEvent('products_updated'));
      window.dispatchEvent(new CustomEvent('attendance_updated'));
      window.dispatchEvent(new CustomEvent('appointment_updated'));
    } catch (err) {
      showError('Failed to reset system data');
    } finally {
      setResettingData(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 glass-card p-6 border border-[#E8DFCF]">
        <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">Salon & System Settings</h1>
          <p className="text-xs text-dark/50 mt-0.5">Manage salon branding, profile details, passwords & system data</p>
        </div>
      </div>

      {/* 1. Salon Branding & Information */}
      <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <Store size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Salon Branding & General Details</h3>
            <p className="text-xs text-dark/50">Details printed on tax invoices and receipts</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Salon Name *</label>
              <input
                type="text"
                required
                value={settings.salon_name}
                onChange={(e) => setSettings({ ...settings, salon_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Tagline / Motto</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="e.g. Redefining Beauty & Elegance"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Contact Phone Number</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Official Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Salon Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">GST Registration Number</label>
              <input
                type="text"
                value={settings.gst_number}
                onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })}
                placeholder="GSTIN..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Default GST Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.default_gst_percent}
                onChange={(e) => setSettings({ ...settings, default_gst_percent: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
            >
              <Save size={14} /> {savingSettings ? 'Saving...' : 'Save Salon Information'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Administrator Profile */}
      <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <User size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Administrator Profile</h3>
            <p className="text-xs text-dark/50">Manage account name and email address</p>
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
              className="px-6 py-2.5 rounded-full bg-dark text-white font-semibold text-xs hover:bg-dark/80 transition-all shadow-md flex items-center gap-2"
            >
              <Save size={14} /> {savingProfile ? 'Saving...' : 'Update Administrator Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Password Security */}
      <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Security & Password</h3>
            <p className="text-xs text-dark/50">Update your administrator password for future logins</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Current Password *</label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Enter current password"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">New Password *</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
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

      {/* 4. Complete System Reset Section */}
      <div className="glass-card p-6 border border-red-200 bg-red-50/30 space-y-4">
        <div className="flex items-center gap-3 border-b border-red-200 pb-3">
          <div className="p-2 rounded-xl bg-red-100 text-red-600">
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-red-900">Reset All Salon System Data</h3>
            <p className="text-xs text-red-700">Clear all transactions, invoices, appointments, customers & register balances to start fresh</p>
          </div>
        </div>

        <p className="text-xs text-dark/70">
          Clicking this will delete all created test invoices, appointments, customers, attendance records, and register balances. Master catalog services, products, staff, and admin accounts will remain intact.
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-all shadow-md flex items-center gap-2"
          >
            <Trash2 size={16} /> Reset All Data to 0
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(null)} title="Confirm Complete Data Reset">
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle size={24} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900 text-sm">Are you sure you want to reset all data?</h4>
              <p className="text-red-700 text-xs mt-1">
                This action will delete all invoices, appointments, customer records, attendance history, and register balances. All Dashboard stat cards will reset to ₹0!
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold hover:bg-[#F4F0E6]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resettingData}
              onClick={handleResetAllData}
              className="px-5 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center gap-1.5 shadow-md"
            >
              <Trash2 size={15} /> {resettingData ? 'Resetting Data...' : 'Yes, Reset All Data'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
