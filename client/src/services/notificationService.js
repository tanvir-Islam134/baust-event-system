import api from './api.js';

/**
 * Service for fetching and managing admin notifications.
 */
export const notificationService = {
  /**
   * Fetch admin notifications
   * @param {boolean} [unreadOnly=false]
   */
  getNotifications: async (unreadOnly = false) => {
    const res = await api.get('/notifications', { params: { unreadOnly } });
    return res.data;
  },

  /**
   * Mark single notification as read
   * @param {string} id
   */
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data?.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

export default notificationService;
