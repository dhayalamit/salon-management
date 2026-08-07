import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
  Zap,
  CheckCircle,
  Calendar,
  Gift,
  Star,
  Clock,
  Heart,
  Save,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

export default function AutomationRules() {
  const { showSuccess, showError } = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRule, setSavingRule] = useState('');

  useEffect(() => {
    fetchAutomationRules();
  }, []);

  const fetchAutomationRules = async () => {
    try {
      setLoading(true);
      const res = await client.get('/whatsapp/automations');
      setRules(res.data || []);
    } catch (err) {
      showError('Failed to load WhatsApp automation rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (rule) => {
    const updatedStatus = !Boolean(rule.is_enabled);
    try {
      setSavingRule(rule.rule_type);
      await client.put(`/whatsapp/automations/${rule.rule_type}`, {
        is_enabled: updatedStatus,
        custom_message: rule.custom_message,
        discount_offer: rule.discount_offer,
      });
      showSuccess(`Automation rule "${rule.rule_type}" ${updatedStatus ? 'enabled' : 'disabled'}`);
      fetchAutomationRules();
    } catch (err) {
      showError('Failed to update automation rule');
    } finally {
      setSavingRule('');
    }
  };

  const handleSaveRuleConfig = async (rule) => {
    try {
      setSavingRule(rule.rule_type);
      await client.put(`/whatsapp/automations/${rule.rule_type}`, {
        is_enabled: Boolean(rule.is_enabled),
        custom_message: rule.custom_message,
        discount_offer: rule.discount_offer,
      });
      showSuccess(`Automation offer for "${rule.rule_type}" saved!`);
      fetchAutomationRules();
    } catch (err) {
      showError('Failed to save automation rule');
    } finally {
      setSavingRule('');
    }
  };

  const ruleMetaMap = {
    birthday: {
      title: '🎉 Daily Birthday Wishes (9:00 AM)',
      desc: 'Automatically checks clients whose birthday is today at 9:00 AM and dispatches a personalized wish & gift offer.',
      icon: Gift,
      color: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    },
    appointment_reminder_24h: {
      title: '⏰ Appointment Reminders (24h / 2h / 30m)',
      desc: 'Dispatches automated WhatsApp reminders before client appointments with stylist, service, date & time details.',
      icon: Clock,
      color: 'bg-purple-100 text-purple-800',
    },
    review_request: {
      title: '🌟 Post-Visit Review Request (24h After Visit)',
      desc: 'Automatically asks clients to rate their salon experience 24 hours after their visit with your Google Review link.',
      icon: Star,
      color: 'bg-amber-100 text-amber-800',
    },
    welcome: {
      title: '👋 Welcome New Client Message',
      desc: 'Sent automatically after a first-time client completes their first Customer Visit.',
      icon: Sparkles,
      color: 'bg-blue-100 text-blue-800',
    },
    thank_you: {
      title: '💖 Payment Completion Thank You',
      desc: 'Dispatched immediately when a Customer Visit payment is completed.',
      icon: Heart,
      color: 'bg-[#F4F0E6] text-[#D4AF37]',
    },
    miss_you_30d: {
      title: '💔 Miss You Win-Back Campaign (30, 60, 90 Days)',
      desc: 'Re-engages inactive clients who haven’t visited in 30, 60, or 90 days with a special comeback discount.',
      icon: TrendingUp,
      color: 'bg-emerald-100 text-emerald-800',
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md">
            <Zap size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-emerald-700 text-white">
                Automated Trigger Rules
              </span>
              <span className="text-xs text-dark/40 font-medium">Hands-free Customer Engagement</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              WhatsApp Automation Rules
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Enable or customize automated messages for birthdays, appointments, reviews, thank yous & win-back campaigns
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-dark/40 italic">
            Loading automation rules...
          </div>
        ) : (
          rules.map((rule) => {
            const meta = ruleMetaMap[rule.rule_type] || {
              title: `⚡ Rule: ${rule.rule_type}`,
              desc: 'Automated WhatsApp message trigger',
              icon: Zap,
              color: 'bg-gray-100 text-dark',
            };
            const Icon = meta.icon;
            const isEnabled = Boolean(rule.is_enabled);

            return (
              <div key={rule.id} className="glass-card p-5 border border-[#E8DFCF] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-2xl ${meta.color} shrink-0`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark text-sm">{meta.title}</h3>
                      <p className="text-[11px] text-dark/50 mt-0.5">{meta.desc}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleRule(rule)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Editable Discount Offer */}
                <div className="pt-2 border-t border-[#E8DFCF] space-y-2 text-xs">
                  <label className="block font-semibold text-dark/70 text-[11px]">
                    Associated Discount / Offer Text:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rule.discount_offer || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRules((prev) =>
                          prev.map((r) => (r.rule_type === rule.rule_type ? { ...r, discount_offer: val } : r))
                        );
                      }}
                      placeholder="e.g. 20% OFF on any service"
                      className="flex-1 px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRuleConfig(rule)}
                      className="px-3 py-1.5 rounded-xl bg-dark text-white font-bold text-[11px] hover:bg-dark/80 transition-colors flex items-center gap-1"
                    >
                      <Save size={12} /> Save
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
