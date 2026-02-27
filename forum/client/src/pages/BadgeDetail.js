import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { BADGE_BY_SLUG } from '../utils/badgeData';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

const AVATAR_COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16',
];

function getAvatarColor(username) {
  return AVATAR_COLORS[(username || '').charCodeAt(0) % AVATAR_COLORS.length];
}

function getAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `${API_ORIGIN}${avatar}`;
}

function UserAvatar({ user, size = 40 }) {
  const name = user.displayName || user.username || '?';
  const url = getAvatarUrl(user.avatar);
  if (url) {
    return (
      <img src={url} alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <div
      style={{ width: size, height: size, backgroundColor: getAvatarColor(user.username), fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
    >
      {name[0].toUpperCase()}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}w`;
  return `${Math.floor(diff / (86400 * 30))}mo`;
}

// Aqara-style user profile popup card
function UserProfilePopup({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef(null);

  useEffect(() => {
    api.get(`/users/${userId}/card`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const displayedBadges = data?.badges
    ? data.badges.slice(0, 3).map(slug => BADGE_BY_SLUG[slug]).filter(Boolean)
    : [];
  const extraBadgeCount = data?.badges ? Math.max(0, data.badges.length - 3) : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Card */}
      <div
        ref={cardRef}
        onClick={e => e.stopPropagation()}
        className="relative w-[390px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="w-6 h-6 border-2 border-[#50ba4b] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="p-6 text-center text-gray-400 text-sm">Failed to load profile.</div>
        ) : (
          <div className="p-5">
            {/* Header: avatar + name */}
            <div className="flex items-center gap-3 mb-4 pr-6">
              <Link to={`/profile/${data.id}`} onClick={onClose}>
                <UserAvatar user={data} size={72} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/profile/${data.id}`}
                  onClick={onClose}
                  className="text-[17px] font-bold text-gray-900 dark:text-gray-100 hover:text-[#50ba4b] transition-colors leading-tight block truncate"
                >
                  {data.displayName || data.username}
                </Link>
                <p className="text-[13px] text-gray-400 dark:text-gray-500 truncate">@{data.username}</p>
              </div>
            </div>

            {/* Bio */}
            {data.bio && (
              <p className="text-[13.5px] text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-4">
                {data.bio}
              </p>
            )}

            {/* Featured Topic */}
            {data.latestPost && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                  Featured Topic
                </p>
                <Link
                  to={`/posts/${data.latestPost.id}`}
                  onClick={onClose}
                  className="text-[13px] text-[#3b82f6] hover:underline leading-snug line-clamp-2 block"
                >
                  {data.latestPost.title}
                </Link>
              </div>
            )}

            {/* Location */}
            {data.location && (
              <div className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400 mb-3">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{data.location}</span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-1 text-[12px] text-gray-400 dark:text-gray-500 mb-4 flex-wrap">
              {data.latestPost && (
                <>
                  <span>Posted <span className="text-gray-600 dark:text-gray-400">{formatDate(data.latestPost.createdAt)}</span></span>
                  <span className="mx-1">·</span>
                </>
              )}
              <span>Joined <span className="text-gray-600 dark:text-gray-400">{formatDate(data.createdAt)}</span></span>
              {data.reputation > 0 && (
                <>
                  <span className="mx-1">·</span>
                  <span>Rep <span className="text-gray-600 dark:text-gray-400">{data.reputation}</span></span>
                </>
              )}
            </div>

            {/* Badges */}
            {data.badges && data.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-700">
                {displayedBadges.map(badge => (
                  <Link
                    key={badge.slug}
                    to={`/badges/${badge.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[12px] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 ${badge.iconColor || badge.color || 'text-amber-500'}`}
                      fill={badge.iconFill ? 'currentColor' : 'none'}
                      stroke={badge.iconFill ? 'none' : 'currentColor'}
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={badge.iconPath} />
                    </svg>
                    {badge.name}
                  </Link>
                ))}
                {extraBadgeCount > 0 && (
                  <Link
                    to={`/profile/${data.id}`}
                    onClick={onClose}
                    className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[12px] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    +{extraBadgeCount} More
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
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
  const [banner, setBanner] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(null);
  const [popupUserId, setPopupUserId] = useState(null);

  const sentinelRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!badge) navigate('/badges', { replace: true });
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
        const [catRes, logoRes, bannerRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/settings/logo').catch(() => ({ data: {} })),
          api.get('/settings/banner').catch(() => ({ data: {} })),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
        if (logoRes.data?.logoUrl) setLogoUrl(`${API_ORIGIN}${logoRes.data.logoUrl}`);
        if (bannerRes.data?.bannerEnabled) setBanner(bannerRes.data);
      } catch (_) {}
    };
    fetchSidebar();
  }, []);

  const fetchPage = useCallback(async (pageNum) => {
    if (loadingRef.current || !badge) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data } = await api.get(`/badges/${slug}/users`, { params: { page: pageNum, limit: 18 } });
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
      {/* HEADER */}
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
        {/* SIDEBAR */}
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
              <Link to="/badges"
                className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] font-medium bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                <svg className="w-[16px] h-[16px] text-[#50ba4b]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {t('forum.sidebar.badges')}
              </Link>
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
                      {t('forum.sidebar.about')}
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

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

            {categories.length > 0 && (
              <div className="mb-2">
                <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.categories')}</h4>
                <ul className="space-y-[1px]">
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <Link to={`/forum?categoryId=${cat.id}`} onClick={() => setSidebarOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                        <span className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0" style={{ backgroundColor: cat.color || '#6B7280' }} />
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* MAIN */}
        <main className="flex-1 min-w-0 bg-[#eee] dark:bg-gray-900 transition-colors">

          {/* Banner */}
          {banner && (
            <div className="mx-4 lg:mx-5 mt-4 rounded-lg overflow-hidden relative" style={{ minHeight: '140px' }}>
              {banner.bannerImageUrl ? (
                <img src={`${API_ORIGIN}${banner.bannerImageUrl}`} alt="Forum banner"
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-500" />
              )}
              <div className="relative z-10 flex items-center p-5 md:p-6 min-h-[140px]">
                <div className="max-w-[60%]">
                  {banner.bannerTitle && (
                    <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg leading-tight">{banner.bannerTitle}</h2>
                  )}
                  {banner.bannerSubtitle && (
                    <p className="text-sm text-white/80 mt-2 drop-shadow">{banner.bannerSubtitle}</p>
                  )}
                </div>
              </div>
              {banner.bannerImageUrl && <div className="absolute inset-0 bg-black/30" />}
            </div>
          )}

          <div className="px-4 lg:px-5 py-5">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400 mb-5">
              <Link to="/badges" className="hover:text-[#50ba4b] transition-colors font-medium" style={{ color: '#3b82f6' }}>
                Badges
              </Link>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{badge.name}</span>
            </nav>

            {/* Badge Header Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6 flex items-start gap-4 max-w-lg">
              <div className={`flex-shrink-0 w-[60px] h-[60px] rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${resolvedColor}`}>
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
                <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1">{badge.name}</h1>
                {badge.desc && (
                  <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">{badge.desc}</p>
                )}
                {total !== null && (
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-2">
                    {total} awarded
                  </p>
                )}
              </div>
            </div>

            {/* Users Grid — Aqara style: 3 columns, avatar + name + date */}
            {users.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                {users.map((u) => {
                  const name = u.displayName || u.username || '?';
                  return (
                    <button
                      key={`${u.id}-${u.grantedAt}`}
                      onClick={() => setPopupUserId(u.id)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left w-full group"
                    >
                      <UserAvatar user={u} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-[#50ba4b] transition-colors">
                          {name}
                        </p>
                        <p className="text-[12px] text-gray-400 dark:text-gray-500">
                          Granted {formatDate(u.grantedAt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
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

            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#50ba4b] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div ref={sentinelRef} className="h-4" />
          </div>
        </main>
      </div>

      {/* User Profile Popup */}
      {popupUserId && (
        <UserProfilePopup
          userId={popupUserId}
          onClose={() => setPopupUserId(null)}
        />
      )}
    </div>
  );
}
