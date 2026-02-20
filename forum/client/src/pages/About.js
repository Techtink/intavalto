import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

export default function About() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/settings/about');
        setStats(data);
      } catch (err) {
        console.error('Failed to load about stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/forum" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">&larr; {t('forum.title')}</Link>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('about.title')}</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('common.loading')}</div>
        ) : stats ? (
          <>
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-6 transition-colors">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('about.forumName')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('about.forumDescription')}</p>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('about.members')}</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalMembers)}</span>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('about.admins')}</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.admins.length}</span>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('about.moderators')}</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.moderators.length}</span>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('about.created')}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDate(stats.forumCreatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Admins & Moderators */}
              <div className="lg:col-span-2 space-y-6">
                {/* Our Admins */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('about.ourAdmins')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {stats.admins.map(admin => (
                      <Link key={admin.id} to={`/profile/${admin.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#50ba4b] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(admin.displayName || admin.username || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{admin.displayName || admin.username}</p>
                          <p className="text-xs text-[#50ba4b]">Admin</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Our Moderators */}
                {stats.moderators.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('about.ourModerators')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {stats.moderators.map(mod => (
                        <Link key={mod.id} to={`/profile/${mod.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(mod.displayName || mod.username || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{mod.displayName || mod.username}</p>
                            <p className="text-xs text-purple-500">Moderator</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Us */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('about.contactUs')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('about.contactDescription')}</p>
                  <Link to="/support" className="inline-flex items-center gap-2 bg-[#50ba4b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#45a340] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {t('about.openTicket')}
                  </Link>
                </div>
              </div>

              {/* Right: Site Activity */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('about.siteActivity')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.postsThisWeek)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.topicsThisWeek')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.postsToday)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.postsToday')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.newMembersThisWeek)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.newMembersThisWeek')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalComments)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.totalReplies')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalPosts)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.totalTopics')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('about.loadFailed')}</div>
        )}
      </div>
    </div>
  );
}
