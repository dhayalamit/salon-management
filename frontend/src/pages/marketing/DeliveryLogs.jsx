import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import Table from '../../components/ui/Table.jsx';

export default function DeliveryLogs() {
  const { showSuccess, showError } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [retryingId, setRetryingId] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, typeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;

      const res = await client.get('/whatsapp/logs', { params });
      setLogs(res.data || []);
    } catch (err) {
      showError('Failed to load WhatsApp message logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (logId) => {
    try {
      setRetryingId(logId);
      await client.post(`/whatsapp/logs/${logId}/retry`);
      showSuccess('WhatsApp message retried successfully');
      fetchLogs();
    } catch (err) {
      showError('Failed to retry WhatsApp message');
    } finally {
      setRetryingId('');
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.recipient_phone.includes(search) ||
      (l.customer_name && l.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.message_body && l.message_body.toLowerCase().includes(search.toLowerCase()))
  );

  const itemsPerPage = 10;
  const paginatedData = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'Recipient & Client',
      render: (row) => (
        <div>
          <span className="font-bold text-dark text-xs block">{row.customer_name || 'Client'}</span>
          <span className="font-mono text-[11px] text-dark/50 flex items-center gap-1">
            📞 {row.recipient_phone}
          </span>
        </div>
      ),
    },
    {
      header: 'Message Type',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-dark/70 border border-[#E8DFCF]">
          {row.message_type || 'custom'}
        </span>
      ),
    },
    {
      header: 'Message Snippet',
      render: (row) => (
        <div className="max-w-xs">
          <p className="text-xs text-dark/80 truncate font-sans">{row.message_body || '—'}</p>
          {row.meta_message_id && (
            <span className="font-mono text-[9px] text-dark/30 block">ID: {row.meta_message_id}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const st = (row.status || 'sent').toLowerCase();
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
    {
      header: 'Action',
      render: (row) => (
        <div>
          {row.status === 'failed' && (
            <button
              onClick={() => handleRetry(row.id)}
              disabled={retryingId === row.id}
              className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs"
            >
              <RotateCcw size={12} /> {retryingId === row.id ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      ),
    },
  ];

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
                Delivery Audit Ledger
              </span>
              <span className="text-xs text-dark/40 font-medium">Real-Time Meta Cloud Logs</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              WhatsApp Delivery Logs
            </h1>
            <p className="text-xs text-dark/50 mt-0.5">
              Track message status, Meta message IDs, error trace, and trigger manual message retries
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-full bg-white border border-[#E8DFCF] text-dark font-semibold text-xs hover:bg-gray-100 flex items-center gap-1.5 shadow-xs self-end sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card p-4 border border-[#E8DFCF] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-emerald-700" />
          <span className="font-bold text-dark uppercase tracking-wider text-[11px]">Filter Audit Logs</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-dark/50 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-emerald-600"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-dark/50 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E8DFCF] rounded-xl text-dark font-medium focus:outline-none focus:border-emerald-600"
            >
              <option value="">All Message Types</option>
              <option value="birthday">Birthday Wishes</option>
              <option value="appointment_24h">Appointment Reminder (24h)</option>
              <option value="review_request">Review Request</option>
              <option value="campaign">Promotional Campaign</option>
              <option value="thank_you">Thank You</option>
              <option value="test">Test Message</option>
            </select>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search phone number, client name, message text..."
        pagination={{
          currentPage,
          totalPages: Math.ceil(filteredLogs.length / itemsPerPage) || 1,
          onPageChange: setCurrentPage,
          totalItems: filteredLogs.length,
          itemsPerPage,
        }}
      />
    </div>
  );
}
