import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { Settings as SettingsIcon, Store, Lock, Save, User, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

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
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      return showError('All password fields are required');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showError('New password and confirm password do not match');
    }

    try {
      setChangingPassword(true);
      const res = await client.post('/settings/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess(res.data.message || 'Password updated successfully! Please use your new password for future logins.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to change password. Check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F172A] flex items-center gap-2">
          <SettingsIcon size={24} className="text-[#0052FF]" /> Salon System Settings
        </h1>
        <p className="text-xs text-[#64748B]">Manage TRIO THE POSH branding, invoice headers, tax settings, and security</p>
      </div>

      {/* Section 1: Administrator Profile */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <User size={20} className="text-[#0052FF]" />
          <div>
            <h3 className="font-display text-lg font-bold text-[#0F172A]">Administrator Profile</h3>
            <p className="text-xs text-[#64748B]">View and update your administrator account details</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Email Address *</label>
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
              className="btn-accent px-6 py-2.5 rounded-full text-white font-semibold text-xs flex items-center gap-2 shadow-accent"
            >
              <Save size={16} /> {savingProfile ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Salon Information & Dynamic Invoice Branding */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-4">
          <div className="flex items-center gap-3">
            <Store size={20} className="text-[#D4AF37]" />
            <div>
              <h3 className="font-display text-lg font-bold text-dark">Salon Profile & Dynamic Invoice Header</h3>
              <p className="text-xs text-dark/50">Details automatically used across Billing, Invoices, Reports, and Dashboard</p>
            </div>
          </div>
        </div>

        {/* Live Invoice Header Preview */}
        <div className="p-5 rounded-2xl bg-white border border-[#E8DFCF] shadow-xs space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1">
            <FileText size={12} /> Live Invoice Header Preview
          </p>
          <div className="flex items-start gap-4 border-t border-[#E8DFCF] pt-3">
            <img
              src={settings.logo_url || '/logo.png'}
              alt="Salon Logo"
              className="h-14 w-14 object-contain rounded-xl bg-white p-1 border border-[#E8DFCF] shrink-0"
            />
            <div>
              <h4 className="font-display text-base font-bold text-dark">{settings.salon_name || 'TRIO THE POSH'}</h4>
              <p className="text-[11px] font-semibold text-[#D4AF37] italic">"{settings.tagline || 'Redefining Beauty & Elegance'}"</p>
              <p className="text-xs text-dark/60 mt-0.5">📍 {settings.address || 'Piprali Road, Near MBA Chai Wala, Sikar - 332001'}</p>
              <p className="text-xs text-dark/60">📞 {settings.phone || '+91 98765 43210'} | ✉ {settings.email || 'info@triotheposh.com'}</p>
              {settings.gst_number && <p className="text-xs font-bold text-dark/70">GSTIN: {settings.gst_number}</p>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Salon Name *</label>
              <input
                type="text"
                required
                value={settings.salon_name || ''}
                onChange={(e) => setSettings({ ...settings, salon_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Tagline / Motto</label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="Redefining Beauty & Elegance"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Business Phone</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Business Email</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Business Address</label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Logo URL / Image Path</label>
              <input
                type="text"
                value={settings.logo_url || '/logo.png'}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">GST Registration Number</label>
              <input
                type="text"
                value={settings.gst_number || ''}
                onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Default GST Tax Rate (%)</label>
              <input
                type="number"
                value={settings.default_gst_percent || 0}
                onChange={(e) => setSettings({ ...settings, default_gst_percent: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-accent px-6 py-2.5 rounded-full text-white font-semibold text-xs flex items-center gap-2 shadow-accent"
            >
              <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Salon Info'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Security & Change Password */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <Lock size={20} className="text-[#0052FF]" />
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Security & Change Password</h3>
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
    </div>
  );
}
