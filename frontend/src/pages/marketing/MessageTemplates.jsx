import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  Eye,
  Smile,
  CheckCheck,
  Send,
  MessageSquare,
} from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function MessageTemplates() {
  const { showSuccess, showError } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Template Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    bodyText: 'Hello {{name}}, enjoy our exclusive offer {{offer}} at TRIO The Posh!',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await client.get('/whatsapp/templates');
      setTemplates(res.data || []);
    } catch (err) {
      showError('Failed to load message templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      return showError('Template name is required');
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        category: formData.category,
        language: formData.language,
        components: [
          {
            type: 'BODY',
            text: formData.bodyText,
          },
        ],
      };

      await client.post('/whatsapp/templates', payload);
      showSuccess('WhatsApp template created successfully!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        category: 'MARKETING',
        language: 'en_US',
        bodyText: 'Hello {{name}}, enjoy our exclusive offer {{offer}} at TRIO The Posh!',
      });
      fetchTemplates();
    } catch (err) {
      showError('Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await client.delete(`/whatsapp/templates/${id}`);
      showSuccess('Template deleted');
      fetchTemplates();
    } catch (err) {
      showError('Failed to delete template');
    }
  };

  const insertVariable = (varName) => {
    setFormData((prev) => ({
      ...prev,
      bodyText: prev.bodyText + ` {{${varName}}}`,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-[#E8DFCF]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md">
            <FileText size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-emerald-700 text-white">
                Meta Message Templates
              </span>
              <span className="text-xs text-dark/40 font-medium">Dynamic Variable Tags</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              WhatsApp Templates & Editor
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Create and preview Meta-compliant WhatsApp templates with dynamic variables and chat bubble mockups
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> Create Template
        </button>
      </div>

      {/* Templates Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-dark/40 italic">
            Loading message templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center space-y-2">
            <p className="text-xs text-dark/50 font-medium">No custom templates found.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-full bg-emerald-700 text-white font-bold text-xs"
            >
              + Create First Template
            </button>
          </div>
        ) : (
          templates.map((tpl) => {
            let body = '';
            try {
              const comps = typeof tpl.components === 'string' ? JSON.parse(tpl.components) : tpl.components;
              const bodyComp = (comps || []).find((c) => c.type === 'BODY');
              body = bodyComp?.text || 'Standard template text';
            } catch (e) {
              body = 'Standard template message';
            }

            return (
              <div key={tpl.id} className="glass-card p-5 border border-[#E8DFCF] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-[#E8DFCF] pb-2 mb-3">
                    <span className="font-mono text-xs font-bold text-dark">{tpl.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {tpl.status || 'APPROVED'}
                    </span>
                  </div>
                  <p className="text-xs text-dark/70 whitespace-pre-wrap font-sans">{body}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8DFCF] text-[11px] text-dark/50">
                  <span>Category: {tpl.category || 'MARKETING'}</span>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE TEMPLATE MODAL WITH LIVE WHATSAPP PHONE MOCKUP PREVIEW */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Meta WhatsApp Template">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Left Form */}
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div>
              <label className="block font-bold text-dark/80 mb-1">Template Identifier Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. birthday_wish_offer"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-dark/40 mt-1 block">Lowercase letters, numbers, and underscores only.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-dark/80 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
                >
                  <option value="MARKETING">Marketing / Offers</option>
                  <option value="UTILITY">Utility / Reminders</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-dark/80 mb-1">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium"
                >
                  <option value="en_US">English (en_US)</option>
                  <option value="hi_IN">Hindi (hi_IN)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-dark/80 mb-1">Body Text Content *</label>
              <textarea
                rows={5}
                required
                value={formData.bodyText}
                onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Quick Variable Tag Insertion Buttons */}
            <div>
              <span className="block font-bold text-dark/70 mb-1.5">Insert Dynamic Variables:</span>
              <div className="flex flex-wrap gap-1.5">
                {['name', 'service', 'date', 'time', 'stylist', 'offer', 'points'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertVariable(tag)}
                    className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-dark/80 font-mono text-[10px] font-bold border border-[#E8DFCF] transition-colors"
                  >
                    + {"{{" + tag + "}}"}
                  </button>
                ))}
              </div>
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
                <CheckCircle size={15} /> {submitting ? 'Creating...' : 'Save Template'}
              </button>
            </div>
          </form>

          {/* Right Live WhatsApp Chat Mockup Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-[#0B141A] rounded-3xl border border-gray-800 text-white space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
              Live WhatsApp Preview
            </span>

            {/* Phone Frame */}
            <div className="w-full max-w-xs bg-[#111B21] rounded-2xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col h-80">
              {/* WhatsApp Header */}
              <div className="bg-[#202C33] px-3.5 py-2.5 flex items-center gap-2.5 border-b border-gray-700">
                <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
                  T
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">TRIO The Posh</h4>
                  <span className="text-[9px] text-emerald-400 block">Verified Business</span>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-3 bg-[#0B141A] overflow-y-auto space-y-2 font-sans text-xs">
                <div className="self-start max-w-[85%] bg-[#202C33] p-3 rounded-2xl rounded-tl-xs shadow-md text-gray-200">
                  <p className="whitespace-pre-wrap text-[11px] leading-relaxed">
                    {formData.bodyText
                      .replace(/{{name}}/g, 'Amit')
                      .replace(/{{service}}/g, 'Hair Cut & Styling')
                      .replace(/{{offer}}/g, '20% OFF')
                      .replace(/{{stylist}}/g, 'Rahul')
                      .replace(/{{date}}/g, 'Today')
                      .replace(/{{time}}/g, '04:00 PM')}
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
      </Modal>
    </div>
  );
}
