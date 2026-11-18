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
  Check,
  AlertCircle,
  Eye,
  Edit2,
  Copy as CopyIcon,
  XCircle,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Table from '../../components/ui/Table.jsx';
import { normalizePhoneNumber, validatePhoneNumber } from '../../services/whatsapp/phoneUtils.js';
import { replaceTemplateVariables, AVAILABLE_VARIABLES } from '../../services/whatsapp/variableEngine.js';
import { checkApiConnectionStatus, sendWhatsAppMessage, sendTestWhatsAppMessage, PROVIDERS } from '../../services/whatsapp/whatsappService.js';
import { runAutomationEngineScan, DEFAULT_AUTOMATIONS } from '../../services/whatsapp/automationEngine.js';
import { getDb, saveDb } from '../../services/mockStorage.js';

export default function WhatsAppCenter() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core Data Collections
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dbData, setDbData] = useState(getDb());

  // Connection & Settings State
  const [apiSettings, setApiSettings] = useState({
    provider: 'meta',
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    senderPhone: '+91 98765 43210',
    webhookUrl: 'http://localhost:5173/api/whatsapp/webhook',
    webhookVerifyToken: 'trio_posh_verify_token_2026',
    isTestMode: false,
  });
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, status: 'NOT_CONNECTED' });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [sendingTestMsg, setSendingTestMsg] = useState(false);

  // Send Single Message State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customMessageBody, setCustomMessageBody] = useState('');
  const [sendingSingle, setSendingSingle] = useState(false);

  // Broadcast State
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastTemplateId, setBroadcastTemplateId] = useState('');
  const [broadcastCustomMessage, setBroadcastCustomMessage] = useState('');
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [launchingBroadcast, setLaunchingBroadcast] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('ALL');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'Appointment Reminder',
    language: 'en_US',
    status: 'Approved',
    body_text: '',
  });

  // History State
  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Automations State
  const [automations, setAutomations] = useState([]);
  const [runningAutomationScan, setRunningAutomationScan] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const db = getDb();
    setDbData(db);
    setCustomers(db.customers || []);
    setAppointments(db.appointments || []);

    const wSettings = db.whatsapp?.settings || apiSettings;
    setApiSettings(wSettings);

    const conn = checkApiConnectionStatus(wSettings);
    setConnectionStatus(conn);

    const wTemplates = db.whatsapp?.templates || [];
    setTemplates(wTemplates);
    if (wTemplates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(wTemplates[0].id);
      setSelectedTemplateId(wTemplates[0].id);
    }
    if (wTemplates.length > 0 && !broadcastTemplateId) {
      setBroadcastTemplateId(wTemplates[0].id);
    }

    const wHistory = db.whatsapp?.history || [];
    setHistory(wHistory);

    const wAutomations = db.whatsapp?.automations || DEFAULT_AUTOMATIONS;
    setAutomations(wAutomations);
  };

  const handleSaveApiSettings = (e) => {
    e.preventDefault();
    const db = getDb();
    if (!db.whatsapp) db.whatsapp = {};
    db.whatsapp.settings = apiSettings;
    saveDb(db);

    const conn = checkApiConnectionStatus(apiSettings);
    setConnectionStatus(conn);
    showSuccess('WhatsApp API Settings saved successfully');
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    await new Promise((r) => setTimeout(r, 600));
    const conn = checkApiConnectionStatus(apiSettings);
    setConnectionStatus(conn);
    setTestingConnection(false);

    if (conn.isConnected) {
      showSuccess(`WhatsApp API Connected! Status: ${conn.statusText}`);
    } else {
      showError(`Connection Failed: ${conn.message}`);
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testPhoneNumber) return showError('Please enter a test phone number.');
    setSendingTestMsg(true);

    try {
      const res = await sendTestWhatsAppMessage(testPhoneNumber, apiSettings);
      if (res.success) {
        showSuccess(`Test message sent successfully to ${res.recipientPhone}`);
      } else {
        showError(`Test message failed: ${res.error}`);
      }
    } catch (err) {
      showError('Failed to send test message');
    } finally {
      setSendingTestMsg(false);
    }
  };

  const handleSendSingleMessage = async (e) => {
    e.preventDefault();
    const targetCustomer = customers.find((c) => String(c.id) === String(selectedCustomerId));
    const targetPhone = targetCustomer ? targetCustomer.phone : manualPhone;

    if (!targetPhone) {
      return showError('Please select a customer or enter a phone number.');
    }

    const selectedTpl = templates.find((t) => String(t.id) === String(selectedTemplateId));
    const messageBody = customMessageBody || selectedTpl?.body_text || 'Hello {{customer_name}}, greetings from {{salon_name}}!';

    setSendingSingle(true);
    try {
      const res = await sendWhatsAppMessage({
        to: targetPhone,
        messageText: messageBody,
        context: { customer: targetCustomer || { name: 'Customer', phone: targetPhone } },
        apiSettings,
      });

      // Save to history log
      const db = getDb();
      if (!db.whatsapp) db.whatsapp = {};
      db.whatsapp.history = db.whatsapp.history || [];

      const newHistoryItem = {
        id: `msg_single_${Date.now()}`,
        customer_name: targetCustomer ? targetCustomer.name : 'Manual Entry',
        phone: targetPhone,
        message_type: selectedTpl ? selectedTpl.category : 'Single Message',
        template_name: selectedTpl ? selectedTpl.name : 'Custom Direct Message',
        message: res.finalMessage || replaceTemplateVariables(messageBody, { customer: targetCustomer }),
        status: res.status,
        error: res.error || null,
        sent_at: new Date().toISOString(),
      };

      db.whatsapp.history.unshift(newHistoryItem);
      saveDb(db);
      loadData();

      if (res.success) {
        showSuccess(`Message sent successfully to ${targetPhone}`);
        setCustomMessageBody('');
      } else {
        showError(`Failed to send message: ${res.error}`);
      }
    } catch (err) {
      showError('Failed to send message');
    } finally {
      setSendingSingle(false);
    }
  };

  // Broadcast Recipients Calculation
  const getBroadcastRecipients = () => {
    const today = new Date().toISOString().split('T')[0];

    if (broadcastTarget === 'all') return customers;
    if (broadcastTarget === 'active') return customers.filter((c) => (c.visits_count || 0) > 0);
    if (broadcastTarget === 'inactive') return customers.filter((c) => (c.visits_count || 0) === 0);
    if (broadcastTarget === 'birthday') {
      const currentMonthDay = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      return customers.filter((c) => c.birthday && c.birthday.endsWith(currentMonthDay));
    }
    if (broadcastTarget === 'appointments_today') {
      const todayAppts = appointments.filter((a) => a.appointment_date === today);
      const custIds = new Set(todayAppts.map((a) => String(a.customer_id || a.customerId)));
      return customers.filter((c) => custIds.has(String(c.id)));
    }
    return customers;
  };

  const handleLaunchBroadcast = async () => {
    const recipients = getBroadcastRecipients();
    if (recipients.length === 0) {
      return showError('No eligible recipients found for the selected broadcast audience.');
    }

    const selectedTpl = templates.find((t) => String(t.id) === String(broadcastTemplateId));
    const messageText = broadcastCustomMessage || selectedTpl?.body_text || 'Greetings from {{salon_name}}!';

    setLaunchingBroadcast(true);
    setShowBroadcastConfirm(false);

    let sentCount = 0;
    let failCount = 0;
    const db = getDb();
    if (!db.whatsapp) db.whatsapp = {};
    db.whatsapp.history = db.whatsapp.history || [];

    for (const cust of recipients) {
      const res = await sendWhatsAppMessage({
        to: cust.phone,
        messageText,
        context: { customer: cust },
        apiSettings,
      });

      if (res.success) sentCount++;
      else failCount++;

      db.whatsapp.history.unshift({
        id: `msg_bcast_${Date.now()}_${cust.id}`,
        customer_name: cust.name,
        phone: cust.phone,
        message_type: 'Broadcast Campaign',
        template_name: selectedTpl ? selectedTpl.name : 'Broadcast Template',
        message: res.finalMessage || replaceTemplateVariables(messageText, { customer: cust }),
        status: res.status,
        error: res.error || null,
        sent_at: new Date().toISOString(),
      });
    }

    saveDb(db);
    loadData();
    setLaunchingBroadcast(false);

    if (sentCount > 0) {
      showSuccess(`Broadcast completed! ${sentCount} sent successfully, ${failCount} failed.`);
    } else {
      showError(`Broadcast transmission failed. ${failCount} messages failed.`);
    }
  };

  const handleRunAutomationScan = async () => {
    setRunningAutomationScan(true);
    try {
      const res = await runAutomationEngineScan();
      loadData();
      showSuccess(`Automation Engine scan completed! Processed ${res.totalProcessed} trigger event(s).`);
    } catch (err) {
      showError('Failed to run automation scan');
    } finally {
      setRunningAutomationScan(false);
    }
  };

  const handleToggleAutomationRule = (ruleId) => {
    const db = getDb();
    if (!db.whatsapp) db.whatsapp = {};
    db.whatsapp.automations = (db.whatsapp.automations || DEFAULT_AUTOMATIONS).map((a) => {
      if (a.id === ruleId) {
        return { ...a, is_enabled: !a.is_enabled };
      }
      return a;
    });
    saveDb(db);
    loadData();
    showSuccess('Automation setting updated');
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.body_text) {
      return showError('Template Name and Message Body are required');
    }

    const db = getDb();
    if (!db.whatsapp) db.whatsapp = {};
    db.whatsapp.templates = db.whatsapp.templates || [];

    if (editingTemplate) {
      const idx = db.whatsapp.templates.findIndex((t) => t.id === editingTemplate.id);
      if (idx !== -1) {
        db.whatsapp.templates[idx] = {
          ...db.whatsapp.templates[idx],
          ...templateForm,
          updated_at: new Date().toISOString(),
        };
      }
    } else {
      const newTpl = {
        id: `tpl_${Date.now()}`,
        ...templateForm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.whatsapp.templates.unshift(newTpl);
    }

    saveDb(db);
    loadData();
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
    setTemplateForm({ name: '', category: 'Appointment Reminder', language: 'en_US', status: 'Approved', body_text: '' });
    showSuccess('Template saved successfully');
  };

  const handleDeleteTemplate = (id) => {
    const db = getDb();
    if (!db.whatsapp) db.whatsapp = {};
    db.whatsapp.templates = (db.whatsapp.templates || []).filter((t) => t.id !== id);
    saveDb(db);
    loadData();
    showSuccess('Template deleted');
  };

  // Filtered Templates & History
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase()) || t.body_text.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCat = templateCategoryFilter === 'ALL' || t.category === templateCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredHistory = history.filter((h) => {
    const matchesSearch =
      (h.customer_name || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (h.phone || '').includes(historySearch) ||
      (h.message || '').toLowerCase().includes(historySearch.toLowerCase());
    const matchesStatus = historyStatusFilter === 'ALL' || h.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const historyColumns = [
    {
      header: 'Customer Details',
      render: (row) => (
        <div>
          <p className="font-bold text-dark text-xs">{row.customer_name || 'Walk-in'}</p>
          <span className="text-[11px] font-mono text-dark/50">{row.phone}</span>
        </div>
      ),
    },
    {
      header: 'Message Type & Template',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-dark block">{row.template_name || 'Direct Message'}</span>
          <span className="text-[10px] text-dark/40 uppercase font-medium">{row.message_type || 'WhatsApp'}</span>
        </div>
      ),
    },
    {
      header: 'Sent At',
      render: (row) => (
        <span className="text-xs text-dark/70 font-mono">
          {new Date(row.sent_at).toLocaleDateString('en-IN')} {new Date(row.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Delivery Status',
      render: (row) => {
        const isDelivered = row.status === 'Delivered' || row.status === 'Read' || row.status === 'Sent';
        return (
          <div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                isDelivered ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              {row.status}
            </span>
            {row.error && <span className="text-[10px] text-red-600 block mt-0.5 max-w-xs truncate">{row.error}</span>}
          </div>
        );
      },
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => setSelectedHistoryItem(row)}
          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-dark transition-all text-xs font-semibold flex items-center gap-1"
        >
          <Eye size={13} /> View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark flex items-center gap-2">
            <MessageSquare size={26} className="text-[#D4AF37]" /> WhatsApp Communication Center
          </h1>
          <p className="text-xs text-dark/50">Enterprise Messaging, Automations, Birthday Wishes, Appointment Reminders & Meta API</p>
        </div>

        <button
          onClick={handleRunAutomationScan}
          disabled={runningAutomationScan}
          className="px-4 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2"
        >
          <RefreshCw size={14} className={runningAutomationScan ? 'animate-spin' : ''} />
          {runningAutomationScan ? 'Scanning Engine...' : 'Run Automation Scan'}
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E8DFCF] scrollbar-none text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'send_message', label: 'Send Message', icon: Send },
          { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
          { id: 'birthday', label: 'Birthday Wishes', icon: Gift },
          { id: 'reminders', label: 'Reminders', icon: Clock },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'history', label: 'Message History', icon: Clock },
          { id: 'automation', label: 'Automation Center', icon: Zap },
          { id: 'settings', label: 'API Settings', icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 border ${
                isActive
                  ? 'bg-dark text-white border-dark shadow-md'
                  : 'bg-white text-dark/70 border-[#E8DFCF] hover:border-[#D4AF37] hover:text-dark'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-[#D4AF37]' : 'text-dark/40'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD TAB */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Connection Status Banner Card */}
          <div
            className={`glass-card p-5 border-l-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              connectionStatus.isConnected
                ? 'border-l-emerald-500 bg-emerald-50/30'
                : 'border-l-red-500 bg-red-50/40'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  connectionStatus.isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {connectionStatus.isConnected ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-dark text-base">{connectionStatus.statusText}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      connectionStatus.isConnected
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {connectionStatus.status}
                  </span>
                </div>
                <p className="text-xs text-dark/60 mt-1">{connectionStatus.message}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 rounded-full bg-dark text-white font-semibold text-xs hover:bg-dark/80 transition-all shrink-0 shadow-xs"
            >
              Configure WhatsApp API →
            </button>
          </div>

          {/* 8 Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase text-dark/50">Messages Sent Today</p>
              <h3 className="font-display text-2xl font-bold text-dark">
                {history.filter((h) => h.sent_at && h.sent_at.startsWith(new Date().toISOString().split('T')[0])).length}
              </h3>
            </div>
            <div className="glass-card p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Delivered Messages</p>
              <h3 className="font-display text-2xl font-bold text-emerald-600">
                {history.filter((h) => h.status === 'Delivered' || h.status === 'Read' || h.status === 'Sent').length}
              </h3>
            </div>
            <div className="glass-card p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase text-red-800">Failed Transmissions</p>
              <h3 className="font-display text-2xl font-bold text-red-600">
                {history.filter((h) => h.status === 'Failed').length}
              </h3>
            </div>
            <div className="glass-card p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase text-blue-800">Active Automations</p>
              <h3 className="font-display text-2xl font-bold text-blue-600">
                {automations.filter((a) => a.is_enabled).length}
              </h3>
            </div>
          </div>

          {/* Active Automations & Recent Messaging Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-5 border border-[#E8DFCF] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-3">
                <h3 className="font-display text-base font-bold text-dark flex items-center gap-2">
                  <Zap size={18} className="text-[#D4AF37]" /> Active Automation Triggers
                </h3>
                <button onClick={() => setActiveTab('automation')} className="text-xs text-[#D4AF37] font-bold hover:underline">
                  Manage All →
                </button>
              </div>

              <div className="space-y-2.5">
                {automations.slice(0, 4).map((rule) => (
                  <div key={rule.id} className="p-3 rounded-2xl bg-white border border-[#E8DFCF] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-dark">{rule.name}</p>
                      <span className="text-[10px] text-dark/50">{rule.trigger_label}</span>
                    </div>
                    <button
                      onClick={() => handleToggleAutomationRule(rule.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        rule.is_enabled ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {rule.is_enabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 border border-[#E8DFCF] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-3">
                <h3 className="font-display text-base font-bold text-dark flex items-center gap-2">
                  <Clock size={18} className="text-[#D4AF37]" /> Recent Activity Log
                </h3>
                <button onClick={() => setActiveTab('history')} className="text-xs text-[#D4AF37] font-bold hover:underline">
                  View Full History →
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {history.length === 0 ? (
                  <p className="text-dark/40 italic text-center py-6">No recent WhatsApp messages recorded.</p>
                ) : (
                  history.slice(0, 4).map((h) => (
                    <div key={h.id} className="p-3 rounded-2xl bg-white border border-[#E8DFCF] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-dark">{h.customer_name}</p>
                        <p className="text-[10px] text-dark/50 truncate max-w-xs">{h.message}</p>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          h.status === 'Delivered' || h.status === 'Sent' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEND MESSAGE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'send_message' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 glass-card p-6 border border-[#E8DFCF] space-y-5">
            <h3 className="font-display text-lg font-bold text-dark">Send Single WhatsApp Message</h3>

            <form onSubmit={handleSendSingleMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-dark/70 mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find((c) => String(c.id) === String(e.target.value));
                    if (cust) setManualPhone(cust.phone);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">-- Choose Existing Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Or Enter Customer Phone Number</label>
                <input
                  type="text"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Select Approved WhatsApp Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Message Text / Override</label>
                <textarea
                  rows={4}
                  value={
                    customMessageBody ||
                    templates.find((t) => String(t.id) === String(selectedTemplateId))?.body_text ||
                    ''
                  }
                  onChange={(e) => setCustomMessageBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sendingSingle}
                  className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-bold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={15} /> {sendingSingle ? 'Transmitting...' : 'Send Message Now'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-5 border border-[#E8DFCF] space-y-3">
              <h4 className="font-display font-bold text-dark text-sm flex items-center gap-2">
                <Eye size={16} className="text-[#D4AF37]" /> Live Final Message Preview
              </h4>

              <div className="p-4 rounded-2xl bg-[#E5DDD5] text-dark text-xs font-sans whitespace-pre-wrap leading-relaxed border border-[#D5C9BD] shadow-inner min-h-[160px]">
                {replaceTemplateVariables(
                  customMessageBody ||
                    templates.find((t) => String(t.id) === String(selectedTemplateId))?.body_text ||
                    'Hello {{customer_name}}, welcome to {{salon_name}}!',
                  {
                    customer: customers.find((c) => String(c.id) === String(selectedCustomerId)) || {
                      name: 'Rahul Sharma',
                      phone: manualPhone || '+91 98765 43210',
                    },
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BROADCAST TAB */}
      {/* ========================================================================= */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-dark">Create Broadcast Campaign</h3>
                <p className="text-xs text-dark/50">Send approved template messages to customer audience segments</p>
              </div>
              <span className="px-3.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-bold text-xs border border-[#D4AF37]/30">
                Audience Size: {getBroadcastRecipients().length} Customers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-dark/70 mb-1">Target Audience Segment</label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="all">All Registered Customers ({customers.length})</option>
                    <option value="active">Active Customers with Visits</option>
                    <option value="inactive">Inactive / New Customers</option>
                    <option value="birthday">Customers Having Birthday Today</option>
                    <option value="appointments_today">Customers with Appointments Today</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-dark/70 mb-1">Broadcast Template</label>
                  <select
                    value={broadcastTemplateId}
                    onChange={(e) => setBroadcastTemplateId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-dark/70 mb-1">Custom Message / Template Override</label>
                  <textarea
                    rows={4}
                    value={
                      broadcastCustomMessage ||
                      templates.find((t) => String(t.id) === String(broadcastTemplateId))?.body_text ||
                      ''
                    }
                    onChange={(e) => setBroadcastCustomMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowBroadcastConfirm(true)}
                  disabled={launchingBroadcast || getBroadcastRecipients().length === 0}
                  className="w-full py-3 rounded-full bg-[#D4AF37] text-white font-bold text-xs hover:bg-[#C59F2E] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Megaphone size={16} /> Launch Broadcast to {getBroadcastRecipients().length} Customers
                </button>
              </div>

              {/* Live Preview */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-dark text-xs">Live Broadcast Message Preview</h4>
                <div className="p-4 rounded-2xl bg-[#E5DDD5] text-dark text-xs font-sans whitespace-pre-wrap leading-relaxed border border-[#D5C9BD] shadow-inner min-h-[220px]">
                  {replaceTemplateVariables(
                    broadcastCustomMessage ||
                      templates.find((t) => String(t.id) === String(broadcastTemplateId))?.body_text ||
                      'Greetings from {{salon_name}}!',
                    { customer: getBroadcastRecipients()[0] || { name: 'Customer Name', phone: '+91 98765 43210' } }
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CONFIRM BROADCAST MODAL */}
          <Modal isOpen={showBroadcastConfirm} onClose={() => setShowBroadcastConfirm(false)} title="Confirm Broadcast Campaign">
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                You are about to transmit this WhatsApp message to <strong>{getBroadcastRecipients().length} customer(s)</strong> individually.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
                <button
                  onClick={() => setShowBroadcastConfirm(false)}
                  className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunchBroadcast}
                  className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold hover:bg-[#C59F2E]"
                >
                  Confirm & Send Broadcast
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BIRTHDAY AUTOMATION TAB */}
      {/* ========================================================================= */}
      {activeTab === 'birthday' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DFCF] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600">
                  <Gift size={22} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-dark">Automated Birthday Wishes</h3>
                  <p className="text-xs text-dark/50">Automatically send personalized WhatsApp greetings & offers on customer birthdays</p>
                </div>
              </div>

              <button
                onClick={() => handleToggleAutomationRule('rule_birthday')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border transition-all ${
                  automations.find((a) => a.type === 'birthday')?.is_enabled
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                {automations.find((a) => a.type === 'birthday')?.is_enabled ? 'Automation Active (ON)' : 'Automation Disabled (OFF)'}
              </button>
            </div>

            {/* Template & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-dark/70 mb-1">Select Birthday Template</label>
                  <select
                    value={automations.find((a) => a.type === 'birthday')?.template_id || 'tpl_birthday_1'}
                    onChange={(e) => {
                      const tplId = e.target.value;
                      const db = getDb();
                      if (!db.whatsapp) db.whatsapp = {};
                      db.whatsapp.automations = (db.whatsapp.automations || DEFAULT_AUTOMATIONS).map((a) =>
                        a.type === 'birthday' ? { ...a, template_id: tplId } : a
                      );
                      saveDb(db);
                      loadData();
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F0E6] border border-[#E8DFCF] space-y-1">
                  <p className="font-bold text-dark">Duplicate Prevention Protection</p>
                  <p className="text-dark/60 text-[11px]">
                    The engine checks send logs and ensures each customer receives a birthday wish at most ONCE per birthday year.
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <h4 className="font-bold text-dark text-xs">Live Birthday Template Preview</h4>
                <div className="p-4 rounded-2xl bg-[#E5DDD5] text-dark text-xs font-sans whitespace-pre-wrap leading-relaxed border border-[#D5C9BD] shadow-inner min-h-[160px]">
                  {replaceTemplateVariables(
                    templates.find((t) => t.id === (automations.find((a) => a.type === 'birthday')?.template_id || 'tpl_birthday_1'))?.body_text ||
                      'Happy Birthday {{customer_name}}! 🎉',
                    { customer: { name: 'Pooja Sharma', birthday: '17 August' } }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. APPOINTMENT REMINDERS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
            <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Clock size={22} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-dark">Automatic Appointment Reminders</h3>
                <p className="text-xs text-dark/50">Configure timed WhatsApp reminders to eliminate customer no-shows</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {automations
                .filter((a) => a.trigger === 'appointment_reminder')
                .map((rule) => (
                  <div key={rule.id} className="p-4 rounded-2xl bg-white border border-[#E8DFCF] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-dark text-sm">{rule.name}</p>
                      <p className="text-[11px] text-dark/50">{rule.trigger_label}</p>
                    </div>

                    <button
                      onClick={() => handleToggleAutomationRule(rule.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border transition-all ${
                        rule.is_enabled ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {rule.is_enabled ? 'Active (ON)' : 'Off'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TEMPLATES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates..."
                className="px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-xs text-dark focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ name: '', category: 'Appointment Reminder', language: 'en_US', status: 'Approved', body_text: '' });
                setIsTemplateModalOpen(true);
              }}
              className="px-4 py-2 rounded-full bg-[#D4AF37] text-white font-bold text-xs hover:bg-[#C59F2E] shadow-sm flex items-center gap-1.5"
            >
              <Plus size={14} /> Create New Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((t) => (
              <div key={t.id} className="glass-card p-5 border border-[#E8DFCF] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-dark text-sm">{t.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {t.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-dark/40 font-bold uppercase block">{t.category}</span>
                  <p className="text-xs text-dark/70 font-sans whitespace-pre-wrap line-clamp-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {t.body_text}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="p-1.5 rounded-xl text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TEMPLATE FORM MODAL */}
          <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create / Edit WhatsApp Template">
            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-dark/70 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. Appointment Reminder 24h"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Birthday">Birthday</option>
                  <option value="Appointment Reminder">Appointment Reminder</option>
                  <option value="Appointment Confirmation">Appointment Confirmation</option>
                  <option value="Thank You">Thank You</option>
                  <option value="Offer">Offer / Promotion</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Template Body Text *</label>
                <textarea
                  rows={4}
                  required
                  value={templateForm.body_text}
                  onChange={(e) => setTemplateForm({ ...templateForm, body_text: e.target.value })}
                  placeholder="Hi {{customer_name}}, your appointment is at {{appointment_time}}..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
                <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 rounded-full border border-[#E8DFCF] font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-full bg-[#D4AF37] text-white font-bold">
                  Save Template
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MESSAGE HISTORY TAB */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history by name, phone, message..."
              className="px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-xs text-dark focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <Table columns={historyColumns} data={filteredHistory} loading={false} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. AUTOMATION CENTER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
            <h3 className="font-display text-lg font-bold text-dark">Centralized Automation Control Center</h3>

            <div className="space-y-3 text-xs">
              {automations.map((rule) => (
                <div key={rule.id} className="p-4 rounded-2xl bg-white border border-[#E8DFCF] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-dark text-sm">{rule.name}</p>
                    <p className="text-[11px] text-dark/50">{rule.trigger_label}</p>
                  </div>

                  <button
                    onClick={() => handleToggleAutomationRule(rule.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border transition-all ${
                      rule.is_enabled ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    {rule.is_enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. WHATSAPP API SETTINGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 border border-[#E8DFCF] space-y-6">
            <div className="flex items-center gap-3 border-b border-[#E8DFCF] pb-4">
              <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <Key size={22} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-dark">WhatsApp Business API Settings</h3>
                <p className="text-xs text-dark/50">Configure Meta Cloud API, Twilio, or Webhook credentials for live messaging</p>
              </div>
            </div>

            <form onSubmit={handleSaveApiSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-dark/70 mb-1">API Provider</label>
                  <select
                    value={apiSettings.provider}
                    onChange={(e) => setApiSettings({ ...apiSettings, provider: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-dark/70 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={apiSettings.phoneNumberId}
                    onChange={(e) => setApiSettings({ ...apiSettings, phoneNumberId: e.target.value })}
                    placeholder="e.g. 104928374829102"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-dark/70 mb-1">Meta Permanent Access Token</label>
                <input
                  type="password"
                  value={apiSettings.accessToken}
                  onChange={(e) => setApiSettings({ ...apiSettings, accessToken: e.target.value })}
                  placeholder="EAAG..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-dark/70 mb-1">Business Account ID (WABA ID)</label>
                  <input
                    type="text"
                    value={apiSettings.businessAccountId}
                    onChange={(e) => setApiSettings({ ...apiSettings, businessAccountId: e.target.value })}
                    placeholder="e.g. 2938472918274"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-dark/70 mb-1">Sender Phone Number</label>
                  <input
                    type="text"
                    value={apiSettings.senderPhone}
                    onChange={(e) => setApiSettings({ ...apiSettings, senderPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E8DFCF]">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-2 rounded-full border border-[#D4AF37] text-[#D4AF37] font-bold hover:bg-[#D4AF37]/10"
                >
                  {testingConnection ? 'Testing...' : 'Test API Connection'}
                </button>

                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-bold shadow-md">
                  Save Credentials
                </button>
              </div>
            </form>
          </div>

          {/* Send Live Test Message Form */}
          <div className="glass-card p-6 border border-[#E8DFCF] space-y-4">
            <h4 className="font-display font-bold text-dark text-sm">Send Test Message</h4>
            <form onSubmit={handleSendTestMessage} className="flex gap-3 text-xs">
              <input
                type="text"
                required
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="Enter test phone number (e.g. +919876543210)"
                className="flex-1 px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                disabled={sendingTestMsg}
                className="px-5 py-2.5 rounded-xl bg-dark text-white font-bold hover:bg-dark/80 shrink-0"
              >
                {sendingTestMsg ? 'Transmitting...' : 'Send Test WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
