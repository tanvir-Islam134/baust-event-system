import { BaseRepository } from './base.repository.js';

export class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  /**
   * Find notifications for admin, sorted by createdAt descending
   * @param {{ unreadOnly?: boolean }} options
   */
  async findAdminNotifications({ unreadOnly = false } = {}) {
    try {
      const filters = [['recipientRole', '==', 'admin']];
      if (unreadOnly) {
        filters.push(['isRead', '==', false]);
      }
      const notifs = await this.find(filters, {
        orderBy: ['createdAt', 'desc'],
      });
      return notifs;
    } catch {
      // Fallback in case composite index is missing
      const all = await this.findAll();
      return all
        .filter((n) => (n.recipientRole || 'admin') === 'admin' && (!unreadOnly || !n.isRead))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }

  /**
   * Mark a notification as read
   * @param {string} id
   */
  async markAsRead(id) {
    return this.update(id, { isRead: true });
  }

  /**
   * Mark all admin notifications as read
   */
  async markAllAdminAsRead() {
    try {
      const all = await this.findAdminNotifications({ unreadOnly: true });
      const updates = all.map((n) => this.update(n.id, { isRead: true }));
      await Promise.all(updates);
      return true;
    } catch {
      return false;
    }
  }
}

export const notificationRepository = new NotificationRepository();
