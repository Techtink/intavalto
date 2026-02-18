import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useTranslation } from '../../i18n';

export default function ContentModeration() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUnapprovedPosts = async () => {
      try {
        const { data } = await api.get('/admin/posts/unapproved');
        setPosts(data);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnapprovedPosts();
  }, []);

  const handleApprove = async (postId) => {
    setError('');
    try {
      await api.post(`/admin/posts/${postId}/approve`);
      setPosts(posts.filter(p => p.id !== postId));
      setSuccess('Post approved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve post');
    }
  };

  const handleReject = async (postId) => {
    if (!window.confirm(t('admin.moderation.rejectConfirm'))) return;
    setError('');
    try {
      await api.post(`/admin/posts/${postId}/reject`);
      setPosts(posts.filter(p => p.id !== postId));
      setSuccess('Post rejected and deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject post');
    }
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('admin.moderation.title')}</h1>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{success}</div>}

      {posts.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-6 rounded-lg text-center">
          <p className="text-lg font-medium">{t('admin.moderation.allCaughtUp')}</p>
          <p className="text-sm mt-1">{t('admin.moderation.noPosts')}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('admin.moderation.awaitingReview', { count: posts.length })}</p>
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 border-yellow-400 overflow-hidden transition-colors">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{post.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{t('admin.moderation.by')} <strong className="text-gray-700 dark:text-gray-300">{post.User?.username || 'Unknown'}</strong></span>
                        {post.User?.email && <span className="text-gray-400 dark:text-gray-500">({post.User.email})</span>}
                        <span>&middot;</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()} {new Date(post.createdAt).toLocaleTimeString()}</span>
                        {post.Product && (
                          <>
                            <span>&middot;</span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: (post.Product.color || '#6B7280') + '18', color: post.Product.color || '#6B7280' }}>
                              {post.Product.name}
                            </span>
                          </>
                        )}
                        {post.Category && (
                          <>
                            <span>&middot;</span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">{post.Category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-700 dark:text-gray-300 text-sm mb-4 whitespace-pre-wrap">
                    {expandedId === post.id ? post.content : (
                      <>
                        {post.content.substring(0, 300)}
                        {post.content.length > 300 && (
                          <button onClick={() => setExpandedId(post.id)} className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                            {t('admin.moderation.showMore')}
                          </button>
                        )}
                      </>
                    )}
                    {expandedId === post.id && post.content.length > 300 && (
                      <button onClick={() => setExpandedId(null)} className="text-blue-600 dark:text-blue-400 hover:underline ml-1 block mt-1">
                        {t('admin.moderation.showLess')}
                      </button>
                    )}
                  </div>

                  {post.tags?.length > 0 && (
                    <div className="flex gap-1 mb-4">
                      {post.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(post.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                      {t('admin.moderation.approve')}
                    </button>
                    <button onClick={() => handleReject(post.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                      {t('admin.moderation.rejectDelete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
