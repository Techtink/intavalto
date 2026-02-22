import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { BADGE_BY_SLUG } from '../utils/badgeData';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function UserCard({ user, API_ORIGIN }) {
  const name = user.displayName || user.username || '?';
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
      <div className="flex-shrink-0">
        {user.avatar ? (
          <img
            src={`${API_ORIGIN}${user.avatar}`}
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#50ba4b] flex items-center justify-center text-white text-sm font-bold">
            {name[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">@{user.username}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Granted {timeAgo(user.grantedAt)}</p>
      </div>
    </div>
  );
}

export default function BadgeDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const badge = BADGE_BY_SLUG[slug];

  const [categories, setCategories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(null);

  const sentinelRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!badge) {
      navigate('/badges', { replace: true });
    }
  }, [badge, navigate]);

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
    const fetchSidebar = async () => {
      try {
        const [catRes, logoRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/settings/logo').catch(() => ({ data: {} })),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
        if (logoRes.data?.logoUrl) setLogoUrl(`${API_ORIGIN}${logoRes.data.logoUrl}`);
      } catch (_) {}
    };
    fetchSidebar();
  }, []);

  const fetchPage = useCallback(async (pageNum) => {
    if (loadingRef.current || !badge) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data } = await api.get(`/badges/${slug}/users`, { params: { page: pageNum, limit: 15 } });
      setUsers((prev) => pageNum === 1 ? data.users : [...prev, ...data.users]);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(pageNum + 1);
    } catch (_) {
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [slug, badge]);

  // Initial load
  useEffect(() => {
    if (badge) {
      setUsers([]);
      setPage(1);
      setHasMore(true);
      setTotal(null);
      fetchPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          fetchPage(page);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, page, fetchPage]);

  if (!badge) return null;

  const resolvedColor = badge.iconColor || badge.color || 'text-amber-500';

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
                <button onClick={() => logout()} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hidden sm:block">{t('common.logout')}</button>
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
              {/* More */}
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
                <button onClick={() => { logout(); setSidebarOpen(false); }}
                  className="block w-full text-left px-3 py-[7px] text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700 rounded">{t('common.logout')}</button>
              </div>
            )}
          </div>
        </aside>

        {/* Sidebar overlay mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 min-w-0 bg-[#eee] dark:bg-gray-900 transition-colors">
          <div className="px-4 lg:px-5 py-5">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400 mb-4">
              <Link to="/badges" className="hover:text-[#50ba4b] transition-colors">Badges</Link>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{badge.name}</span>
            </nav>

            {/* Badge Header Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-5 flex items-start gap-4">
              <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${resolvedColor}`}>
                <svg
                  className="w-7 h-7"
                  fill={badge.iconFill ? 'currentColor' : 'none'}
                  stroke={badge.iconFill ? 'none' : 'currentColor'}
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={badge.iconPath} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{badge.name}</h1>
                {badge.desc && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{badge.desc}</p>
                )}
                {total !== null && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {total} {total === 1 ? 'user has' : 'users have'} been awarded this badge
                  </p>
                )}
              </div>
            </div>

            {/* Users Grid */}
            {users.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <UserCard key={`${u.id}-${u.grantedAt}`} user={u} API_ORIGIN={API_ORIGIN} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && users.length === 0 && (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <p className="text-sm">No users have earned this badge yet</p>
              </div>
            )}

            {/* Loading spinner */}
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#50ba4b] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />
          </div>
        </main>
      </div>
    </div>
  );
}
