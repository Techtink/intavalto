import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useTranslation } from '../../i18n';

const statusColors = {
  open: 'bg-green-100 text-[#45a340] dark:bg-green-900/30 dark:text-[#50ba4b]',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  medium: 'bg-green-100 text-[#50ba4b] dark:bg-green-900/30 dark:text-[#50ba4b]',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const categoryLabels = {
  complaint: 'Complaint',
  enquiry: 'Enquiry',
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  other: 'Other',
};

export default function TicketManagement() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      const { data } = await api.get(`/admin/tickets?${params}`);
      setTickets(data.tickets);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleStatusChange = async (ticketId, newStatus) => {
    setError('');
    try {
      await api.put(`/admin/tickets/${ticketId}`, { status: newStatus });
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      setSuccess('Status updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      await api.put(`/admin/tickets/${ticketId}`, { priority: newPriority });
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, priority: newPriority } : t));
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('admin.tickets.title')}</h1>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{success}</div>}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">{t('common.allStatus')}</option>
          <option value="open">{t('common.open')}</option>
          <option value="in_progress">{t('common.inProgress')}</option>
          <option value="resolved">{t('common.resolved')}</option>
          <option value="closed">{t('common.closed')}</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">{t('admin.tickets.allPriorities')}</option>
          <option value="low">{t('support.priorities.low')}</option>
          <option value="medium">{t('support.priorities.medium')}</option>
          <option value="high">{t('support.priorities.high')}</option>
          <option value="urgent">{t('support.priorities.urgent')}</option>
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">{t('admin.tickets.allCategories')}</option>
          {Object.entries(categoryLabels).map(([key]) => (
            <option key={key} value={key}>{t(`support.categories.${key}`)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
      ) : tickets.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-6 rounded-lg text-center">
          <p className="text-lg font-medium">{t('admin.tickets.noTickets')}</p>
          <p className="text-sm mt-1">{t('admin.tickets.noTicketsDesc')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.tickets.tableNumber')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.tickets.tableSubject')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.tickets.tableSubmittedBy')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.tickets.tableCategory')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.tickets.tablePriority')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.tickets.tableStatus')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.tickets.tableDate')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.tickets.tableAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">{ticket.ticketNumber}</td>
                  <td className="px-4 py-3">
                    <Link to={`/support/${ticket.id}`} className="text-sm font-medium text-[#50ba4b] dark:text-[#50ba4b] hover:underline">
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-gray-900 dark:text-gray-100">{ticket.Creator?.username}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{ticket.Creator?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{t(`support.categories.${ticket.category}`)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={ticket.priority} onChange={(e) => handlePriorityChange(ticket.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${priorityColors[ticket.priority]}`}>
                      <option value="low">{t('support.priorities.low')}</option>
                      <option value="medium">{t('support.priorities.medium')}</option>
                      <option value="high">{t('support.priorities.high')}</option>
                      <option value="urgent">{t('support.priorities.urgent')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={ticket.status} onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[ticket.status]}`}>
                      <option value="open">{t('common.open')}</option>
                      <option value="in_progress">{t('common.inProgress')}</option>
                      <option value="resolved">{t('common.resolved')}</option>
                      <option value="closed">{t('common.closed')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/support/${ticket.id}`} className="text-[#50ba4b] dark:text-[#50ba4b] hover:underline text-sm">{t('admin.tickets.view')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded shadow disabled:opacity-50 text-sm text-gray-700 dark:text-gray-300">{t('common.previous')}</button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">{t('common.page', { current: page, total: totalPages })}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded shadow disabled:opacity-50 text-sm text-gray-700 dark:text-gray-300">{t('common.next')}</button>
        </div>
      )}
    </div>
  );
}
