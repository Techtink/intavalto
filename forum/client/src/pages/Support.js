import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const categoryLabels = {
  complaint: 'Complaint',
  enquiry: 'Enquiry',
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  other: 'Other',
};

const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

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

export default function Support() {
  const user = useAuthStore((state) => state.user);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '', category: 'enquiry', priority: 'medium' });
  const [attachments, setAttachments] = useState([]);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/tickets/my?${params}`);
      setTickets(data.tickets);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const fd = new FormData();
      fd.append('subject', formData.subject);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('priority', formData.priority);
      attachments.forEach(file => fd.append('attachments', file));
      await api.post('/tickets', fd);
      setFormData({ subject: '', description: '', category: 'enquiry', priority: 'medium' });
      setAttachments([]);
      setShowForm(false);
      setSuccess(t('support.successMessage'));
      setTimeout(() => setSuccess(''), 5000);
      fetchTickets();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to submit ticket');
    }
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setAttachments(files);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/forum" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">&larr; {t('forum.title')}</Link>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('support.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">{user.displayName || user.username}</span>
            ) : (
              <Link to="/login" className="bg-[#50ba4b] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#45a340]">{t('common.logIn')}</Link>
            )}
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8 text-center transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('support.heroTitle')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t('support.heroSubtitle')}</p>
          {user && user.role !== 'admin' ? (
            <button onClick={() => setShowForm(!showForm)}
              className="bg-[#50ba4b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#45a340]">
              {showForm ? t('common.cancel') : t('support.submitTicket')}
            </button>
          ) : !user ? (
            <div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">{t('support.loginPrompt')}</p>
              <Link to="/login" className="bg-[#50ba4b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#45a340] inline-block">
                {t('support.loginToContinue')}
              </Link>
            </div>
          ) : null}
        </div>

        {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6 text-sm">{success}</div>}

        {/* Ticket Form */}
        {showForm && user && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('support.newTicketTitle')}</h3>
            {formError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.subjectLabel')}</label>
                <input type="text" value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={t('support.subjectPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" required />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.categoryLabel')}</label>
                  <select value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {Object.keys(categoryLabels).map((key) => (
                      <option key={key} value={key}>{t(`support.categories.${key}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.priorityLabel')}</label>
                  <select value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {Object.keys(priorityLabels).map((key) => (
                      <option key={key} value={key}>{t(`support.priorities.${key}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.descriptionLabel')}</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('support.descriptionPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" rows="6" required />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.attachmentsLabel')}</label>
                <input type="file" accept="image/*" multiple onChange={handleAttachmentChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0 file:text-sm file:font-medium
                  file:bg-green-50 file:text-[#45a340] hover:file:bg-green-100 dark:file:bg-green-900/30 dark:file:text-[#50ba4b]" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('support.attachmentsHint')}</p>
                {attachments.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="relative w-16 h-16 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="bg-[#50ba4b] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#45a340]">
                {t('support.submitButton')}
              </button>
            </form>
          </div>
        )}

        {/* My Tickets */}
        {user && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('support.myTickets')}</h3>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">{t('common.allStatus')}</option>
                <option value="open">{t('common.open')}</option>
                <option value="in_progress">{t('common.inProgress')}</option>
                <option value="resolved">{t('common.resolved')}</option>
                <option value="closed">{t('common.closed')}</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">{t('common.loading')}</div>
            ) : tickets.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 dark:text-gray-500 transition-colors">
                {statusFilter ? t('support.noTicketsFiltered') : t('support.noTickets')}
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <Link key={ticket.id} to={`/support/${ticket.id}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-green-200 dark:hover:border-green-800 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 dark:text-gray-500">#{ticket.ticketNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[ticket.status]}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${priorityColors[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{ticket.subject}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                          <span>{t(`support.categories.${ticket.category}`)}</span>
                          <span>&middot;</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          {ticket.Assignee && (
                            <>
                              <span>&middot;</span>
                              <span>Assigned to {ticket.Assignee.displayName || ticket.Assignee.username}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 text-sm text-gray-700 dark:text-gray-300">{t('common.previous')}</button>
                <span className="px-3 py-1.5 text-gray-500 dark:text-gray-400 text-sm">{t('common.page', { current: page, total: totalPages })}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 text-sm text-gray-700 dark:text-gray-300">{t('common.next')}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
