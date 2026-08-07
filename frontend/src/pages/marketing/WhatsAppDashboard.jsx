import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
  MessageSquare,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCheck,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function WhatsAppDashboard() {
  const { showSuccess, showError } = useToast();
  const [stats, setStats] = useState({
    totalSent: 0,
    todaySent: 0,
    delivered: 0,
    failed: 0,
    read: 0,
    deliveryRate: 100,
    campaignsCount: 0,
    activeRulesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Quick Test Message Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test WhatsApp message from TRIO The Posh.');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await client.get('/whatsapp/dashboard');
      if (res.data) setStats(res.data);
    } catch (err) {
      showError('Failed to load WhatsApp marketing analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testPhone || !testPhone.trim()) {
      return showError('Recipient phone number is required');
    }

    try {
      setSendingTest(true);
      const res = await client.post('/whatsapp/send-test', {
        phone: testPhone,
        message: testMessage,
      });
      showSuccess(res.data?.message || 'Test WhatsApp message dispatched successfully!');
      setIsTestModalOpen(false);
      setTestPhone('');
      fetchDashboardStats();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to dispatch test WhatsApp message');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md">
            <MessageSquare size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-emerald-700 text-white">
                Official Meta Cloud API
              </span>
              <span className="text-xs text-dark/40 font-medium">Production WhatsApp Automation</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              WhatsApp Automation Dashboard
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Real-time delivery performance, automated customer triggers & broadcast campaign analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchDashboardStats}
            className="p-2.5 rounded-full bg-white border border-[#E8DFCF] text-dark hover:bg-gray-100 transition-all shadow-xs"
            title="Refresh Analytics"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Send size={15} /> Send Test Message
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Messages Sent Today
            </span>
            <h3 className="font-display text-2xl font-bold text-emerald-800">{stats.todaySent}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Send size={22} />
          </div>
        </div>

        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Delivery Success Rate
            </span>
            <h3 className="font-display text-2xl font-bold text-blue-700">{stats.deliveryRate}%</h3>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
            <CheckCheck size={22} />
          </div>
        </div>

        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Total Delivered
            </span>
            <h3 className="font-display text-2xl font-bold text-purple-700">{stats.delivered}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="glass-card p-5 border border-[#E8DFCF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 block mb-1">
              Active Automation Rules
            </span>
            <h3 className="font-display text-2xl font-bold text-[#D4AF37]">{stats.activeRulesCount} Active</h3>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-[#D4AF37] border border-amber-100">
            <Zap size={22} />
          </div>
        </div>
      </div>

      {/* Quick Launch Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 border border-[#E8DFCF] space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-dark text-sm">Automated Event Triggers</h3>
              <p className="text-[11px] text-dark/50">Birthdays, Reminders, Reviews & Miss You</p>
            </div>
          </div>
          <p className="text-xs text-dark/70">
            Automatically sends WhatsApp messages on client birthdays (9 AM), 24h/2h before appointments, and post-visit review requests.
          </p>
        </div>

        <div className="glass-card p-6 border border-[#E8DFCF] space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-800">
              <Send size={20} />
            </div>
            <div>
              <h3 className="font-bold text-dark text-sm">Promotional Broadcasts</h3>
              <p className="text-[11px] text-dark/50">Festival offers & VIP client blasts</p>
            </div>
          </div>
          <p className="text-xs text-dark/70">
            Broadcast promotional offers to VIP clients, inactive clients, or filter by gender and service history.
          </p>
        </div>

        <div className="glass-card p-6 border border-[#E8DFCF] space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-bold text-dark text-sm">Meta Message Templates</h3>
              <p className="text-[11px] text-dark/50">Customizable dynamic variable tags</p>
            </div>
          </div>
          <p className="text-xs text-dark/70">
            Design WhatsApp templates with variables <code className="bg-gray-100 px-1 rounded text-[11px]">{"{{name}}"}</code>, <code className="bg-gray-100 px-1 rounded text-[11px]">{"{{service}}"}</code>, and emojis.
          </p>
        </div>
      </div>

      {/* QUICK TEST MESSAGE MODAL */}
      <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} title="Send Test WhatsApp Message">
        <form onSubmit={handleSendTestMessage} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200">
            <span className="font-bold text-xs block mb-0.5">💬 Official Meta Cloud API Tester</span>
            <span className="text-[11px] text-emerald-800/80">
              Enter a mobile number (10-digit or E.164) to dispatch a live test WhatsApp message immediately.
            </span>
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Recipient Mobile Number *</label>
            <input
              type="text"
              required
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Message Text</label>
            <textarea
              rows={3}
              required
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsTestModalOpen(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingTest}
              className="px-5 py-2 rounded-full bg-emerald-700 text-white font-bold hover:bg-emerald-800 shadow-md flex items-center gap-1.5"
            >
              <Send size={14} /> {sendingTest ? 'Dispatching...' : 'Dispatch Test Message'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
