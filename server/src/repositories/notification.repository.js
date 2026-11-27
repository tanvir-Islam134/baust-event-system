import { BaseRepository } from './base.repository.js';

export class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  /**
   * Resolve per-user read flag (supports both targeted isRead and broadcast readBy arrays).
   */
  _isReadForUser(notif, uid, role) {
    if (role === 'admin' || notif.recipientId) {
      return Boolean(notif.isRead);
    }
    return Boolean(notif.isRead) || (Array.isArray(notif.readBy) && notif.readBy.includes(uid));
  }

  /**
   * Find notifications for any authenticated user (admin, organizer, or participant).
   * @param {{ uid: string, role: string, unreadOnly?: boolean }} options
   */
  async findUserNotifications({ uid, role, unreadOnly = false } = {}) {
    if (!uid && role !== 'admin') return [];
    const all = await this.findAll();

    return all
      .filter((n) => {
        if (role === 'admin') {
          return (n.recipientRole || 'admin') === 'admin' || n.recipientId === uid;
        }
        return n.recipientId === uid || (n.recipientRole === role && !n.recipientId);
      })
      .map((n) => ({
        ...n,
        isRead: this._isReadForUser(n, uid, role),
      }))
      .filter((n) => !unreadOnly || !n.isRead)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 50);
  }

  /**
   * Find notifications for admin, sorted by createdAt descending
   * @param {{ unreadOnly?: boolean }} options
   */
  async findAdminNotifications({ unreadOnly = false } = {}) {
    return this.findUserNotifications({ uid: null, role: 'admin', unreadOnly });
  }

  /**
   * Mark a notification as read safely for a user.
   * @param {string} id
   * @param {string|null} [uid=null]
   * @param {string|null} [role=null]
   */
  async markAsRead(id, uid = null, role = null) {
    if (!id || typeof id !== 'string' || id.startsWith('temp_')) {
      return { id, isRead: true };
    }
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return { id, isRead: true };
      }

      // Broadcast notification for non-admin users: record uid inside readBy array
      if (!existing.recipientId && existing.recipientRole !== 'admin' && uid) {
        const readBy = Array.isArray(existing.readBy) ? existing.readBy : [];
        if (!readBy.includes(uid)) {
          await this.update(id, { readBy: [...readBy, uid] });
        }
        return { ...existing, isRead: true };
      }

      // Targeted or admin notification: enforce ownership unless admin
      if (uid && role !== 'admin' && existing.recipientId && existing.recipientId !== uid) {
        return existing;
      }

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
   * Mark all notifications as read for a given user & role.
   */
  async markAllForUserAsRead({ uid, role }) {
    try {
      const unread = await this.findUserNotifications({ uid, role, unreadOnly: true });
      await Promise.all(unread.map((n) => this.markAsRead(n.id, uid, role)));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mark all admin notifications as read
   */
  async markAllAdminAsRead() {
    return this.markAllForUserAsRead({ uid: null, role: 'admin' });
  }
}

export const notificationRepository = new NotificationRepository();
