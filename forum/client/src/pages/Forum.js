import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

export default function Forum() {
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', productId: '', categoryId: '', tags: '' });
  const [postError, setPostError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [banner, setBanner] = useState(null);
  const [cookieAccepted, setCookieAccepted] = useState(() => localStorage.getItem('cookieConsent') === 'true');
  const [cookieDismissing, setCookieDismissing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const catDropdownRef = useRef(null);
  const tagDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const fetchPosts = useCallback(async (loadPage = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      let data;
      if (isSearching && searchQuery.trim().length >= 2) {
        const res = await api.get(`/posts/search?q=${encodeURIComponent(searchQuery)}&page=${loadPage}&limit=15`);
        data = res.data;
      } else {
        const params = new URLSearchParams({ page: loadPage, limit: 15, sort });
        if (selectedProduct) params.append('productId', selectedProduct);
        if (selectedCategory) params.append('categoryId', selectedCategory);
        const res = await api.get(`/posts?${params}`);
        data = res.data;
      }
      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setTotalPages(data.pages);
      setHasMore(loadPage < data.pages);
      const tags = new Set();
      data.posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
      setAllTags(prev => {
        const merged = new Set([...prev, ...tags]);
        return Array.from(merged).sort();
      });
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedProduct, selectedCategory, sort, isSearching, searchQuery]);

  // Initial load and filter/search changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchPosts(next, true);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchPosts]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products');
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data } = await api.get('/settings/banner');
        if (data.bannerEnabled) setBanner(data);
      } catch (error) { /* non-critical */ }
    };
    fetchBanner();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) setShowCatDropdown(false);
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) setShowTagDropdown(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      setPosts([]);
      setPage(1);
      setHasMore(true);
      setShowSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setShowSearch(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleLike = async (e, postId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    try {
      const tags = newPost.tags ? newPost.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await api.post('/posts', { title: newPost.title, content: newPost.content, productId: newPost.productId, categoryId: newPost.categoryId || undefined, tags });
      setNewPost({ title: '', content: '', productId: '', categoryId: '', tags: '' });
      setShowNewPost(false);
      setPosts([]);
      setPage(1);
      setHasMore(true);
      fetchPosts(1, false);
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to create post';
      setPostError(msg);
    }
  };

  const selectProduct = (prodId) => {
    setSelectedProduct(prodId);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setIsSearching(false);
    setSidebarOpen(false);
  };

  const selectCategory = (catId) => {
    setSelectedCategory(catId);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setIsSearching(false);
    setShowCatDropdown(false);
    setSidebarOpen(false);
  };

  const selectTag = (tag) => {
    setSelectedTag(tag);
    setShowTagDropdown(false);
  };

  const acceptCookies = () => {
    setCookieDismissing(true);
    setTimeout(() => {
      localStorage.setItem('cookieConsent', 'true');
      setCookieAccepted(true);
    }, 350);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return t('forum.time.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('forum.time.minutes', { n: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('forum.time.hours', { n: hours });
    const days = Math.floor(hours / 24);
    if (days < 30) return t('forum.time.days', { n: days });
    const months = Math.floor(days / 30);
    return t('forum.time.months', { n: months });
  };

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  const filteredPosts = selectedTag
    ? posts.filter(p => (p.tags || []).includes(selectedTag))
    : posts;

  return (
    <div className="min-h-screen bg-[#eee] dark:bg-gray-900 transition-colors duration-200">
      {/* ===== HEADER ===== */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-[1200px] mx-auto h-[52px] flex items-center justify-between px-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-1.5">
              <span className="text-[18px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">Intavalto</span>
              <span className="text-[18px] font-light text-gray-500 dark:text-gray-400">Forum</span>
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 relative">
            {/* Search icon + dropdown */}
            <div className="relative" ref={searchRef}>
              <button onClick={() => setShowSearch(!showSearch)}
                className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {showSearch && (
                <div className="absolute right-0 top-full mt-4 w-[260px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50 p-2">
                  <form onSubmit={handleSearch} className="flex gap-1.5">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('forum.header.searchPlaceholder')} autoFocus
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-[12px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <button type="submit"
                      className="bg-[#0E76FD] text-white px-2.5 py-1.5 text-[12px] font-medium hover:bg-blue-700">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </form>
                  {isSearching && (
                    <button onClick={clearSearch} className="mt-1.5 text-[11px] text-blue-600 hover:underline">{t('forum.header.clearSearch')}</button>
                  )}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
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

            {/* Language selector */}
            <LanguageSelector />

            {/* User / Login */}
            {user ? (
              <div className="flex items-center gap-2 ml-1">
                <Link to={`/profile/${user.id}`}
                  className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                  title={user.displayName || user.username}>
                  {(user.displayName || user.username || '?')[0].toUpperCase()}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-xs text-blue-600 hover:underline hidden sm:block">Admin</Link>
                )}
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hidden sm:block">{t('common.logout')}</button>
              </div>
            ) : (
              <Link to="/login"
                className="ml-2 bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 px-3 py-[4px] rounded-full text-[11px] font-medium hover:bg-[#0E76FD] hover:text-white hover:border-[#0E76FD] transition-colors">
                {t('common.logIn')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ===== BODY ===== */}
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
            {/* Topics */}
            <nav className="mb-1">
              <button onClick={() => { selectProduct(''); selectCategory(''); setSelectedTag(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] font-medium transition-colors ${
                  !selectedProduct && !selectedCategory && !isSearching
                    ? 'bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700'
                }`}>
                <svg className="w-[16px] h-[16px] text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {t('forum.sidebar.topics')}
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                </svg>
                {t('forum.sidebar.more')}
              </button>
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
              <a href="#" onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {t('forum.sidebar.developerPlatform')}
              </a>
              <a href="#" onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-[16px] h-[16px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {t('forum.sidebar.officialWeb')}
              </a>
              <a href="#" onClick={(e) => e.preventDefault()}
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
            <div className="mb-2">
              <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.categories')}</h4>
              <ul className="space-y-[1px]">
                {categories.map(cat => (
                  <li key={cat.id}>
                    <button onClick={() => { selectCategory(cat.id); setSelectedTag(''); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700'
                      }`}>
                      <span className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0" style={{ backgroundColor: cat.color || '#6B7280' }} />
                      {cat.name}
                    </button>
                  </li>
                ))}
                <li>
                  <button onClick={() => { selectCategory(''); setSelectedTag(''); }}
                    className="flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] text-gray-400 dark:text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 w-full transition-colors">
                    {t('forum.sidebar.allCategories')}
                  </button>
                </li>
              </ul>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* PRODUCTS */}
            <div className="mb-2">
              <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.products')}</h4>
              <ul className="space-y-[1px]">
                {products.map(prod => (
                  <li key={prod.id}>
                    <button onClick={() => { selectProduct(prod.id); setSelectedTag(''); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] transition-colors ${
                        selectedProduct === prod.id
                          ? 'bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700'
                      }`}>
                      <span className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0" style={{ backgroundColor: prod.color || '#6B7280' }} />
                      {prod.name}
                    </button>
                  </li>
                ))}
                <li>
                  <button onClick={() => { selectProduct(''); setSelectedTag(''); }}
                    className="flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] text-gray-400 dark:text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 w-full transition-colors">
                    {t('forum.sidebar.allProducts')}
                  </button>
                </li>
              </ul>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 my-2 mx-2" />

            {/* TAGS */}
            {allTags.length > 0 && (
              <div className="mb-2">
                <h4 className="px-3 py-1.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">{t('forum.sidebar.tags')}</h4>
                <ul className="space-y-[1px]">
                  {allTags.slice(0, 10).map(tag => (
                    <li key={tag}>
                      <button onClick={() => { setSelectedTag(tag === selectedTag ? '' : tag); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-[5px] rounded text-[13px] transition-colors ${
                          selectedTag === tag ? 'bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700'
                        }`}>
                        <svg className="w-[14px] h-[14px] text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {tag}
                      </button>
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
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {(user.displayName || user.username || '?')[0].toUpperCase()}
                  </div>
                  {user.displayName || user.username}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setSidebarOpen(false)}
                    className="block px-3 py-[7px] text-[13px] text-blue-600 hover:bg-gray-200/50 dark:hover:bg-gray-700 rounded">{t('forum.sidebar.adminPanel')}</Link>
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

          {/* ===== BANNER (inside main, right of sidebar) ===== */}
          {banner && (
            <div className="mx-4 lg:mx-5 mt-4 rounded-lg overflow-hidden relative" style={{ minHeight: '140px' }}>
              {banner.bannerImageUrl ? (
                <img src={`${API_ORIGIN}${banner.bannerImageUrl}`} alt="Forum banner"
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-500" />
              )}
              {/* Text overlay */}
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
              {/* Dark overlay for text readability */}
              {banner.bannerImageUrl && (
                <div className="absolute inset-0 bg-black/30" />
              )}
            </div>
          )}

          {/* ===== FILTER ROW: dropdowns + tabs ===== */}
          <div className="mt-4 mx-4 lg:mx-5">
            <div>
              {/* Dropdown filters */}
              <div className="flex items-center gap-2 pt-3 pb-1 flex-wrap">
                {/* categories dropdown */}
                <div className="relative" ref={catDropdownRef}>
                  <button onClick={() => { setShowCatDropdown(!showCatDropdown); setShowTagDropdown(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-[5px] border border-gray-300 dark:border-gray-600 rounded text-[11px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors">
                    {t('forum.filters.categories')}
                    <svg className="w-[10px] h-[10px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {showCatDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                      <button onClick={() => selectCategory('')}
                        className={`w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 ${!selectedCategory ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {t('forum.filters.allCategories')}
                      </button>
                      {categories.map(cat => (
                        <button key={cat.id} onClick={() => selectCategory(cat.id)}
                          className={`w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${selectedCategory === cat.id ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          <span className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: cat.color || '#6B7280' }} />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* tags dropdown */}
                <div className="relative" ref={tagDropdownRef}>
                  <button onClick={() => { setShowTagDropdown(!showTagDropdown); setShowCatDropdown(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-[5px] border border-gray-300 dark:border-gray-600 rounded text-[11px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors">
                    {selectedTag || t('forum.filters.tags')}
                    <svg className="w-[10px] h-[10px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {showTagDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                      <button onClick={() => selectTag('')}
                        className={`w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 ${!selectedTag ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {t('forum.filters.allTags')}
                      </button>
                      {allTags.map(tag => (
                        <button key={tag} onClick={() => selectTag(tag)}
                          className={`w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedTag === tag ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* all dropdown (time filter) */}
                <button className="flex items-center gap-1.5 px-2.5 py-[5px] border border-gray-300 dark:border-gray-600 rounded text-[11px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors">
                  {t('forum.filters.all')}
                  <svg className="w-[10px] h-[10px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* New Topic */}
                {user && (
                  <button onClick={() => setShowNewPost(!showNewPost)}
                    className="bg-[#0E76FD] text-white px-3 py-[5px] rounded text-[12px] font-medium hover:bg-blue-700 whitespace-nowrap transition-colors">
                    {showNewPost ? t('forum.newPost.cancelButton') : t('forum.newPost.button')}
                  </button>
                )}
              </div>

              {/* ===== PRODUCT BUTTONS ===== */}
              <div className="flex items-center gap-2 py-3 overflow-x-auto">
                {isSearching ? (
                  <div className="py-1 text-[12px] text-gray-500 dark:text-gray-400">
                    {t('forum.searchResults')} &ldquo;<strong className="text-gray-700 dark:text-gray-200">{searchQuery}</strong>&rdquo;
                    <button onClick={clearSearch} className="ml-2 text-blue-600 hover:underline text-[11px]">{t('forum.filters.clear')}</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => { selectProduct(''); setSelectedTag(''); }}
                      className={`px-4 py-[6px] rounded text-[12px] font-medium whitespace-nowrap transition-colors border ${
                        !selectedProduct
                          ? 'bg-[#0E76FD] text-white border-[#0E76FD]'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      {t('common.all')}
                    </button>
                    {products.map(prod => (
                      <button key={prod.id} onClick={() => { selectProduct(prod.id); setSelectedTag(''); }}
                        className={`px-4 py-[6px] rounded text-[12px] font-medium whitespace-nowrap transition-colors border ${
                          selectedProduct === prod.id
                            ? 'text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        style={selectedProduct === prod.id ? { backgroundColor: prod.color || '#0E76FD', borderColor: prod.color || '#0E76FD' } : {}}>
                        {prod.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tag filter banner */}
          {selectedTag && (
            <div className="mx-4 lg:mx-5 mt-3 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2 transition-colors">
              <span className="text-[13px] text-gray-500 dark:text-gray-400">{t('forum.filters.filteredByTag')}</span>
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[12px] font-medium">{selectedTag}</span>
              <button onClick={() => setSelectedTag('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-[11px] ml-1">&times; {t('forum.filters.clear')}</button>
            </div>
          )}

          {/* New post form */}
          {showNewPost && user && (
            <div className="mx-4 lg:mx-5 mt-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 transition-colors">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('forum.newPost.title')}</h2>
              {postError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2.5 rounded mb-3 text-[13px]">{postError}</div>}
              <form onSubmit={handleCreatePost}>
                <input type="text" placeholder={t('forum.newPost.titlePlaceholder')} value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2.5 text-[13px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <textarea placeholder={t('forum.newPost.contentPlaceholder')} value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2.5 text-[13px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="5" required />
                <div className="flex gap-2.5 mb-3 flex-wrap">
                  <select value={newPost.productId} onChange={(e) => setNewPost({ ...newPost, productId: e.target.value })}
                    className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-[13px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required>
                    <option value="">{t('forum.newPost.selectProduct')}</option>
                    {products.map(prod => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                  </select>
                  <select value={newPost.categoryId} onChange={(e) => setNewPost({ ...newPost, categoryId: e.target.value })}
                    className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-[13px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="">{t('forum.newPost.categoryOptional')}</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <input type="text" placeholder={t('forum.newPost.tagsPlaceholder')} value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-[13px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
                </div>
                <button type="submit" className="bg-[#0E76FD] text-white px-5 py-2 rounded text-[13px] font-medium hover:bg-blue-700 transition-colors">
                  {t('forum.newPost.submitButton')}
                </button>
              </form>
            </div>
          )}

          {/* ===== TOPIC LIST ===== */}
          <div className="mx-4 lg:mx-5 mt-2">
            {loading ? (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-[13px]">{t('common.loading')}</div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
                <p className="text-gray-400 dark:text-gray-500 text-[13px]">
                  {isSearching ? t('forum.empty.noSearchResults') : selectedTag ? t('forum.empty.noTagResults') : t('forum.empty.noTopics')}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                {/* Table header */}
                <div className="hidden md:grid md:grid-cols-[1fr_80px_80px_80px] gap-0 px-4 py-2 bg-[#f8f8f8] dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('forum.table.topic')}</div>
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">{t('forum.table.replies')}</div>
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">{t('forum.table.popularity')}</div>
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">{t('forum.table.activity')}</div>
                </div>

                {/* Topic rows */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredPosts.map(post => (
                    <Link key={post.id} to={`/posts/${post.id}`}
                      className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_80px] gap-0 px-4 py-3.5 hover:bg-[#fafafa] dark:hover:bg-gray-700/50 transition-colors items-start group">
                      {/* Topic column */}
                      <div className="pr-3">
                        <div className="flex items-start gap-1.5">
                          {post.isPinned && (
                            <svg className="w-[14px] h-[14px] text-gray-400 dark:text-gray-500 mt-[3px] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                            </svg>
                          )}
                          <div className="min-w-0 flex-1">
                            {/* Title */}
                            <h3 className="text-[14px] font-semibold text-[#222] dark:text-gray-100 leading-[1.3] group-hover:text-[#0E76FD] transition-colors">
                              {post.title}
                            </h3>

                            {/* Product + Category badges + tags */}
                            <div className="flex items-center gap-1.5 mt-[5px] flex-wrap">
                              {post.Product && (
                                <span className="inline-flex items-center gap-1 px-[6px] py-[2px] rounded text-[11px] font-medium"
                                  style={{
                                    backgroundColor: (post.Product.color || '#6B7280') + '18',
                                    color: post.Product.color || '#6B7280',
                                  }}>
                                  <span className="w-[7px] h-[7px] rounded-[1px]" style={{ backgroundColor: post.Product.color || '#6B7280' }} />
                                  {post.Product.name}
                                </span>
                              )}
                              {post.Category && (
                                <span className="inline-flex items-center gap-1 px-[6px] py-[2px] rounded text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {post.Category.name}
                                </span>
                              )}
                              {post.tags?.length > 0 && post.tags.map(tag => (
                                <span key={tag} className="px-[5px] py-[2px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-[11px]">{tag}</span>
                              ))}
                            </div>

                            {/* Content preview + read more */}
                            <p className="text-[12.5px] text-gray-400 dark:text-gray-500 mt-[6px] leading-[1.5] line-clamp-2">
                              {post.content?.substring(0, 200)}
                              {post.content?.length > 200 && (
                                <span className="text-blue-500 ml-1">{t('forum.readMore')}</span>
                              )}
                            </p>

                            {/* Author avatars */}
                            <div className="flex items-center gap-2 mt-[8px]">
                              <div className="flex -space-x-1.5">
                                <div className="w-[24px] h-[24px] rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white dark:ring-gray-800"
                                  title={post.User?.username}>
                                  {(post.User?.username || '?')[0].toUpperCase()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Replies column */}
                      <div className="hidden md:flex items-center justify-center h-full">
                        <span className={`text-[14px] font-semibold ${
                          (post.replyCount || 0) >= 10 ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'
                        }`}>{post.replyCount || 0}</span>
                      </div>

                      {/* Popularity column */}
                      <div className="hidden md:flex items-center justify-center h-full">
                        <span className="text-[13px] text-gray-500 dark:text-gray-400">{formatCount(post.views)}</span>
                      </div>

                      {/* Activity column */}
                      <div className="hidden md:flex items-center justify-end h-full">
                        <span className="text-[13px] text-gray-400 dark:text-gray-500">{getTimeAgo(post.createdAt)}</span>
                      </div>

                      {/* Mobile stats */}
                      <div className="md:hidden flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                        <span>{t('forum.mobile.replies', { count: post.replyCount || 0 })}</span>
                        <span>{t('forum.mobile.views', { count: formatCount(post.views) })}</span>
                        <span>{getTimeAgo(post.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {loadingMore && (
              <div className="flex justify-center py-6">
                <span className="text-[13px] text-gray-400 dark:text-gray-500">{t('forum.loadMore')}</span>
              </div>
            )}
            {!hasMore && filteredPosts.length > 0 && (
              <div className="flex justify-center py-6">
                <span className="text-[13px] text-gray-400 dark:text-gray-500">{t('forum.endReached')}</span>
              </div>
            )}
            <div ref={loadMoreRef} className="h-4" />
          </div>
        </main>
      </div>

      {/* ===== COOKIE CONSENT BANNER ===== */}
      {!cookieAccepted && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-[#333] text-white px-4 py-3 transition-all duration-300 ease-in-out ${
          cookieDismissing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}>
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[13px] leading-relaxed flex-1">
              {t('cookie.message')}{' '}
              <a href="#" onClick={(e) => e.preventDefault()} className="underline hover:text-blue-300">{t('cookie.learnMore')}</a>
            </p>
            <button onClick={acceptCookies}
              className="bg-white text-[#333] px-5 py-2 rounded text-[13px] font-semibold hover:bg-gray-100 whitespace-nowrap transition-colors">
              {t('cookie.accept')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
