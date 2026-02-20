import React, { useState, useEffect, useRef } from 'react';
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [banner, setBanner] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const moreDropdownRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutRes, catRes, prodRes, logoRes, bannerRes] = await Promise.all([
          api.get('/settings/about'),
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/products').catch(() => ({ data: [] })),
          api.get('/settings/logo').catch(() => ({ data: {} })),
          api.get('/settings/banner').catch(() => ({ data: {} })),
        ]);
        setStats(aboutRes.data);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.products || []);
        if (logoRes.data?.logoUrl) setLogoUrl(`${API_ORIGIN}${logoRes.data.logoUrl}`);
        if (bannerRes.data?.bannerEnabled) setBanner(bannerRes.data);
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
    if (!dateStr) return '';
    const now = new Date();
    const created = new Date(dateStr);
    const diffMs = now - created;
    const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return 'less than a month ago';
    if (months === 1) return '1 month ago';
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 1 && remainingMonths === 0) return '1 year ago';
    if (remainingMonths === 0) return `${years} years ago`;
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} ago`;
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
              {/* About - highlighted as active */}
              <Link to="/about"
                className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] font-medium bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                <svg className="w-[16px] h-[16px] text-[#50ba4b]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('forum.sidebar.about')}
              </Link>
              {/* More - popup dropdown */}
              <div className="relative" ref={moreDropdownRef}>
                <button onClick={() => setMoreOpen(!moreOpen)}
                  className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                  </svg>
                  {t('forum.sidebar.more')}
                </button>
                {moreOpen && (
                  <div className="absolute left-0 top-full mt-1 w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 py-1">
                    <Link to="/about" onClick={() => { setMoreOpen(false); setSidebarOpen(false); }}
                      className="flex items-center gap-2.5 px-4 py-[8px] text-[13px] text-[#50ba4b] font-medium bg-green-50 dark:bg-green-900/20 transition-colors">
                      <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('forum.sidebar.about')}
                    </Link>
                    <Link to="/badges" onClick={() => { setMoreOpen(false); setSidebarOpen(false); }}
                      className="flex items-center gap-2.5 px-4 py-[8px] text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <svg className="w-[15px] h-[15px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      {t('forum.sidebar.badges')}
                    </Link>
                  </div>
                )}
              </div>
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
              <a href="#" onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c0 1.657-4.03 3-9 3s-9-1.343-9-3m18 0c0-1.657-4.03-3-9-3s-9 1.343-9 3m9-9v18" />
                </svg>
                {t('forum.sidebar.exploreMore')}
              </a>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* DOCUMENTATION */}
            <div className="mb-2">
              <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.documentation')}</h4>
              <a href="#" onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('forum.sidebar.documentation')}
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
                  <li>
                    <Link to="/forum"
                      className="flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] text-gray-400 dark:text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 w-full transition-colors">
                      {t('forum.sidebar.allCategories')}
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* TAGS */}
            <div className="mb-2">
              <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.tags')}</h4>
            </div>

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
        <main className="flex-1 min-w-0 bg-[#eee] dark:bg-gray-900 transition-colors">

          {/* ===== BANNER (same as forum page) ===== */}
          {banner && (
            <div className="mx-4 lg:mx-5 mt-4 rounded-lg overflow-hidden relative" style={{ minHeight: '140px' }}>
              {banner.bannerImageUrl ? (
                <img src={`${API_ORIGIN}${banner.bannerImageUrl}`} alt="Forum banner"
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-500" />
              )}
              <div className="relative z-10 flex items-center justify-between p-5 md:p-6 min-h-[140px]">
                <div className="max-w-[60%]">
                  {banner.bannerTitle && (
                    <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg leading-tight">
                      {banner.bannerTitle}
                    </h2>
                  )}
                  {banner.bannerSubtitle && (
                    <p className="text-sm text-white/80 mt-2 drop-shadow">{banner.bannerSubtitle}</p>
                  )}
                </div>
              </div>
              {banner.bannerImageUrl && (
                <div className="absolute inset-0 bg-black/30" />
              )}
            </div>
          )}

          {/* ===== TAB NAV ===== */}
          <div className="mx-4 lg:mx-5 mt-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center gap-6">
              <span className="text-[13px] font-semibold text-[#50ba4b] border-b-2 border-[#50ba4b] pb-2 cursor-default">
                {t('about.tabs.about')}
              </span>
              <span className="text-[13px] text-gray-400 dark:text-gray-500 pb-2 cursor-default">
                {t('about.tabs.faq')}
              </span>
              <span className="text-[13px] text-gray-400 dark:text-gray-500 pb-2 cursor-default hidden sm:block">
                {t('about.tabs.terms')}
              </span>
              <span className="text-[13px] text-gray-400 dark:text-gray-500 pb-2 cursor-default hidden sm:block">
                {t('about.tabs.privacy')}
              </span>
              <span className="text-[13px] text-gray-400 dark:text-gray-500 pb-2 cursor-default hidden md:block">
                {t('about.tabs.conditions')}
              </span>
            </div>
          </div>

          {/* ===== ABOUT CONTENT ===== */}
          {loading ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('common.loading')}</div>
          ) : stats ? (
            <div className="mx-4 lg:mx-5 mt-6">
              {/* Forum Name */}
              <h2 className="text-[17px] font-bold text-gray-900 dark:text-gray-100 mb-1">
                {stats.aboutForumName || t('about.forumName')}
              </h2>
              {stats.aboutForumDescription && (
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">{stats.aboutForumDescription}</p>
              )}

              {/* Stats Row: Members, Admins, Moderator, Created */}
              <div className="flex items-center gap-6 flex-wrap text-[13px] text-gray-600 dark:text-gray-400 mb-8">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{formatNumber(stats.totalMembers)}</span>
                  <span>{t('about.members')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{stats.admins.length}</span>
                  <span>{t('about.admins')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{stats.moderators.length}</span>
                  <span>{t('about.moderators')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{t('about.created')}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(stats.forumCreatedAt)}</span>
                </div>
              </div>

              {/* Two column layout */}
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column */}
                <div className="flex-1 min-w-0">
                  {/* Our Admins */}
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-4">{t('about.ourAdmins')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                    {stats.admins.map(admin => (
                      <Link key={admin.id} to={`/profile/${admin.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-[#50ba4b] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(admin.displayName || admin.username || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{admin.displayName || admin.username}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">Admin</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Our Moderators */}
                  {stats.moderators.length > 0 && (
                    <>
                      <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-4">{t('about.ourModerators')}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                        {stats.moderators.map(mod => (
                          <Link key={mod.id} to={`/profile/${mod.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {(mod.displayName || mod.username || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{mod.displayName || mod.username}</p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">Moderator</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column */}
                <div className="lg:w-[280px] flex-shrink-0 space-y-6">
                  {/* Contact Us */}
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-3">{t('about.contactUs')}</h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                      {stats.aboutContactText || t('about.contactDescription')}
                    </p>
                    {stats.aboutContactEmail ? (
                      <a href={`mailto:${stats.aboutContactEmail}`} className="text-[13px] text-[#50ba4b] hover:underline font-medium">
                        {stats.aboutContactEmail}
                      </a>
                    ) : (
                      <Link to="/support" className="text-[13px] text-[#50ba4b] hover:underline font-medium">
                        {t('about.openTicket')} &rarr;
                      </Link>
                    )}
                  </div>

                  {/* Site Activity */}
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-4">{t('about.siteActivity')}</h3>
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3">
                        <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <div>
                          <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.postsThisWeek)} {t('about.topicsLabel')}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('about.inTheLast7Days')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <div>
                          <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.postsToday)} {t('about.postsLabel')}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('about.today')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.newMembersThisWeek)} {t('about.signUpsLabel')}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('about.inTheLast7Days')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <div>
                          <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalComments)} {t('about.repliesLabel')}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('about.allTime')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('about.loadFailed')}</div>
          )}
        </main>
      </div>
    </div>
  );
}
