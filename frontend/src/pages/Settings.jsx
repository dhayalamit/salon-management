import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Settings as SettingsIcon, Save, Key, User, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { showSuccess, showError } = useToast();
  const { user, setUser } = useAuth();

  const [settings, setSettings] = useState({
    salon_name: 'TRIO THE POSH',
    tagline: 'Redefining Beauty & Elegance',
    logo_url: '',
    address: '123 Luxury Avenue, Beverly Hills',
    phone: '+1 800-POSH-SALON',
    email: 'info@triotheposh.com',
    gst_number: 'GSTIN29AAACT1234F1Z5',
    default_gst_percent: 18,
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

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
    fetchSettings();
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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await client.post('/settings', settings);
      showSuccess('Salon settings updated successfully');
      setSettings(res.data);
    } catch (err) {
      showError('Failed to update salon settings');
    } fontally: {
      setSavingSettings(false);
    }
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
      showError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-dark/50 italic">
        Loading salon configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-dark flex items-center gap-2">
          <SettingsIcon size={24} className="text-[#D4AF37]" /> System Settings
        </h1>
        <p className="text-xs text-dark/50">Configure salon branding, GST details, admin profile, and security</p>
      </div>

      {/* 1. Salon Branding & Information */}
      <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Salon Branding & Contact Info</h3>
            <p className="text-xs text-dark/50">Appears on printed POS invoices and headers</p>
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
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Primary Contact Phone</label>
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
    </div>
  );
}
