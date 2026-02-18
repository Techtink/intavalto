import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './admin/Dashboard';
import UserManagement from './admin/UserManagement';
import ContentModeration from './admin/ContentModeration';
import ProductManagement from './admin/ProductManagement';
import CategoryManagement from './admin/CategoryManagement';
import TicketManagement from './admin/TicketManagement';
import BannerSettings from './admin/BannerSettings';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  if (user?.role !== 'admin') {
    return <div className="p-8 dark:bg-gray-900 dark:text-gray-100 min-h-screen">{t('admin.accessDenied')}</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', labelKey: 'admin.nav.dashboard', exact: true },
    { path: '/admin/users', labelKey: 'admin.nav.users' },
    { path: '/admin/moderation', labelKey: 'admin.nav.moderation' },
    { path: '/admin/products', labelKey: 'admin.nav.products' },
    { path: '/admin/categories', labelKey: 'admin.nav.categories' },
    { path: '/admin/tickets', labelKey: 'admin.nav.tickets' },
    { path: '/admin/settings', labelKey: 'admin.nav.settings' },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 dark:bg-gray-950 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">{t('admin.title')}</h1>

        <nav className="space-y-1 flex-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`block px-4 py-2 rounded text-sm transition-colors ${
                isActive(item) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}>
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
          <Link to="/forum" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded">
            &larr; {t('admin.backToForum')}
          </Link>
          <p className="text-xs text-gray-500 px-4">{user?.displayName || user?.username}</p>
          <p className="text-xs text-gray-500 px-4">{user?.email}</p>
          <LanguageSelector />
          <button onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm">
            {t('common.logout')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/moderation" element={<ContentModeration />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/tickets" element={<TicketManagement />} />
          <Route path="/settings" element={<BannerSettings />} />
        </Routes>
      </div>
    </div>
  );
}
