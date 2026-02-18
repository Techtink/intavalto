import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useTranslation } from '../../i18n';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">{t('admin.dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.totalUsers')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalUsers}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.totalPosts')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalPosts}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.totalComments')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalComments}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.products')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalProducts}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.categories')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalCategories}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.bannedUsers')}</h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{stats?.bannedUsers}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.unapprovedPosts')}</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.unapprovedPosts}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.openTickets')}</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.openTickets}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.dashboard.totalTickets')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalTickets}</p>
        </div>
      </div>
    </div>
  );
}
