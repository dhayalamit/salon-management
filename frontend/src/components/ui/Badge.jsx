import React from 'react';

const styles = {
  active: 'bg-emerald-50 text-emerald-700',
  present: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-ink-100 text-ink-500',
  absent: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-rose-50 text-rose-700',
  no_show: 'bg-rose-50 text-rose-700',
  half_day: 'bg-gold-50 text-gold-700',
  leave: 'bg-gold-50 text-gold-700',
  booked: 'bg-blue-50 text-blue-700',
  low: 'bg-rose-50 text-rose-700',
};

export default function Badge({ value }) {
  const key = String(value).toLowerCase().replace(/\s+/g, '_');
  const cls = styles[key] || 'bg-ink-100 text-ink-500';
  return <span className={`badge ${cls}`}>{String(value).replace(/_/g, ' ')}</span>;
}
