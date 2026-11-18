import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, Phone, Calendar, Award, CalendarCheck, Clock, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/customers/${id}`);
      setProfile(res.data);
    } catch (err) {
      showError('Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-dark/40 animate-pulse">
        Loading client profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-dark/60">Customer not found</p>
        <button onClick={() => navigate('/customers')} className="mt-4 text-xs font-semibold text-[#D4AF37]">
          ← Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2.5 rounded-2xl glass-card hover:bg-white text-dark/70 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">{profile.name}</h1>
          <p className="text-xs text-dark/50">Client Profile & Lifetime Activity</p>
        </div>
      </div>

      {/* Customer Info Header Card */}
      <div className="glass-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#D4AF37] to-[#A37E1F] font-display text-2xl font-bold text-white shadow-md">
            {profile.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-dark">{profile.name}</h2>
            </div>
            <p className="text-xs text-dark/60 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><Phone size={13} className="text-[#D4AF37]" /> {profile.phone || 'No phone'}</span>
              <span>•</span>
              <span className="capitalize">{profile.gender}</span>
            </p>
          </div>
        </div>

        {/* Lifetime Metrics */}
        <div className="flex items-center gap-6 self-stretch md:self-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#E8DFCF]">
          <div className="text-center px-4">
            <p className="text-[11px] font-semibold uppercase text-dark/40">Total Spend</p>
            <p className="font-display text-2xl font-bold text-[#D4AF37]">
              ₹{(profile.lifetimeSpend || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="h-8 w-px bg-[#E8DFCF]" />
          <div className="text-center px-4">
            <p className="text-[11px] font-semibold uppercase text-dark/40">Total Visits</p>
            <p className="font-display text-2xl font-bold text-dark">
              {profile.visitCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Notes Card */}
      {profile.notes && (
        <div className="glass-card p-6 bg-gradient-to-br from-white via-white to-[#F4F0E6]">
          <h3 className="font-display text-sm font-bold text-dark mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-[#D4AF37]" /> Client Preferences & Notes
          </h3>
          <p className="text-xs text-dark/70 leading-relaxed">{profile.notes}</p>
        </div>
      )}

      {/* Visit History Section */}
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-bold text-dark mb-4 flex items-center gap-2">
          <CalendarCheck size={18} className="text-[#D4AF37]" /> Customer Visit History
        </h3>

        {!profile.history || profile.history.length === 0 ? (
          <p className="text-xs text-dark/40 py-8 text-center">No customer visits recorded for this client</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8DFCF] text-dark/50 font-semibold uppercase">
                  <th className="pb-3 px-2">Visit #</th>
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Staff</th>
                  <th className="pb-3 px-2">Payment Method</th>
                  <th className="pb-3 px-2 text-right">Amount</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFCF]/60">
                {profile.history.map((vis) => (
                  <tr key={vis.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
                    <td className="py-3 px-2 font-mono font-bold text-dark">{vis.visit_number || vis.invoice_number}</td>
                    <td className="py-3 px-2 text-dark/60">{new Date(vis.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-dark/70">{vis.staff_name || 'Standard Staff'}</td>
                    <td className="py-3 px-2 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        {vis.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-dark">₹{Number(vis.total).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => navigate(`/visits/${vis.id}`)}
                        className="px-3 py-1 rounded-full bg-[#F4F0E6] text-dark font-semibold hover:bg-[#D4AF37] hover:text-white transition-colors"
                      >
                        View Visit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
