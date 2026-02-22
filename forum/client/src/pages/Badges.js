import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

function BadgeCard({ name, desc, count, icon, iconColor, iconFill, grantColor, color }) {
  const resolvedColor = iconColor || color || 'text-amber-500';
  // For trust-level badges desc starts with "Granted " — highlight that word in green
  const renderDesc = () => {
    if (!desc) return null;
    if (grantColor && desc.startsWith('Granted')) {
      const rest = desc.slice('Granted'.length);
      return (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
          <span className="text-[#50ba4b] font-medium">Granted</span>{rest}
        </p>
      );
    }
    return <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{desc}</p>;
  };
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-3">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${resolvedColor}`}>
        <svg className="w-5 h-5" fill={iconFill ? 'currentColor' : 'none'} stroke={iconFill ? 'none' : 'currentColor'} strokeWidth={1.8} viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{name}</p>
        {renderDesc()}
        {count != null && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{count} awarded</p>
        )}
      </div>
    </div>
  );
}

export default function Badges() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
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
        const [catRes, logoRes, bannerRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/settings/logo').catch(() => ({ data: {} })),
          api.get('/settings/banner').catch(() => ({ data: {} })),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
        if (logoRes.data?.logoUrl) setLogoUrl(`${API_ORIGIN}${logoRes.data.logoUrl}`);
        if (bannerRes.data?.bannerEnabled) setBanner(bannerRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => { logout(); };

  return (
    <div className="min-h-screen bg-[#eee] dark:bg-gray-900 transition-colors duration-200">
      {/* ===== HEADER ===== */}
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
        {/* ===== SIDEBAR ===== */}
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
              {/* Badges - highlighted as active */}
              <Link to="/badges"
                className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] font-medium bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                <svg className="w-[16px] h-[16px] text-[#50ba4b]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {t('forum.sidebar.badges')}
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
                      className="flex items-center gap-2.5 px-4 py-[8px] text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <svg className="w-[15px] h-[15px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('forum.sidebar.about')}
                    </Link>
                    <Link to="/badges" onClick={() => { setMoreOpen(false); setSidebarOpen(false); }}
                      className="flex items-center gap-2.5 px-4 py-[8px] text-[13px] text-[#50ba4b] font-medium bg-green-50 dark:bg-green-900/20 transition-colors">
                      <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
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

          {/* ===== BANNER ===== */}
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

          {/* ===== BADGES CONTENT ===== */}
          <div className="px-4 lg:px-5 py-5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5">Badges</h1>

            {/* ── Getting Started ── */}
            <h2 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">Getting Started</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {[
                { name: 'Autobiographer', desc: 'Filled out profile information', count: '110', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
                { name: 'Certified', desc: 'Completed our new user tutorial', count: '196', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                { name: 'Editor', desc: 'First post edit', count: '771', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /> },
                { name: 'First Emoji', desc: 'Used an Emoji in a Post', count: '1.2k', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /> },
                { name: 'First Flag', desc: 'Flagged a post', count: '28', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /> },
                { name: 'First Like', desc: 'Liked a post', count: '5.0k', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
                { name: 'First Link', desc: 'Added a link to another topic', count: '132', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /> },
                { name: 'First Mention', desc: 'Mentioned a user in a post', count: '383', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" /> },
                { name: 'First Onebox', desc: 'Posted a link that was oneboxed', count: '167', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /> },
                { name: 'First Quote', desc: 'Quoted a post', count: '283', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /> },
                { name: 'First Share', desc: 'Shared a post', count: '264', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /> },
                { name: 'New User of the Month', desc: 'Outstanding contributions in their first month', count: '22', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-2.27.853m0 0H9.497" />, iconFill: true },
                { name: 'Read Guidelines', desc: 'Read the community guidelines', count: '130', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /> },
                { name: 'Reader', desc: 'Read every reply in a topic with more than 100 replies', count: '77', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> },
                { name: 'Licensed', desc: 'Completed our advanced user tutorial', count: '45', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /> },
                { name: 'Moderator', desc: '', count: '3', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />, iconFill: true },
              ].map((b) => <BadgeCard key={b.name} {...b} />)}
            </div>

            {/* ── Community ── */}
            <h2 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">Community</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {[
                { name: 'Appreciated', desc: 'Received 1 like on 20 posts', count: '108', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
                { name: 'Enthusiast', desc: 'Visited 10 consecutive days', count: '299', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> },
                { name: 'Nice Share', desc: 'Shared a post with 25 unique visitors', count: '43', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /> },
                { name: 'Out of Love', desc: 'Used 50 likes in a day', count: '149', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
                { name: 'Promoter', desc: 'Invited a user', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /> },
                { name: 'Solved!', desc: 'Have a reply marked as a Solution', count: '42', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, color: 'text-yellow-500' },
                { name: 'Thank You', desc: 'Has 20 liked posts and gave 10 likes', count: '79', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
                { name: 'Welcome', desc: 'Received a like', count: '5.8k', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
                { name: 'Aficionado', desc: 'Visited 100 consecutive days', count: '10', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> },
                { name: 'Anniversary', desc: 'Active member for a year, posted at least once', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0L3 18m15-12H6a3 3 0 00-3 3v6a3 3 0 003 3h12a3 3 0 003-3V9a3 3 0 00-3-3z" /> },
                { name: 'Campaigner', desc: 'Invited 3 basic users', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /> },
                { name: 'Gives Back', desc: 'Has 100 liked posts and gave 100 likes', count: '12', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />, color: 'text-gray-400 dark:text-gray-500' },
                { name: 'Good Share', desc: 'Shared a post with 300 unique visitors', count: '3', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /> },
                { name: 'Guidance Counsellor', desc: 'Have 10 replies marked as Solutions', count: '5', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, color: 'text-gray-400 dark:text-gray-500' },
                { name: 'Higher Love', desc: 'Used 50 likes in a day 5 times', count: '4', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />, color: 'text-gray-400 dark:text-gray-500' },
                { name: 'Respected', desc: 'Received 2 likes on 100 posts', count: '8', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />, color: 'text-gray-400 dark:text-gray-500' },
                { name: 'Admired', desc: 'Received 5 likes on 300 posts', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
                { name: 'Champion', desc: 'Invited 5 members', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /> },
                { name: 'Crazy in Love', desc: 'Used 50 likes in a day 20 times', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
                { name: 'Devotee', desc: 'Visited 365 consecutive days', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> },
                { name: 'Empathetic', desc: 'Has 500 liked posts and gave 1000 likes', count: '3', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> },
                { name: 'Great Share', desc: 'Shared a post with 1000 unique visitors', count: '2', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /> },
                { name: 'Know-it-All', desc: 'Have 50 replies marked as Solutions', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, color: 'text-gray-400 dark:text-gray-500' },
                { name: 'Solution Institution', desc: 'Have 150 replies marked as Solutions', count: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, color: 'text-gray-400 dark:text-gray-500' },
              ].map((b) => <BadgeCard key={b.name} {...b} />)}
            </div>

            {/* ── Posting ── */}
            <h2 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">Posting</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {[
                { name: 'Nice Reply', desc: 'Received 10 likes on a reply', count: '873', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /> },
                { name: 'Nice Topic', desc: 'Received 10 likes on a topic', count: '327', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> },
                { name: 'Popular Link', desc: 'Posted an external link with 50 clicks', count: '66', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /> },
                { name: 'Good Reply', desc: 'Received 25 likes on a reply', count: '300', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /> },
                { name: 'Good Topic', desc: 'Received 25 likes on a topic', count: '96', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> },
                { name: 'Hot Link', desc: 'Posted an external link with 300 clicks', count: '14', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /> },
                { name: 'Famous Link', desc: 'Posted an external link with 1000 clicks', count: '7', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /> },
                { name: 'Great Reply', desc: 'Received 50 likes on a reply', count: '150', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /> },
                { name: 'Great Topic', desc: 'Received 50 likes on a topic', count: '41', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> },
              ].map((b) => <BadgeCard key={b.name} {...b} />)}
            </div>

            {/* ── Trust Level ── */}
            <h2 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">Trust Level</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {[
                { name: 'Basic', desc: 'Granted all essential community functions', count: '4.3k', grantColor: true, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />, iconColor: 'text-amber-500' },
                { name: 'Member', desc: 'Granted invitations, group messaging, more likes', count: '568', grantColor: true, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />, iconColor: 'text-amber-500' },
                { name: 'Regular', desc: 'Granted recategorize, rename, followed links, wiki, more likes', count: '17', grantColor: true, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />, iconColor: 'text-gray-400 dark:text-gray-500' },
                { name: 'Leader', desc: 'Granted global edit, pin, close, archive, split and merge, more likes', count: '12', grantColor: true, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />, iconColor: 'text-amber-500' },
              ].map((b) => <BadgeCard key={b.name} {...b} />)}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
