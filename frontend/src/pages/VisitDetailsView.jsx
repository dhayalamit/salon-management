import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { CalendarCheck, ArrowLeft, User, Scissors, Package, CheckCircle, Clock, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export default function VisitDetailsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitDetails();
  }, [id]);

  const fetchVisitDetails = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/visits/${id}`);
      setVisit(res.data);
    } catch (err) {
      showError('Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-dark/50 italic">
        Loading customer visit record...
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-dark/50 text-xs">Customer visit record not found.</p>
        <button
          onClick={() => navigate('/visits')}
          className="px-4 py-2 rounded-full bg-[#D4AF37] text-white font-bold text-xs"
        >
          Back to Customer Visits
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/visits')}
          className="flex items-center gap-1.5 text-xs font-bold text-dark/70 hover:text-dark transition-colors"
        >
          <ArrowLeft size={16} /> Back to Customer Visits
        </button>
      </div>

      {/* Main Visit Card */}
      <div className="glass-card p-8 border border-[#E8DFCF] space-y-6">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8DFCF] pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
              <CalendarCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-dark">{visit.visit_number}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    visit.payment_status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : visit.payment_status === 'Partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {visit.payment_status || 'Paid'}
                </span>
              </div>
              <p className="text-xs text-dark/50 mt-1">
                Recorded on {new Date(visit.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at{' '}
                {new Date(visit.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-dark/50 uppercase block">Net Visit Total</span>
            <h2 className="font-display text-2xl font-bold text-emerald-800">
              ₹{Number(visit.total).toLocaleString('en-IN')}
            </h2>
          </div>
        </div>

        {/* Customer & Stylist Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#F4F0E6]/50 border border-[#E8DFCF]">
          <div>
            <span className="text-[10px] font-bold uppercase text-dark/40 tracking-wider block mb-1 flex items-center gap-1">
              <User size={12} className="text-[#D4AF37]" /> Customer Profile
            </span>
            <p className="font-bold text-dark text-sm">{visit.customer_name || 'Walk-in Customer'}</p>
            <p className="text-xs text-dark/60">{visit.customer_phone || 'No phone recorded'}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-dark/40 tracking-wider block mb-1 flex items-center gap-1">
              <Scissors size={12} className="text-[#D4AF37]" /> Stylist / Staff Assigned
            </span>
            <p className="font-bold text-dark text-sm">{visit.staff_name || 'Salon Staff Team'}</p>
            <p className="text-xs text-dark/60 uppercase font-semibold">💳 Payment Method: {visit.payment_method || 'cash'}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-dark text-xs uppercase tracking-wider border-b border-[#E8DFCF] pb-2">
            Services & Products Summary
          </h3>

          <div className="divide-y divide-[#E8DFCF]">
            {(visit.items || []).map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        item.item_type === 'service' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.item_type}
                    </span>
                    <span className="font-bold text-dark text-sm">{item.name}</span>
                  </div>
                  {item.staff_name && (
                    <span className="text-[11px] text-dark/50 mt-0.5 block">Provided by {item.staff_name}</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-dark/60 font-medium">
                    {item.quantity} x ₹{Number(item.unit_price).toLocaleString('en-IN')}
                  </span>
                  <p className="font-bold text-dark font-mono text-sm mt-0.5">
                    ₹{Number(item.line_total).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border-t border-[#E8DFCF] pt-4 space-y-2 text-xs max-w-xs ml-auto">
          <div className="flex justify-between text-dark/70">
            <span>Subtotal:</span>
            <span className="font-bold font-mono">₹{Number(visit.subtotal).toLocaleString('en-IN')}</span>
          </div>
          {Number(visit.discount) > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount Applied:</span>
              <span>- ₹{Number(visit.discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          {Number(visit.gst_amount) > 0 && (
            <div className="flex justify-between text-dark/70">
              <span>GST ({visit.gst_percent}%):</span>
              <span>+ ₹{Number(visit.gst_amount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-dark text-base pt-2 border-t border-[#E8DFCF]">
            <span>Net Total:</span>
            <span className="font-display text-emerald-800">₹{Number(visit.total).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-semibold text-dark/80 pt-1">
            <span>Amount Paid:</span>
            <span>₹{Number(visit.amount_paid || visit.total).toLocaleString('en-IN')}</span>
          </div>
          {Number(visit.remaining_amount) > 0 && (
            <div className="flex justify-between font-bold text-red-600 pt-1">
              <span>Remaining Balance:</span>
              <span>₹{Number(visit.remaining_amount).toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Visit Notes */}
        {visit.notes && (
          <div className="p-4 rounded-2xl bg-gray-50 border border-[#E8DFCF] text-xs space-y-1">
            <span className="font-bold text-dark/70 block">Visit Notes / Remarks:</span>
            <p className="text-dark/80 italic">{visit.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
