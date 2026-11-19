import { notificationRepository } from '../repositories/notification.repository.js';
import NotificationModel from '../models/Notification.model.js';

/**
 * Service to handle system notifications across MongoDB (Mongoose) and Firestore repository.
 */

/**
 * Create a new notification for administrators.
 * Saves to MongoDB if Mongoose is connected, and stores in notificationRepository.
 * @param {object} payload
 */
export const createAdminNotification = async ({
  senderId,
  senderName,
  senderEmail,
  type = 'new_organizer_request',
  title = 'New Organizer Request',
  message,
  data = {},
}) => {
  const notifData = {
    recipientRole: 'admin',
    recipientId: null,
    senderId,
    senderName,
    senderEmail,
    type,
    title,
    message,
    data,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  // Try saving with Mongoose if connected
  try {
    if (NotificationModel && NotificationModel.db?.readyState === 1) {
      await NotificationModel.create(notifData);
    }
  } catch (err) {
    console.warn('[NotificationService] Mongoose create warning:', err.message);
  }

  // Also store in repository
  try {
    const saved = await notificationRepository.create(notifData);
    return saved;
  } catch (err) {
    console.warn('[NotificationService] Repository create warning:', err.message);
    return notifData;
  }
};

/**
 * Create a new notification for an Organizer or specific user.
 * Saves to MongoDB if Mongoose is connected, and stores in notificationRepository.
 * @param {object} payload
 */
export const createOrganizerNotification = async ({
  recipientId,
  senderId = 'admin',
  senderName = 'BAUST Administration',
  senderEmail = 'admin@baust.edu.bd',
  type = 'event_approved',
  title = 'Event Status Update',
  message,
  data = {},
}) => {
  const notifData = {
    recipientRole: 'organizer',
    recipientId,
    senderId,
    senderName,
    senderEmail,
    type,
    title,
    message,
    data,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  // Try saving with Mongoose if connected
  try {
    if (NotificationModel && NotificationModel.db?.readyState === 1) {
      await NotificationModel.create(notifData);
    }
  } catch (err) {
    console.warn('[NotificationService] Mongoose create warning:', err.message);
  }

  // Also store in repository
  try {
    const saved = await notificationRepository.create(notifData);
    return saved;
  } catch (err) {
    console.warn('[NotificationService] Repository create warning:', err.message);
    return notifData;
  }
};

/**
 * Get all notifications for admin
 * @param {{ unreadOnly?: boolean }} options
 */
export const getAdminNotifications = async ({ unreadOnly = false } = {}) => {
  // If Mongoose is active, query via Mongoose
  try {
    if (NotificationModel && NotificationModel.db?.readyState === 1) {
      const query = { recipientRole: 'admin' };
      if (unreadOnly) query.isRead = false;
      const list = await NotificationModel.find(query).sort({ createdAt: -1 }).limit(50);
      const unreadCount = await NotificationModel.countDocuments({
        recipientRole: 'admin',
        isRead: false,
      });
      return { notifications: list, unreadCount };
    }
  } catch {
    // fallback to repository
  }

  const list = await notificationRepository.findAdminNotifications({ unreadOnly });
  const unreadCount = list.filter((n) => !n.isRead).length;
  return { notifications: list, unreadCount };
};

/**
 * Mark a single notification as read
 * @param {string} id
 */
export const markNotificationAsRead = async (id) => {
  if (!id || typeof id !== 'string' || id.startsWith('temp_')) {
    return { id, isRead: true };
  }
  try {
    if (NotificationModel && NotificationModel.db?.readyState === 1) {
      await NotificationModel.findByIdAndUpdate(id, { isRead: true });
    }
  } catch {
    // ignore
  }

  return notificationRepository.markAsRead(id);
};

/**
 * Mark all organizer request notifications for an applicant as read
 * @param {string} senderId
 */
export const markOrganizerRequestsAsRead = async (senderId) => {
  if (!senderId) return false;
  try {
    if (NotificationModel && NotificationModel.db?.readyState === 1) {
      await NotificationModel.updateMany(
        {
          type: 'new_organizer_request',
          $or: [{ senderId }, { 'data.userId': senderId }, { 'data.applicantId': senderId }],
          isRead: false,
        },
        { isRead: true }
      );
    }
  } catch (err) {
    console.warn('[NotificationService] Mongoose markOrganizerRequestsAsRead warning:', err.message);
  }

  return notificationRepository.markOrganizerRequestsAsRead(senderId);
};

/**
 * Mark all event approval notifications for an event as read
 * @param {string} eventId
 */
export const markEventRequestsAsRead = async (eventId) => {
  if (!eventId) return false;
  try {
    if (NotificationModel && NotificationModel.db?.readyState === 1) {
      await NotificationModel.updateMany(
        {
          type: 'event_pending_approval',
          $or: [{ 'data.eventId': eventId }, { eventId }],
          isRead: false,
        },
        { isRead: true }
      );
    }
  } catch (err) {
    console.warn('[NotificationService] Mongoose markEventRequestsAsRead warning:', err.message);
  }

  return notificationRepository.markEventRequestsAsRead(eventId);
};

/**
 * Mark all admin notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    if (NotificationModel && NotificationModel.db?.readyState === 1) {
      await NotificationModel.updateMany({ recipientRole: 'admin', isRead: false }, { isRead: true });
    }
  } catch {
    // ignore
  }

  return notificationRepository.markAllAdminAsRead();
};
