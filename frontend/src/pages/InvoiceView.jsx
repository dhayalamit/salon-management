import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, Printer, Download, Sparkles, CheckCircle, Scissors, Package } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceAndSettings();
  }, [id]);

  const fetchInvoiceAndSettings = async () => {
    try {
      setLoading(true);
      const [invRes, setRes] = await Promise.all([
        client.get(`/billing/${id}`),
        client.get('/settings'),
      ]);
      setInvoice(invRes.data);
      setSettings(setRes.data);
    } catch (err) {
      showError('Failed to load tax invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-dark/40 animate-pulse font-semibold">
        Generating POS printable invoice layout...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-dark/60 font-semibold">Invoice record not found</p>
        <button onClick={() => navigate('/billing')} className="mt-4 text-xs font-semibold text-[#D4AF37]">
          ← Back to Billing History
        </button>
      </div>
    );
  }

  const items = invoice.items || [];
  const hasServices = items.some((i) => i.item_type === 'service');
  const hasProducts = items.some((i) => i.item_type === 'product');

  const salonLogo = settings?.logo_url || '/logo.png';
  const salonName = settings?.salon_name || 'TRIO THE POSH';
  const tagline = settings?.tagline || 'Redefining Beauty & Elegance';
  const address = settings?.address || 'Piprali Road, Near MBA Chai Wala, Sikar – 332001';
  const phone = settings?.phone || '+91 98765 43210';
  const email = settings?.email || 'info@triotheposh.com';
  const gstNumber = settings?.gst_number || '';

  return (
    <div className="space-y-6">
      {/* Navigation & Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/billing')}
            className="p-2.5 rounded-2xl glass-card hover:bg-white text-dark/70 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-dark">Tax Invoice — {invoice.invoice_number}</h1>
            <p className="text-xs text-dark/50">Official POS Customer Receipt</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-xs hover:bg-[#C59F2E] transition-all shadow-md"
        >
          <Printer size={16} /> Print / Save PDF Invoice
        </button>
      </div>

      {/* Printable POS Invoice Container */}
      <div id="printable-invoice" className="glass-card p-8 sm:p-12 max-w-3xl mx-auto bg-white border border-[#E8DFCF] shadow-luxury">
        {/* Dynamic Salon Branding Header */}
        <div className="flex items-start justify-between border-b border-[#E8DFCF] pb-6 mb-6">
          <div className="flex items-start gap-4">
            <img
              src={salonLogo}
              alt={salonName}
              className="h-16 w-16 rounded-2xl object-contain bg-white p-1 border border-[#E8DFCF] shadow-sm shrink-0"
            />
            <div>
              <h2 className="font-display text-xl font-bold text-dark tracking-tight">{salonName}</h2>
              <p className="text-[11px] font-semibold tracking-wider text-[#D4AF37] italic">
                "{tagline}"
              </p>
              <p className="text-xs text-dark/60 mt-1">📍 {address}</p>
              <p className="text-xs text-dark/60">📞 {phone} {email ? `| ✉ ${email}` : ''}</p>
              {gstNumber && <p className="text-xs font-semibold text-dark/70 mt-0.5">GSTIN: {gstNumber}</p>}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F4F0E6] text-dark border border-[#E8DFCF] inline-block">
              TAX INVOICE
            </span>
            <p className="font-display text-lg font-bold text-dark mt-2">{invoice.invoice_number}</p>
            <p className="text-xs text-dark/50">
              {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Customer & Stylist Header Card */}
        <div className="grid grid-cols-2 gap-6 bg-[#F4F0E6]/60 p-4 rounded-2xl border border-[#E8DFCF] mb-6 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase text-dark/40 mb-1 tracking-wider">Customer Details</p>
            <p className="font-bold text-sm text-dark">{invoice.customer_name || 'Walk-in Client'}</p>
            <p className="text-dark/60">{invoice.customer_phone || 'No phone recorded'}</p>
          </div>
          <div className="text-right">
            {hasServices ? (
              <div>
                <p className="text-[10px] font-semibold uppercase text-dark/40 mb-1 tracking-wider">Attended Stylist</p>
                <p className="font-bold text-sm text-dark">{invoice.staff_name || 'Assigned Stylist'}</p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold uppercase text-dark/40 mb-1 tracking-wider">Bill Category</p>
                <p className="font-bold text-sm text-dark">Retail Product Purchase</p>
              </div>
            )}
            <p className="text-dark/60 capitalize mt-0.5">Payment Method: <span className="font-semibold text-dark">{invoice.payment_method || 'Cash'}</span></p>
          </div>
        </div>

        {/* Invoice Line Items Table */}
        <table className="w-full text-left text-xs mb-6">
          <thead>
            <tr className="border-b border-[#E8DFCF] text-dark/60 font-semibold uppercase bg-[#F4F0E6]/40">
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3">Stylist</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DFCF]/60">
            {items.map((item, index) => {
              const isService = item.item_type === 'service';
              const stylistDisplay = isService ? (item.staff_name || invoice.staff_name || 'Stylist') : 'Product';

              return (
                <tr key={index}>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1 ${
                        isService ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isService ? <Scissors size={10} /> : <Package size={10} />}
                      {isService ? 'Service' : 'Product'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-dark">{item.name}</td>
                  <td className="py-3 px-3 text-dark/70 font-medium">{stylistDisplay}</td>
                  <td className="py-3 px-3 text-center font-bold">{item.quantity || 1}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-bold text-dark font-mono">
                    ₹{Number(item.line_total).toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Calculation Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-xs border-t border-[#E8DFCF] pt-4">
            <div className="flex justify-between text-dark/70">
              <span>Subtotal</span>
              <span className="font-semibold text-dark font-mono">₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount</span>
                <span className="font-mono">-₹{Number(invoice.discount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-dark/70">
              <span>GST ({invoice.gst_percent || 0}%)</span>
              <span className="font-semibold text-dark font-mono">₹{Number(invoice.gst_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="h-px bg-[#E8DFCF] my-1" />
            <div className="flex justify-between text-sm font-bold text-dark">
              <span>Grand Total</span>
              <span className="font-display text-lg text-[#D4AF37] font-mono">
                ₹{Number(invoice.total).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Thank You Note */}
        <div className="border-t border-[#E8DFCF] pt-6 text-center text-[11px] text-dark/50 space-y-1">
          <p className="font-bold text-sm text-dark">Thank you for visiting {salonName}!</p>
          <p>For bookings & inquiries, call {phone} {email ? `or email ${email}` : ''}</p>
          {invoice.next_appointment_date && (
            <p className="pt-2 text-xs font-semibold text-[#D4AF37]">
              Recommended Next Appointment: {new Date(invoice.next_appointment_date).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
