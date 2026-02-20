import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

export default function About() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutRes, catRes, prodRes, logoRes] = await Promise.all([
          api.get('/settings/about'),
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/products').catch(() => ({ data: [] })),
          api.get('/settings/logo').catch(() => ({ data: {} })),
        ]);
        setStats(aboutRes.data);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.products || []);
        if (logoRes.data?.logoUrl) setLogoUrl(`${API_ORIGIN}${logoRes.data.logoUrl}`);
      } catch (err) {
        console.error('Failed to load about data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => { logout(); };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-[#eee] dark:bg-gray-900 transition-colors duration-200">
      {/* ===== HEADER (same as Forum) ===== */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-[1200px] mx-auto h-[52px] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-1.5">
              {logoUrl ? (
                <img src={logoUrl} alt="Intavalto" className="h-8 object-contain" />
              ) : (
                <span className="text-[18px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">Intavalto</span>
              )}
              <span className="text-[18px] font-light text-gray-500 dark:text-gray-400">Forum</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              {darkMode ? (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <LanguageSelector />
            {user ? (
              <div className="flex items-center gap-2 ml-1">
                <Link to={`/profile/${user.id}`}
                  className="w-8 h-8 rounded-full bg-[#50ba4b] flex items-center justify-center text-white text-xs font-bold"
                  title={user.displayName || user.username}>
                  {(user.displayName || user.username || '?')[0].toUpperCase()}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-xs text-[#50ba4b] hover:underline hidden sm:block">Admin</Link>
                )}
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hidden sm:block">{t('common.logout')}</button>
              </div>
            ) : (
              <Link to="/login"
                className="ml-2 bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 px-3 py-[4px] rounded-full text-[11px] font-medium hover:bg-[#50ba4b] hover:text-white hover:border-[#50ba4b] transition-colors">
                {t('common.logIn')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto flex min-h-[calc(100vh-52px)]">
        {/* ===== SIDEBAR (same as Forum) ===== */}
        <aside className={`
          w-[220px] flex-shrink-0 bg-[#f7f7f7] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors
          ${sidebarOpen
            ? 'fixed inset-0 top-[52px] z-30 w-[260px] bg-white dark:bg-gray-800 shadow-xl overflow-y-auto lg:relative lg:top-0 lg:shadow-none lg:w-[220px] lg:bg-[#f7f7f7] lg:dark:bg-gray-800'
            : 'hidden lg:block'
          }
        `}>
          <div className="py-3 px-2">
            <nav className="mb-1">
              <Link to="/forum" onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {t('forum.sidebar.topics')}
              </Link>
              <button onClick={() => setMoreOpen(!moreOpen)}
                className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] font-medium bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                </svg>
                {t('forum.sidebar.more')}
                <svg className={`w-3 h-3 ml-auto text-gray-400 transition-transform ${moreOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {moreOpen && (
                <>
                  <Link to="/about" onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-2.5 pl-8 pr-3 py-[6px] rounded text-[13px] font-medium bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                    {t('forum.sidebar.about')}
                  </Link>
                  <Link to="/badges" onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-2.5 pl-8 pr-3 py-[6px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                    {t('forum.sidebar.badges')}
                  </Link>
                </>
              )}
            </nav>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* RESOURCES */}
            <div className="mb-2">
              <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.resources')}</h4>
              <Link to="/support" onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t('forum.sidebar.support')}
              </Link>
              <a href="https://intavalto.com/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {t('forum.sidebar.officialWeb')}
              </a>
              <a href="https://intavaltoretail.com/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {t('forum.sidebar.shop')}
              </a>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* CATEGORIES */}
            {categories.length > 0 && (
              <div className="mb-2">
                <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.categories')}</h4>
                <ul className="space-y-[1px]">
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <Link to="/forum" className="w-full flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                        <span className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0" style={{ backgroundColor: cat.color || '#6B7280' }} />
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* PRODUCTS */}
            {products.length > 0 && (
              <div className="mb-2">
                <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.products')}</h4>
                <ul className="space-y-[1px]">
                  {products.map(prod => (
                    <li key={prod.id}>
                      <Link to="/forum" className="w-full flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                        <span className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0" style={{ backgroundColor: prod.color || '#6B7280' }} />
                        {prod.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile user nav */}
            {user && (
              <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 mx-2 space-y-[1px]">
                <Link to={`/profile/${user.id}`} onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 px-3 py-[7px] text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 rounded">
                  <div className="w-5 h-5 rounded-full bg-[#50ba4b] flex items-center justify-center text-white text-[10px] font-bold">
                    {(user.displayName || user.username || '?')[0].toUpperCase()}
                  </div>
                  {user.displayName || user.username}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setSidebarOpen(false)}
                    className="block px-3 py-[7px] text-[13px] text-[#50ba4b] hover:bg-gray-200/50 dark:hover:bg-gray-700 rounded">{t('forum.sidebar.adminPanel')}</Link>
                )}
                <button onClick={() => { handleLogout(); setSidebarOpen(false); }}
                  className="block w-full text-left px-3 py-[7px] text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700 rounded">{t('common.logout')}</button>
              </div>
            )}
          </div>
        </aside>

        {/* Sidebar overlay mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 min-w-0 py-6 px-6">
          {loading ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('common.loading')}</div>
          ) : stats ? (
            <>
              {/* Forum Name & Description */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('about.forumName')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('about.forumDescription')}</p>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mb-8 pb-8 border-b border-gray-300 dark:border-gray-700">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalMembers)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.members')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.admins.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.admins')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.moderators.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.moderators')}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDate(stats.forumCreatedAt)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.created')}</p>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column */}
                <div className="flex-1 min-w-0">
                  {/* Our Admins */}
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('about.ourAdmins')}</h3>
                  <div className="space-y-3 mb-8">
                    {stats.admins.map(admin => (
                      <Link key={admin.id} to={`/profile/${admin.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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

                  {/* Our Moderators */}
                  {stats.moderators.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('about.ourModerators')}</h3>
                      <div className="space-y-3 mb-8">
                        {stats.moderators.map(mod => (
                          <Link key={mod.id} to={`/profile/${mod.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                    </>
                  )}

                  {/* Contact Us */}
                  <div className="border-t border-gray-300 dark:border-gray-700 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('about.contactUs')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('about.contactDescription')}</p>
                    <Link to="/support" className="inline-flex items-center gap-2 text-sm text-[#50ba4b] hover:underline font-medium">
                      {t('about.openTicket')} &rarr;
                    </Link>
                  </div>
                </div>

                {/* Right Column: Site Activity */}
                <div className="lg:w-[240px] flex-shrink-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('about.siteActivity')}</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.postsThisWeek)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.topicsThisWeek')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.postsToday)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.postsToday')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.newMembersThisWeek)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.newMembersThisWeek')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalComments)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.totalReplies')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalPosts)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.totalTopics')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('about.loadFailed')}</div>
          )}
        </main>
      </div>
    </div>
  );
}
