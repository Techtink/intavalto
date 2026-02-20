import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

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

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data } = await api.get(`/tickets/${id}`);
        setTicket(data);
        setReplies(data.TicketReplies || []);
      } catch (err) {
        console.error('Failed to load ticket:', err);
        if (err.response?.status === 403) navigate('/support');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, navigate]);

  const handleReply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const fd = new FormData();
      fd.append('content', newReply);
      replyAttachments.forEach(file => fd.append('attachments', file));
      const { data } = await api.post(`/tickets/${id}/replies`, fd);
      setReplies([...replies, data.reply]);
      setNewReply('');
      setReplyAttachments([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add reply');
    }
  };

  const handleClose = async () => {
    if (!window.confirm(t('ticketDetail.closeConfirm'))) return;
    try {
      await api.post(`/tickets/${id}/close`);
      setTicket({ ...ticket, status: 'closed' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close ticket');
    }
  };

  const handleReopen = async () => {
    if (!window.confirm(t('ticketDetail.reopenConfirm'))) return;
    try {
      await api.post(`/tickets/${id}/reopen`);
      setTicket({ ...ticket, status: 'open' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reopen ticket');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">{t('common.loading')}</div>;
  if (!ticket) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('ticketDetail.ticketNotFound')}</p>
        <Link to="/support" className="text-[#50ba4b] hover:underline">{t('ticketDetail.backToSupportLink')}</Link>
      </div>
    </div>
  );

  const isOwner = user?.id === ticket.userId;
  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/support" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">&larr; {t('ticketDetail.backToSupport')}</Link>
            <span className="text-sm text-gray-400 dark:text-gray-500">{t('ticketDetail.ticketNumber', { number: ticket.ticketNumber })}</span>
          </div>
          {ticket.status !== 'closed' && isStaff && (
            <button onClick={handleClose} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 border border-gray-300 dark:border-gray-600 px-3 py-1 rounded">
              {t('ticketDetail.closeTicket')}
            </button>
          )}
          {ticket.status === 'closed' && (isOwner || isStaff) && (
            <button onClick={handleReopen} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#50ba4b] border border-gray-300 dark:border-gray-600 px-3 py-1 rounded">
              {t('ticketDetail.reopenTicket')}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* Ticket Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
              {ticket.priority}
            </span>
            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
              {t(`support.categories.${ticket.category}`)}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{ticket.subject}</h1>

          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>{t('ticketDetail.submittedBy')} <strong className="text-gray-700 dark:text-gray-300">{ticket.Creator?.displayName || ticket.Creator?.username}</strong></span>
            <span>&middot;</span>
            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            {ticket.Assignee && (
              <>
                <span>&middot;</span>
                <span>{t('ticketDetail.assignedTo')} <strong className="text-gray-700 dark:text-gray-300">{ticket.Assignee.displayName || ticket.Assignee.username}</strong></span>
              </>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {ticket.description}
          </div>
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="flex gap-3 mt-4 flex-wrap">
              {ticket.attachments.map((url, i) => (
                <a key={i} href={`${API_ORIGIN}${url}`} target="_blank" rel="noopener noreferrer"
                  className="block w-24 h-24 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:opacity-80 transition-opacity">
                  <img src={`${API_ORIGIN}${url}`} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('ticketDetail.conversation', { count: replies.length })}</h3>

          {replies.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500 text-sm transition-colors">
              {t('ticketDetail.noReplies')}
            </div>
          ) : (
            replies.map(reply => (
              <div key={reply.id} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 transition-colors ${reply.isStaff ? 'border-l-4 border-l-[#50ba4b]' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${reply.isStaff ? 'bg-green-100 text-[#50ba4b] dark:bg-green-900/30 dark:text-[#50ba4b]' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {(reply.User?.username || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{reply.User?.displayName || reply.User?.username}</span>
                  {reply.isStaff && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-[#50ba4b] dark:bg-green-900/30 dark:text-[#50ba4b] rounded text-[10px] font-semibold uppercase">{t('ticketDetail.staff')}</span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(reply.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ml-9">{reply.content}</div>
                {reply.attachments && reply.attachments.length > 0 && (
                  <div className="flex gap-2 mt-2 ml-9 flex-wrap">
                    {reply.attachments.map((url, i) => (
                      <a key={i} href={`${API_ORIGIN}${url}`} target="_blank" rel="noopener noreferrer"
                        className="block w-20 h-20 rounded border border-gray-200 dark:border-gray-700 overflow-hidden hover:opacity-80 transition-opacity">
                        <img src={`${API_ORIGIN}${url}`} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Reply form */}
        {ticket.status !== 'closed' ? (
          <form onSubmit={handleReply} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 transition-colors">
            <textarea value={newReply} onChange={(e) => setNewReply(e.target.value)}
              placeholder={t('ticketDetail.replyPlaceholder')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" rows="4" required />
            <div className="mb-3">
              <input type="file" accept="image/*" multiple
                onChange={(e) => setReplyAttachments(Array.from(e.target.files).slice(0, 3))}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-1.5 file:px-3
                file:rounded file:border-0 file:text-xs file:font-medium
                file:bg-green-50 file:text-[#45a340] hover:file:bg-green-100 dark:file:bg-green-900/30 dark:file:text-[#50ba4b]" />
              {replyAttachments.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {replyAttachments.map((file, i) => (
                    <div key={i} className="w-12 h-12 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="bg-[#50ba4b] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#45a340]">
              {t('ticketDetail.sendReply')}
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors">
            {t('ticketDetail.ticketClosed')}
          </div>
        )}
      </div>
    </div>
  );
}
