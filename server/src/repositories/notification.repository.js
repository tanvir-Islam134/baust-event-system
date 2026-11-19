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
    if (!id || typeof id !== 'string' || id.startsWith('temp_')) {
      return { id, isRead: true };
    }
    try {
      return await this.update(id, { isRead: true });
    } catch (err) {
      console.warn(`[NotificationRepository] markAsRead(${id}) warning:`, err.message);
      return { id, isRead: true };
    }
  }

  /**
   * Mark all organizer request notifications for a sender as read
   * @param {string} senderId
   */
  async markOrganizerRequestsAsRead(senderId) {
    if (!senderId) return false;
    try {
      const all = await this.findAll();
      const matching = all.filter(
        (n) =>
          n.type === 'new_organizer_request' &&
          (n.senderId === senderId || n.data?.userId === senderId || n.data?.applicantId === senderId) &&
          !n.isRead
      );
      const updates = matching.map((n) => this.update(n.id, { isRead: true }));
      await Promise.all(updates);
      return true;
    } catch (err) {
      console.warn('[NotificationRepository] markOrganizerRequestsAsRead warning:', err.message);
      return false;
    }
  }

  /**
   * Mark all event approval notifications for an eventId as read
   * @param {string} eventId
   */
  async markEventRequestsAsRead(eventId) {
    if (!eventId) return false;
    try {
      const all = await this.findAll();
      const matching = all.filter(
        (n) =>
          n.type === 'event_pending_approval' &&
          (n.data?.eventId === eventId || n.eventId === eventId) &&
          !n.isRead
      );
      const updates = matching.map((n) => this.update(n.id, { isRead: true }));
      await Promise.all(updates);
      return true;
    } catch (err) {
      console.warn('[NotificationRepository] markEventRequestsAsRead warning:', err.message);
      return false;
    }
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
