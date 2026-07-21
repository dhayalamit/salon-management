import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, Phone, Calendar, DollarSign, Percent, Award, Receipt, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export default function StaffProfile() {
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
      const res = await client.get(`/staff/${id}`);
      setProfile(res.data);
    } catch (err) {
      showError('Failed to load staff profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-dark/40 animate-pulse">
        Loading staff profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-dark/60">Staff member not found</p>
        <button onClick={() => navigate('/staff')} className="mt-4 text-xs font-semibold text-[#D4AF37]">
          ← Back to Staff List
        </button>
      </div>
    );
  }

  const totalSales = (profile.salesHistory || []).reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const totalCommission = (profile.salesHistory || []).reduce((acc, curr) => acc + Number(curr.commission_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/staff')}
          className="p-2.5 rounded-2xl glass-card hover:bg-white text-dark/70 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">{profile.name}</h1>
          <p className="text-xs text-dark/50">Staff Profile & Performance Analytics</p>
        </div>
      </div>

      {/* Staff Info Header Card */}
      <div className="glass-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#D4AF37] to-[#A37E1F] font-display text-2xl font-bold text-white shadow-md">
            {profile.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-dark">{profile.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 capitalize">
                {profile.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-dark/60 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><Phone size={13} className="text-[#D4AF37]" /> {profile.phone || 'No phone'}</span>
            </p>
          </div>
        </div>

        {/* Sales & Commission Metrics */}
        <div className="flex items-center gap-6 self-stretch md:self-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#E8DFCF]">
          <div className="text-center px-4">
            <p className="text-[11px] font-semibold uppercase text-dark/40">Total Sales</p>
            <p className="font-display text-2xl font-bold text-[#D4AF37]">
              ₹{totalSales.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="h-8 w-px bg-[#E8DFCF]" />
          <div className="text-center px-4">
            <p className="text-[11px] font-semibold uppercase text-dark/40">Earned Commission</p>
            <p className="font-display text-2xl font-bold text-emerald-600">
              ₹{totalCommission.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Performed Services / Invoices History */}
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-bold text-dark mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-[#D4AF37]" /> Sales & Service History
        </h3>

        {!profile.salesHistory || profile.salesHistory.length === 0 ? (
          <p className="text-xs text-dark/40 py-8 text-center">No service history recorded for this staff member</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8DFCF] text-dark/50 font-semibold uppercase">
                  <th className="pb-3 px-2">Invoice #</th>
                  <th className="pb-3 px-2">Client</th>
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2 text-right">Bill Total</th>
                  <th className="pb-3 px-2 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFCF]/60">
                {profile.salesHistory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
                    <td className="py-3 px-2 font-semibold text-dark">{inv.invoice_number}</td>
                    <td className="py-3 px-2 text-dark/70">{inv.customer_name || 'Select Customer / Client'}</td>
                    <td className="py-3 px-2 text-dark/50">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-right font-bold text-dark">₹{Number(inv.total).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-600">₹{Number(inv.commission_amount || 0).toLocaleString('en-IN')}</td>
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
