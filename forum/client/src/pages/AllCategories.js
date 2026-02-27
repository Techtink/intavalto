import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import LanguageSelector from '../components/LanguageSelector';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

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

const AVATAR_COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16',
];

function UserAvatar({ user, size = 32 }) {
  if (!user) return null;
  const letter = (user.username || '?')[0].toUpperCase();
  const colorIdx = (user.username || '').charCodeAt(0) % AVATAR_COLORS.length;
  if (user.avatar) {
    return (
      <img
        src={user.avatar.startsWith('http') ? user.avatar : `${API_ORIGIN}${user.avatar}`}
        alt={user.username}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, backgroundColor: AVATAR_COLORS[colorIdx], fontSize: size * 0.4 }}
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
    >
      {letter}
    </div>
  );
}

export default function AllCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
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
        const [catRes, logoRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/settings/logo').catch(() => ({ data: {} })),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        if (logoRes.data?.logoUrl) setLogoUrl(`${API_ORIGIN}${logoRes.data.logoUrl}`);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => { logout(); };

  return (
    <div className="min-h-screen bg-[#f0f0f0] dark:bg-gray-900 transition-colors duration-200">
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
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hidden sm:block">Logout</button>
              </div>
            ) : (
              <Link to="/login"
                className="ml-2 bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 px-3 py-[4px] rounded-full text-[11px] font-medium hover:bg-[#50ba4b] hover:text-white hover:border-[#50ba4b] transition-colors">
                Log In
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
                Topics
              </Link>
              <div className="relative" ref={moreDropdownRef}>
                <button onClick={() => setMoreOpen(!moreOpen)}
                  className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                  </svg>
                  More
                </button>
                {moreOpen && (
                  <div className="absolute left-0 top-full mt-1 w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 py-1">
                    <Link to="/about" onClick={() => { setMoreOpen(false); setSidebarOpen(false); }}
                      className="flex items-center gap-2.5 px-4 py-[8px] text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      About
                    </Link>
                    <Link to="/badges" onClick={() => { setMoreOpen(false); setSidebarOpen(false); }}
                      className="flex items-center gap-2.5 px-4 py-[8px] text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Badges
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* RESOURCES */}
            <div className="mb-2">
              <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">Resources</h4>
              <Link to="/support" onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Support
              </Link>
              <a href="https://intavalto.com/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Official Website
              </a>
              <a href="https://intavaltoretail.com/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Shop
              </a>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* CATEGORIES */}
            <div className="mb-2">
              <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">Categories</h4>
              <ul className="space-y-[1px]">
                {categories.map(cat => (
                  <li key={cat.id}>
                    <Link to={`/forum?categoryId=${cat.id}`}
                      className="w-full flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                      <span className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0" style={{ backgroundColor: cat.color || '#6B7280' }} />
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/categories"
                    className="flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium w-full transition-colors">
                    All Categories
                  </Link>
                </li>
              </ul>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* TAGS */}
            <div className="mb-2">
              <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">Tags</h4>
              <Link to="/tags"
                className="flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] text-gray-400 dark:text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 w-full transition-colors">
                All Tags
              </Link>
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
                    className="block px-3 py-[7px] text-[13px] text-[#50ba4b] hover:bg-gray-200/50 dark:hover:bg-gray-700 rounded">Admin Panel</Link>
                )}
                <button onClick={() => { handleLogout(); setSidebarOpen(false); }}
                  className="block w-full text-left px-3 py-[7px] text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700 rounded">Logout</button>
              </div>
            )}
          </div>
        </aside>

        {/* Sidebar overlay mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 bg-[#f0f0f0] dark:bg-gray-900 transition-colors">
          <div className="mx-4 lg:mx-6 mt-5 pb-10">

            {/* Top nav tabs — Aqara-style */}
            <div className="flex items-center gap-1 mb-4 flex-wrap">
              {/* Pill dropdowns */}
              <Link to="/categories"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12.5px] font-medium bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 leading-none">
                categories
                <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <Link to="/tags"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12.5px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 leading-none transition-colors">
                tags
                <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>

              {/* Divider */}
              <div className="h-4 border-l border-gray-300 dark:border-gray-600 mx-1 hidden sm:block" />

              {/* Content tabs */}
              <Link to="/forum"
                className="px-3 py-1 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded hidden sm:block">
                Latest
              </Link>
              <Link to="/forum?sort=featured"
                className="px-3 py-1 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded hidden sm:block">
                ⭐ Featured
              </Link>
              <Link to="/forum?sort=popular"
                className="px-3 py-1 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded hidden sm:block">
                🔥 Hot
              </Link>
              <span className="px-3 py-1 text-[13px] font-medium text-gray-900 dark:text-gray-100 border-b-2 border-gray-800 dark:border-gray-200 hidden sm:block">
                Categories
              </span>
            </div>

            {/* Categories — single table, 3 columns */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#50ba4b] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                No categories yet.
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">

                {/* Header row */}
                <div className="flex border-b border-gray-100 dark:border-gray-700 px-4 py-2">
                  <div className="flex-1 text-[11.5px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Category</div>
                  <div className="w-[90px] text-[11.5px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-center hidden sm:block">Topics</div>
                  <div className="w-[280px] xl:w-[320px] text-[11.5px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pl-5 hidden lg:block border-l border-gray-100 dark:border-gray-700 ml-4">Latest</div>
                </div>

                {/* Data rows */}
                {categories.map((cat, i) => (
                  <div
                    key={cat.id}
                    className={`flex items-start px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                      i < categories.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/60' : ''
                    }`}
                  >
                    {/* Category */}
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-[11px] h-[11px] rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color || '#6B7280' }} />
                        <Link
                          to={`/forum?categoryId=${cat.id}`}
                          className="font-semibold text-[14px] text-gray-900 dark:text-gray-100 hover:text-[#50ba4b] dark:hover:text-[#50ba4b] transition-colors leading-tight"
                        >
                          {cat.name}
                        </Link>
                      </div>
                      {cat.description && (
                        <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-snug ml-[19px] line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Topics */}
                    <div className="w-[90px] text-center hidden sm:block pt-0.5 flex-shrink-0">
                      <span className="text-[13.5px] font-semibold text-gray-700 dark:text-gray-200">{cat.postsThisWeek}</span>
                      <span className="text-[12px] text-gray-400 dark:text-gray-500"> / week</span>
                    </div>

                    {/* Latest */}
                    <div className="w-[280px] xl:w-[320px] flex-shrink-0 hidden lg:flex items-start gap-2.5 pl-5 border-l border-gray-100 dark:border-gray-700 ml-4">
                      {cat.latestPost ? (
                        <>
                          <UserAvatar user={cat.latestPost.author} size={30} />
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/posts/${cat.latestPost.id}`}
                              className="text-[13px] text-gray-800 dark:text-gray-200 hover:text-[#50ba4b] dark:hover:text-[#50ba4b] font-medium leading-snug line-clamp-2 transition-colors block"
                            >
                              {cat.latestPost.title}
                            </Link>
                            {cat.latestPost.tags && cat.latestPost.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {cat.latestPost.tags.slice(0, 2).map(tag => (
                                  <Link
                                    key={tag}
                                    to={`/forum?tag=${encodeURIComponent(tag)}`}
                                    className="inline-block px-1.5 py-0.5 text-[10.5px] rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    {tag}
                                  </Link>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11.5px] text-gray-500 dark:text-gray-400">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{cat.latestPost.replyCount}</span>
                                <span className="ml-0.5">replies</span>
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">·</span>
                              <span className="text-[11.5px] text-gray-400 dark:text-gray-500">{timeAgo(cat.latestPost.createdAt)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-[12px] text-gray-300 dark:text-gray-600 italic pt-1">No posts yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
