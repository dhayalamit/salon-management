import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { Settings as SettingsIcon, ShieldCheck, Store, Download, Upload, Lock, Save, Database, Sparkles, User, Image, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export default function Settings() {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || 'Salon Administrator',
    email: user?.email || 'admin@salon.com',
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await client.put('/settings/profile', profileData);
      showSuccess(res.data.message || 'Profile updated successfully');
      const stored = localStorage.getItem('salon_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('salon_user', JSON.stringify({ ...u, name: profileData.name, email: profileData.email }));
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await client.put('/settings', settings);
      showSuccess('Salon information updated successfully. All new invoices will automatically use these details!');
    } catch (err) {
      showError('Failed to update settings');
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
      showSuccess('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await client.get('/settings/backup');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `TRIO_POSH_Backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showSuccess('Full database backup exported');
    } catch (err) {
      showError('Failed to export backup data');
    }
  };

  const handleRestoreFile = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          await client.post('/settings/restore', { data: parsed.data || parsed });
          showSuccess('Database restored successfully from backup file');
        } catch (err) {
          showError('Invalid JSON backup file or restore failed');
        }
      };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-dark flex items-center gap-2">
          <SettingsIcon size={24} className="text-[#D4AF37]" /> Salon System Settings
        </h1>
        <p className="text-xs text-dark/50">Manage TRIO THE POSH branding, invoice headers, tax settings, and database backup</p>
      </div>

      {/* Section 0: Administrator Profile */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <User size={20} className="text-[#D4AF37]" />
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Administrator Profile</h3>
            <p className="text-xs text-dark/50">Manage your account name and email address</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Email Address</label>
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
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
            >
              <Save size={16} /> {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 1: Salon Information & Dynamic Invoice Branding */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-4">
          <div className="flex items-center gap-3">
            <Store size={20} className="text-[#D4AF37]" />
            <div>
              <h3 className="font-display text-lg font-bold text-dark">Salon Profile & Dynamic Invoice Header</h3>
              <p className="text-xs text-dark/50">Details automatically printed on all POS customer receipts and PDF invoices</p>
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
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Salon Name</label>
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
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
            >
              <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Salon Info'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Security & Change Password */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <Lock size={20} className="text-[#D4AF37]" />
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Security & Password</h3>
            <p className="text-xs text-dark/50">Update administrator access credentials</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-dark/70 mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCF] text-sm text-dark focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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

      {/* Section 3: Local Backup & Restore */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
          <Database size={20} className="text-[#D4AF37]" />
          <div>
            <h3 className="font-display text-lg font-bold text-dark">Data Backup & Local Persistence</h3>
            <p className="text-xs text-dark/50">Export your customer and sales database to JSON file or restore from a backup file</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#F4F0E6]/60 border border-[#E8DFCF] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-dark flex items-center gap-2">
                <Download size={16} className="text-[#D4AF37]" /> Export Backup File
              </h4>
              <p className="text-xs text-dark/50 mt-1">
                Download full copy of your customers, invoices, products, and attendance records as a JSON file.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="mt-4 w-full py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-sm"
            >
              Export JSON Backup
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[#F4F0E6]/60 border border-[#E8DFCF] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-dark flex items-center gap-2">
                <Upload size={16} className="text-[#D4AF37]" /> Restore Data File
              </h4>
              <p className="text-xs text-dark/50 mt-1">
                Select a previously exported JSON backup file to restore database tables safely.
              </p>
            </div>
            <label className="mt-4 w-full py-2.5 rounded-full bg-white border border-[#E8DFCF] text-dark font-semibold text-xs hover:bg-[#F4F0E6] transition-all text-center cursor-pointer block">
              Choose Backup File
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
