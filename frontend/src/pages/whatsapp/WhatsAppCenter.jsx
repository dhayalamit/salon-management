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
  FileText,
  Plus,
  Trash2,
  Filter,
  Megaphone,
  Gift,
  Star,
  Heart,
  Save,
  Key,
  ShieldCheck,
  Globe,
  Copy,
  Activity,
  Lock,
  Calendar,
  Users,
  Search,
  RotateCcw,
  Paperclip,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Table from '../../components/ui/Table.jsx';

export default function WhatsAppCenter() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard Stats State
  const [stats, setStats] = useState({
    todaySent: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    scheduled: 0,
    birthdaySentToday: 0,
    remindersSentToday: 0,
    festivalSentToday: 0,
    deliveryRate: 100,
    campaignsCount: 0,
    activeRulesCount: 0,
    recentActivity: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Direct Send Message State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directName, setDirectName] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const [sendingDirect, setSendingDirect] = useState(false);

  // Broadcast State
  const [broadcastData, setBroadcastData] = useState({
    name: '',
    targetAudience: 'all',
    customMessage: '🌟 Special Greetings & Offer from TRIO The Posh!\n\nDear {{customer_name}},\nEnjoy 20% OFF on your next salon appointment!\n\nBook today!',
    mediaUrl: '',
    scheduledAt: '',
  });
  const [launchingBroadcast, setLaunchingBroadcast] = useState(false);

  // Automations State
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    bodyText: 'Hello {{customer_name}}, your appointment is confirmed for {{appointment_date}} at {{appointment_time}} with {{stylist}} at TRIO The Posh!',
  });

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historyType, setHistoryType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    whatsapp_token: '',
    whatsapp_token_masked: '',
    phone_number_id: '',
    business_account_id: '',
    default_country_code: '91',
    google_review_link: 'https://g.page/r/triotheposh/review',
    auto_send_enabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (activeTab === 'automations') fetchAutomationRules();
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const res = await client.get('/whatsapp/dashboard');
      if (res.data) setStats(res.data);
    } catch (err) {
      showError('Failed to load WhatsApp dashboard stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await client.get('/customers');
      setCustomers(res.data || []);
    } catch (e) {}
  };

  const fetchAutomationRules = async () => {
    try {
      setLoadingRules(true);
      const res = await client.get('/whatsapp/automations');
      setRules(res.data || []);
    } catch (err) {
      showError('Failed to load automation rules');
    } finally {
      setLoadingRules(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await client.get('/whatsapp/templates');
      setTemplates(res.data || []);
    } catch (err) {
      showError('Failed to load templates');
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const params = {};
      if (historyStatus) params.status = historyStatus;
      if (historyType) params.type = historyType;
      if (historySearch) params.search = historySearch;
      const res = await client.get('/whatsapp/history', { params });
      setHistory(res.data || []);
    } catch (err) {
      showError('Failed to load message history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await client.get('/whatsapp/settings');
      if (res.data) {
        setSettingsForm({
          whatsapp_token: res.data.whatsapp_token || '',
          whatsapp_token_masked: res.data.whatsapp_token_masked || '',
          phone_number_id: res.data.phone_number_id || '',
          business_account_id: res.data.business_account_id || '',
          default_country_code: res.data.default_country_code || '91',
          google_review_link: res.data.google_review_link || 'https://g.page/r/triotheposh/review',
          auto_send_enabled: Boolean(res.data.auto_send_enabled),
        });
      }
    } catch (err) {
      showError('Failed to load WhatsApp settings');
    }
  };

  const handleSelectCustomer = (e) => {
    const cId = e.target.value;
    setSelectedCustomerId(cId);
    if (!cId) {
      setDirectPhone('');
      setDirectName('');
      return;
    }
    const cust = customers.find((c) => String(c.id) === String(cId));
    if (cust) {
      setDirectPhone(cust.phone || '');
      setDirectName(cust.name || '');
    }
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();
    if (!directPhone || !directPhone.trim()) return showError('Phone number is required');

    try {
      setSendingDirect(true);
      const res = await client.post('/whatsapp/send', {
        phone: directPhone,
        customerId: selectedCustomerId || null,
        customerName: directName || 'Client',
        message: directMessage,
        mediaUrl,
        mediaType,
      });
      showSuccess(res.data?.message || '✔ Message Sent Successfully');
      setDirectMessage('');
      setMediaUrl('');
      fetchDashboardStats();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to send WhatsApp message');
    } finally {
      setSendingDirect(false);
    }
  };

  const handleLaunchBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastData.name) return showError('Campaign title is required');

    try {
      setLaunchingBroadcast(true);
      const res = await client.post('/whatsapp/broadcast', broadcastData);
      showSuccess(`Broadcast launched to ${res.data?.recipientsCount || 0} clients!`);
      setBroadcastData({
        name: '',
        targetAudience: 'all',
        customMessage: '🌟 Special Greetings & Offer from TRIO The Posh!\n\nDear {{customer_name}},\nEnjoy 20% OFF on your next salon appointment!\n\nBook today!',
        mediaUrl: '',
        scheduledAt: '',
      });
      fetchDashboardStats();
    } catch (err) {
      showError('Failed to launch broadcast');
    } finally {
      setLaunchingBroadcast(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConn(true);
      const res = await client.post('/whatsapp/test-connection');
      setConnStatus(res.data);
      if (res.data.connected) {
        showSuccess(`Connected! Phone: ${res.data.displayPhoneNumber || 'Verified'} (${res.data.verifiedName})`);
      } else {
        showError(res.data.message || 'Connection test failed');
      }
    } catch (err) {
      showError('Failed to test Meta API connection');
    } finally {
      setTestingConn(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await client.put('/whatsapp/settings', settingsForm);
      showSuccess('WhatsApp Center credentials saved securely!');
      fetchSettings();
    } catch (err) {
      showError('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const historyColumns = [
    {
      header: 'Recipient & Customer',
      render: (row) => (
        <div>
          <span className="font-bold text-dark text-xs block">{row.customer_name || 'Client'}</span>
          <span className="font-mono text-[11px] text-dark/50 flex items-center gap-1">📞 {row.recipient_phone}</span>
        </div>
      ),
    },
    {
      header: 'Message Type',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
          {row.message_type || 'custom'}
        </span>
      ),
    },
    {
      header: 'Message Text',
      render: (row) => (
        <div className="max-w-xs">
          <p className="text-xs text-dark/80 truncate font-sans">{row.message_body || '—'}</p>
          {row.meta_message_id && <span className="font-mono text-[9px] text-dark/30 block">ID: {row.meta_message_id}</span>}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const st = (row.status || 'sent').toLowerCase();
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              st === 'read' || st === 'delivered'
                ? 'bg-emerald-100 text-emerald-800'
                : st === 'sent'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {st}
          </span>
        );
      },
    },
    {
      header: 'Sent Date & Time',
      render: (row) => (
        <span className="text-xs text-dark/60">
          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at{' '}
          {new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md">
            <MessageSquare size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-emerald-700 text-white flex items-center gap-1">
                <Lock size={10} /> Meta WhatsApp Cloud API
              </span>
              <span className="text-xs text-dark/40 font-medium">Standalone WhatsApp Center</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              WhatsApp Center
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Automated client triggers, instant messaging, festival blasts & Meta Cloud API delivery analytics
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-1 bg-[#F4F0E6] p-1.5 rounded-full border border-[#E8DFCF]">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'send', label: 'Send Message', icon: Send },
            { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
            { id: 'automations', label: 'Automations', icon: Zap },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  active ? 'bg-emerald-700 text-white shadow-sm' : 'text-dark/70 hover:text-dark'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
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
                  Delivered Success Rate
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
                  Pending / Scheduled
                </span>
                <h3 className="font-display text-2xl font-bold text-purple-700">{stats.pending + stats.scheduled}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                <Clock size={22} />
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

          {/* Activity Logs Table */}
          <div className="glass-card p-6 border border-[#E8DFCF]">
            <h3 className="font-display text-base font-bold text-dark mb-4 flex items-center gap-2">
              <Clock size={18} className="text-emerald-700" /> Recent Dispatch Activity
            </h3>
            {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
              <p className="text-xs text-dark/40 italic py-6 text-center">No recent messages sent.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#E8DFCF] text-dark/50 uppercase text-[10px]">
                      <th className="py-2 px-3">Recipient</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Message Snippet</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFCF]/60">
                    {(stats.recentActivity || []).map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-bold text-dark">{r.customer_name} ({r.recipient_phone})</td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-emerald-800">{r.message_type}</td>
                        <td className="py-2.5 px-3 truncate max-w-xs text-dark/70">{r.message_body}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-dark/50">{new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SEND MESSAGE */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSendDirectMessage} className="glass-card p-6 border border-[#E8DFCF] space-y-4 text-xs">
            <h3 className="font-display text-base font-bold text-dark flex items-center gap-2 border-b border-[#E8DFCF] pb-3">
              <Send size={18} className="text-emerald-700" /> Send Instant WhatsApp Message
            </h3>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Select Client from Database (Optional)</label>
              <select
                value={selectedCustomerId}
                onChange={handleSelectCustomer}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
              >
                <option value="">-- Choose Existing Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-dark/80 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-dark/80 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="e.g. Amit Dhayal"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Message Text Body</label>
              <textarea
                rows={4}
                value={directMessage}
                onChange={(e) => setDirectMessage(e.target.value)}
                placeholder="Type your WhatsApp message text here..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Media Attachment URL (Optional Image / PDF)</label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/invoice.pdf"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={sendingDirect}
              className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send size={16} /> {sendingDirect ? 'Dispatching...' : 'Send Message Now'}
            </button>
          </form>

          {/* Phone Chat Preview */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#0B141A] rounded-3xl border border-gray-800 text-white space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Live WhatsApp Chat Bubble Preview</span>
            <div className="w-full max-w-xs bg-[#111B21] rounded-2xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col h-80">
              <div className="bg-[#202C33] px-3.5 py-2.5 flex items-center gap-2.5 border-b border-gray-700">
                <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">T</div>
                <div>
                  <h4 className="font-bold text-xs text-white">TRIO The Posh</h4>
                  <span className="text-[9px] text-emerald-400 block">Official Business</span>
                </div>
              </div>
              <div className="flex-1 p-3 bg-[#0B141A] overflow-y-auto space-y-2 text-xs">
                <div className="self-start max-w-[85%] bg-[#202C33] p-3 rounded-2xl rounded-tl-xs text-gray-200">
                  <p className="whitespace-pre-wrap text-[11px] leading-relaxed">
                    {directMessage || 'Hello! Welcome to TRIO The Posh.'}
                  </p>
                  <div className="flex justify-end items-center gap-1 text-[9px] text-gray-400 mt-1">
                    <span>12:00 PM</span>
                    <CheckCheck size={12} className="text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST */}
      {activeTab === 'broadcast' && (
        <form onSubmit={handleLaunchBroadcast} className="glass-card p-6 border border-[#E8DFCF] space-y-4 text-xs">
          <h3 className="font-display text-base font-bold text-dark border-b border-[#E8DFCF] pb-3 flex items-center gap-2">
            <Megaphone size={18} className="text-emerald-700" /> Promotional Broadcast Launcher
          </h3>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Campaign Title *</label>
            <input
              type="text"
              required
              value={broadcastData.name}
              onChange={(e) => setBroadcastData({ ...broadcastData, name: e.target.value })}
              placeholder="e.g. Festival 20% OFF Offer"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Target Audience Segment *</label>
            <select
              value={broadcastData.targetAudience}
              onChange={(e) => setBroadcastData({ ...broadcastData, targetAudience: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-semibold"
            >
              <option value="all">All Registered Salon Clients</option>
              <option value="vip">VIP Prepaid Wallet Clients Only</option>
              <option value="female">Female Clients Only</option>
              <option value="male">Male Clients Only</option>
              <option value="inactive_30d">Inactive Clients (No visit in last 30 days)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Broadcast Message Body *</label>
            <textarea
              rows={4}
              required
              value={broadcastData.customMessage}
              onChange={(e) => setBroadcastData({ ...broadcastData, customMessage: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
            <span className="text-[10px] text-dark/40 mt-1 block">
              Use tag <code className="bg-gray-100 px-1 rounded text-[10px]">{"{{customer_name}}"}</code> to insert client first name automatically.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={launchingBroadcast}
              className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Send size={15} /> {launchingBroadcast ? 'Broadcasting...' : 'Launch Broadcast Campaign'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: AUTOMATIONS */}
      {activeTab === 'automations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: 'birthday', title: '🎉 Daily Birthday Wishes (9:00 AM)', desc: 'Automatically dispatches birthday wishes & gift offers at 9:00 AM daily.', icon: Gift },
            { type: 'appointment_reminder_24h', title: '⏰ Appointment Reminders (24h / 2h / 30m)', desc: 'Dispatches automated reminders with date, time, stylist, service & salon address.', icon: Clock },
            { type: 'review_request', title: '🌟 Post-Visit Review Requests (24h After Visit)', desc: 'Automatically asks clients to rate their experience with your Google Review link.', icon: Star },
            { type: 'welcome', title: '👋 Welcome New Client Message', desc: 'Sent automatically after a first-time client completes their 1st visit.', icon: Sparkles },
            { type: 'thank_you', title: '💖 Payment Completion Thank You', desc: 'Dispatched immediately when a Customer Visit payment is completed.', icon: Heart },
            { type: 'miss_you_30d', title: '💔 Miss You Win-Back Campaign', desc: 'Re-engages inactive clients who haven’t visited in 30, 60, or 90 days.', icon: TrendingUp },
          ].map((item) => (
            <div key={item.type} className="glass-card p-5 border border-[#E8DFCF] space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 shrink-0">
                  <item.icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-dark text-sm">{item.title}</h3>
                  <p className="text-[11px] text-dark/50 mt-0.5">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center glass-card p-4 border border-[#E8DFCF]">
            <h3 className="font-display text-base font-bold text-dark">WhatsApp Template Manager</h3>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-4 py-2 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus size={15} /> Create Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="glass-card p-4 border border-[#E8DFCF] space-y-2 text-xs">
                <span className="font-mono font-bold text-dark block">{tpl.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold bg-emerald-100 text-emerald-800 inline-block">
                  {tpl.status || 'APPROVED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: HISTORY */}
      {activeTab === 'history' && (
        <Table
          columns={historyColumns}
          data={history}
          loading={loadingHistory}
          searchQuery={historySearch}
          onSearchChange={setHistorySearch}
          searchPlaceholder="Search phone number, customer name..."
          pagination={{
            currentPage,
            totalPages: Math.ceil(history.length / 10) || 1,
            onPageChange: setCurrentPage,
            totalItems: history.length,
            itemsPerPage: 10,
          }}
        />
      )}

      {/* TAB 7: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between glass-card p-6 border border-[#E8DFCF]">
            <div className="flex items-center gap-2">
              <Key size={20} className="text-emerald-700" />
              <h3 className="font-display text-base font-bold text-dark">Meta WhatsApp Cloud API Credentials</h3>
            </div>
            {connStatus && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  connStatus.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {connStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            )}
            <button
              onClick={handleTestConnection}
              disabled={testingConn}
              className="px-4 py-2 rounded-full bg-dark text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Activity size={14} /> {testingConn ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="glass-card p-6 border border-[#E8DFCF] space-y-4 text-xs">
            <div>
              <label className="block font-bold text-dark/80 mb-1">Permanent Meta Access Token *</label>
              <textarea
                rows={3}
                value={settingsForm.whatsapp_token}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_token: e.target.value })}
                placeholder="EAAG..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-mono text-xs"
              />
              {settingsForm.whatsapp_token_masked && (
                <span className="text-[10px] text-emerald-700 font-mono mt-1 block">
                  Security Masked: {settingsForm.whatsapp_token_masked}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-dark/80 mb-1">Phone Number ID *</label>
                <input
                  type="text"
                  value={settingsForm.phone_number_id}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone_number_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-dark/80 mb-1">Business Account ID</label>
                <input
                  type="text"
                  value={settingsForm.business_account_id}
                  onChange={(e) => setSettingsForm({ ...settingsForm, business_account_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-dark/80 mb-1">Default Country Code</label>
                <input
                  type="text"
                  value={settingsForm.default_country_code}
                  onChange={(e) => setSettingsForm({ ...settingsForm, default_country_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Google Review Link</label>
              <input
                type="url"
                value={settingsForm.google_review_link}
                onChange={(e) => setSettingsForm({ ...settingsForm, google_review_link: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-full bg-emerald-700 text-white font-bold text-xs"
              >
                <Save size={15} className="inline mr-1" /> {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
