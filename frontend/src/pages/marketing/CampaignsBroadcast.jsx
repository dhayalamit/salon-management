import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
  Send,
  Plus,
  Users,
  Calendar,
  Sparkles,
  CheckCircle,
  Clock,
  Filter,
  Megaphone,
} from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function CampaignsBroadcast() {
  const { showSuccess, showError } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAudience: 'all',
    customMessage: '🌟 Festival Special Offer from TRIO The Posh!\n\nDear {{name}},\nEnjoy 20% OFF on all salon services this week!\n\nBook your appointment now!',
    scheduledAt: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await client.get('/whatsapp/campaigns');
      setCampaigns(res.data || []);
    } catch (err) {
      showError('Failed to load WhatsApp campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      return showError('Campaign name is required');
    }

    try {
      setSubmitting(true);
      const res = await client.post('/whatsapp/campaigns', formData);
      showSuccess(
        formData.scheduledAt
          ? `Campaign "${res.data.name}" scheduled successfully!`
          : `Broadcast campaign "${res.data.name}" launched successfully!`
      );
      setIsModalOpen(false);
      setFormData({
        name: '',
        targetAudience: 'all',
        customMessage: '🌟 Festival Special Offer from TRIO The Posh!\n\nDear {{name}},\nEnjoy 20% OFF on all salon services this week!\n\nBook your appointment now!',
        scheduledAt: '',
      });
      fetchCampaigns();
    } catch (err) {
      showError('Failed to launch campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md">
            <Megaphone size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-emerald-700 text-white">
                Promotional Broadcast Engine
              </span>
              <span className="text-xs text-dark/40 font-medium">Segmented Audience Blasts</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              Campaigns & Broadcasts
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Launch targeted festival offers, VIP promotions & win-back campaigns to client phone numbers
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> New Broadcast Campaign
        </button>
      </div>

      {/* Campaigns Audit Table */}
      <div className="glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-4 mb-4">
          <h3 className="font-display text-base font-bold text-dark flex items-center gap-2">
            <Send size={18} className="text-emerald-700" /> Campaign History & Scheduled Blasts
          </h3>
          <span className="text-xs text-dark/50">
            Total Campaigns: <strong className="text-dark">{campaigns.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-dark/40 italic">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs text-dark/50 font-medium">No marketing campaigns found.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-full bg-emerald-700 text-white font-bold text-xs"
            >
              + Launch First Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8DFCF] text-dark/50 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-3">Campaign Name</th>
                  <th className="pb-3 px-3">Audience Segment</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Recipients Count</th>
                  <th className="pb-3 px-3">Created / Scheduled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFCF]/60">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-dark block">{c.name}</span>
                      <span className="text-[10px] text-dark/40 block truncate max-w-xs">{c.custom_message}</span>
                    </td>

                    <td className="py-3 px-3 uppercase text-dark/70 font-semibold text-[11px]">
                      🎯 {c.target_audience}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-dark">
                      {c.sent_count || 0} clients
                    </td>

                    <td className="py-3 px-3 text-dark/60">
                      {new Date(c.scheduled_at || c.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Launch WhatsApp Broadcast Campaign">
        <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-dark/80 mb-1">Campaign Title Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Diwali Special 20% Offer"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Target Audience Segment *</label>
            <select
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
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
            <label className="block font-bold text-dark/80 mb-1">WhatsApp Message Body *</label>
            <textarea
              rows={4}
              required
              value={formData.customMessage}
              onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-emerald-600"
            />
            <span className="text-[10px] text-dark/40 mt-1 block">
              Use variable tag <code className="bg-gray-100 px-1 rounded text-[10px]">{"{{name}}"}</code> to insert client first name automatically.
            </span>
          </div>

          <div>
            <label className="block font-bold text-dark/80 mb-1">Schedule Date & Time (Optional)</label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark"
            />
            <span className="text-[10px] text-dark/40 mt-1 block">Leave empty to broadcast immediately.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFCF]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-[#E8DFCF] text-dark/70 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-full bg-emerald-700 text-white font-bold hover:bg-emerald-800 shadow-md flex items-center gap-1.5"
            >
              <Send size={15} /> {submitting ? 'Launching...' : 'Launch Broadcast'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
