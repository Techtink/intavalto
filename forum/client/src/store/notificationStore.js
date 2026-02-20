import { create } from 'zustand';
import api from '../utils/api';

const useNotificationStore = create((set) => ({
  unreadCount: 0,
  notifications: [],

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      set({ unreadCount: data.count });
    } catch {
      // Silently fail - user may not be authenticated
    }
  },

  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications?limit=20');
      set({ notifications: data });
    } catch {
      // Silently fail
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/mark-all-read');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // Silently fail
    }
  },
}));

export default useNotificationStore;
