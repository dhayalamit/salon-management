import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
  Settings as SettingsIcon,
  Key,
  ShieldCheck,
  CheckCircle,
  Save,
  Link,
  Zap,
  Globe,
  Copy,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

export default function WhatsAppSettings() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    whatsapp_token: '',
    phone_number_id: '',
    business_account_id: '',
    google_review_link: 'https://g.page/r/triotheposh/review',
    auto_send_enabled: true,
    daily_birthday_time: '09:00',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await client.get('/whatsapp/settings');
      if (res.data) {
        setFormData({
          whatsapp_token: res.data.whatsapp_token || '',
          phone_number_id: res.data.phone_number_id || '',
          business_account_id: res.data.business_account_id || '',
          google_review_link: res.data.google_review_link || 'https://g.page/r/triotheposh/review',
          auto_send_enabled: Boolean(res.data.auto_send_enabled),
          daily_birthday_time: res.data.daily_birthday_time || '09:00',
        });
      }
    } catch (err) {
      showError('Failed to load WhatsApp settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await client.put('/whatsapp/settings', formData);
      showSuccess('WhatsApp Meta Cloud API credentials saved successfully!');
      fetchSettings();
    } catch (err) {
      showError('Failed to save WhatsApp credentials');
    } finally {
      setSaving(false);
    }
  };

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Webhook URL copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md">
            <Key size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-emerald-700 text-white">
                Official Meta Cloud API Integration
              </span>
              <span className="text-xs text-dark/40 font-medium">Production Credentials</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              WhatsApp API & Marketing Settings
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Configure your Meta WhatsApp Access Token, Phone Number ID, Webhooks & Google Review links
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Meta Credentials Card */}
        <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E8DFCF] pb-3">
            <ShieldCheck size={20} className="text-emerald-700" />
            <h3 className="font-display text-base font-bold text-dark">Meta WhatsApp Cloud API Credentials</h3>
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Temporary / Permanent Meta Access Token *</label>
            <textarea
              rows={3}
              value={formData.whatsapp_token}
              onChange={(e) => setFormData({ ...formData, whatsapp_token: e.target.value })}
              placeholder="EAAG..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-mono text-xs focus:outline-none focus:border-emerald-600"
            />
            <span className="text-[10px] text-dark/40 mt-1 block">
              Generated from your Meta Developer Portal under WhatsApp &gt; API Setup.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-dark/80 mb-1">Phone Number ID *</label>
              <input
                type="text"
                value={formData.phone_number_id}
                onChange={(e) => setFormData({ ...formData, phone_number_id: e.target.value })}
                placeholder="e.g. 104827394827361"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">WhatsApp Business Account ID</label>
              <input
                type="text"
                value={formData.business_account_id}
                onChange={(e) => setFormData({ ...formData, business_account_id: e.target.value })}
                placeholder="e.g. 109827364518273"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Marketing Configuration Card */}
        <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E8DFCF] pb-3">
            <Globe size={20} className="text-emerald-700" />
            <h3 className="font-display text-base font-bold text-dark">Review Link & Automation Master Toggle</h3>
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Salon Google Review Link</label>
            <input
              type="url"
              value={formData.google_review_link}
              onChange={(e) => setFormData({ ...formData, google_review_link: e.target.value })}
              placeholder="https://g.page/r/triotheposh/review"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-emerald-600"
            />
            <span className="text-[10px] text-dark/40 mt-1 block">
              This link is automatically sent in post-visit review requests 24 hours after customer visits.
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div>
              <span className="font-bold text-emerald-900 text-xs block">Automated WhatsApp Sending Master Switch</span>
              <span className="text-[11px] text-emerald-800/80">
                When enabled, cron background jobs automatically send birthdays, reminders, and thank yous.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, auto_send_enabled: !formData.auto_send_enabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.auto_send_enabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  formData.auto_send_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Webhook Configuration Information */}
        <div className="glass-card p-6 border border-[#E8DFCF] space-y-3 bg-[#F4F0E6]/60">
          <h4 className="font-bold text-dark text-xs flex items-center gap-1.5">
            <Link size={16} className="text-emerald-700" /> Meta Webhook Callback Configuration
          </h4>
          <p className="text-xs text-dark/70">
            Copy this Webhook Callback URL and paste it into your Meta Developer Portal under <strong>WhatsApp &gt; Configuration &gt; Webhook</strong>:
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl font-mono text-xs text-dark"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(webhookUrl)}
              className="px-3.5 py-2 rounded-xl bg-dark text-white font-bold hover:bg-dark/80 transition-colors flex items-center gap-1 text-xs"
            >
              <Copy size={14} /> Copy
            </button>
          </div>

          <p className="text-[10px] text-dark/50">
            Verify Token: <code className="bg-white px-1.5 py-0.5 rounded border border-[#E8DFCF] font-bold text-dark">trio_whatsapp_webhook_secret</code>
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save WhatsApp Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
