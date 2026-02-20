import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';

export default function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const user = useAuthStore(state => state.user);
  const { unreadCount, notifications, fetchUnreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { t } = useTranslation();

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown && user) fetchNotifications();
  }, [showDropdown, user, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif.id);
    setShowDropdown(false);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return t('forum.time.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-[#50ba4b] hover:underline">
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                {t('notifications.empty')}
              </div>
            ) : (
              notifications.map(notif => (
                <Link
                  key={notif.id}
                  to={notif.linkUrl || '#'}
                  onClick={() => handleNotificationClick(notif)}
                  className={`block px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notif.isRead ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-[#50ba4b] rounded-full mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{notif.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{getTimeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
