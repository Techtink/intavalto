import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useTranslation } from '../../i18n';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [banModalUser, setBanModalUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('isBanned', statusFilter === 'banned' ? 'true' : 'false');
      const { data } = await api.get(`/admin/users?${params}`);
      let filteredUsers = data.users;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredUsers = filteredUsers.filter(u =>
          u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q)
        );
      }
      setUsers(filteredUsers);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, searchQuery]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess('Role updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const openBanModal = (user) => {
    setBanModalUser(user);
    setBanReason('');
  };

  const handleBanUser = async () => {
    if (!banModalUser) return;
    try {
      await api.post(`/admin/users/${banModalUser.id}/ban`, { reason: banReason || 'Violation of community guidelines' });
      setUsers(users.map(u => u.id === banModalUser.id ? { ...u, isBanned: true, banReason: banReason || 'Violation of community guidelines' } : u));
      setBanModalUser(null);
      setSuccess('User banned');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/unban`);
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: false, banReason: null } : u));
      setSuccess('User unbanned');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unban user');
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('admin.users.title')}</h1>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{success}</div>}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder={t('admin.users.searchPlaceholder')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">{t('admin.users.allRoles')}</option>
          <option value="user">{t('admin.users.user')}</option>
          <option value="moderator">{t('admin.users.moderator')}</option>
          <option value="admin">{t('admin.users.admin')}</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">{t('admin.users.allStatus')}</option>
          <option value="active">{t('admin.users.active')}</option>
          <option value="banned">{t('admin.users.banned')}</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.users.tableUser')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.users.tableEmail')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.users.tableRole')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.users.tableStatus')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.users.tableJoined')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.users.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">{t('admin.users.noUsers')}</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                      {user.displayName && <div className="text-xs text-gray-400 dark:text-gray-500">{user.displayName}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option value="user">{t('admin.users.user')}</option>
                        <option value="moderator">{t('admin.users.moderator')}</option>
                        <option value="admin">{t('admin.users.admin')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.isBanned ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                        {user.isBanned ? t('admin.users.banned') : t('admin.users.active')}
                      </span>
                      {user.isBanned && user.banReason && (
                        <div className="text-xs text-red-500 dark:text-red-400 mt-1" title={user.banReason}>
                          {user.banReason.length > 30 ? user.banReason.substring(0, 30) + '...' : user.banReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {user.isBanned ? (
                        <button onClick={() => handleUnbanUser(user.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">{t('admin.users.unban')}</button>
                      ) : (
                        <button onClick={() => openBanModal(user)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm">{t('admin.users.ban')}</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded shadow disabled:opacity-50 text-sm text-gray-700 dark:text-gray-300">{t('common.previous')}</button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">{t('common.page', { current: page, total: totalPages })}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded shadow disabled:opacity-50 text-sm text-gray-700 dark:text-gray-300">{t('common.next')}</button>
        </div>
      )}

      {/* Ban Modal */}
      {banModalUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transition-colors">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('admin.users.banTitle', { username: banModalUser.username })}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('admin.users.banDescription')}</p>
            <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)}
              placeholder={t('admin.users.banReasonPlaceholder')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" rows="3" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBanModalUser(null)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">{t('common.cancel')}</button>
              <button onClick={handleBanUser} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">{t('admin.users.confirmBan')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
