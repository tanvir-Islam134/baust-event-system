import { notificationRepository } from '../repositories/notification.repository.js';
import NotificationModel from '../models/Notification.model.js';

/**
 * Shared persistence helper for saving notification records across Firestore & optional Mongoose.
 */
const saveNotificationRecord = async (notifData) => {
  try {
    if (NotificationModel && NotificationModel.db?.readyState === 1) {
      await NotificationModel.create(notifData);
    }
  } catch (err) {
    console.warn('[NotificationService] Mongoose create warning:', err.message);
  }

  try {
    return await notificationRepository.create(notifData);
  } catch (err) {
    console.warn('[NotificationService] Repository create warning:', err.message);
    return notifData;
  }
};

/**
 * Create a new notification for administrators.
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
  return saveNotificationRecord({
    recipientRole: 'admin',
    recipientId: null,
    senderId: senderId || 'system',
    senderName: senderName || 'BAUST User',
    senderEmail: senderEmail || 'system@baust.edu.bd',
    type,
    title,
    message,
    data,
    isRead: false,
    readBy: [],
    createdAt: new Date().toISOString(),
  });
};

/**
 * Create a new notification for an Organizer.
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
  if (!recipientId) return null;
  return saveNotificationRecord({
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
    readBy: [],
    createdAt: new Date().toISOString(),
  });
};

/**
 * Create a targeted notification for a specific student/participant.
 */
export const createParticipantNotification = async ({
  recipientId,
  senderId = 'system',
  senderName = 'BAUST Event System',
  senderEmail = 'noreply@baust.edu.bd',
  type = 'registration_approved',
  title = 'Registration Update',
  message,
  data = {},
}) => {
  if (!recipientId) return null;
  return saveNotificationRecord({
    recipientRole: 'participant',
    recipientId,
    senderId,
    senderName,
    senderEmail,
    type,
    title,
    message,
    data,
    isRead: false,
    readBy: [],
    createdAt: new Date().toISOString(),
  });
};

/**
 * Broadcast an event announcement/new-event notification to all students.
 */
export const createParticipantBroadcastNotification = async ({
  senderId = 'admin',
  senderName = 'BAUST Administration',
  senderEmail = 'admin@baust.edu.bd',
  type = 'new_event_published',
  title = 'New Campus Event Published',
  message,
  data = {},
}) => {
  return saveNotificationRecord({
    recipientRole: 'participant',
    recipientId: null,
    senderId,
    senderName,
    senderEmail,
    type,
    title,
    message,
    data,
    isRead: false,
    readBy: [],
    createdAt: new Date().toISOString(),
  });
};

/**
 * Get role-scoped notifications for any authenticated user (admin, organizer, participant).
 */
export const getUserNotifications = async ({ uid, role, unreadOnly = false } = {}) => {
  const notifications = await notificationRepository.findUserNotifications({
    uid,
    role,
    unreadOnly,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return { notifications, unreadCount };
};

export const getAdminNotifications = async ({ unreadOnly = false } = {}) => {
  return getUserNotifications({ uid: null, role: 'admin', unreadOnly });
};

/**
 * Mark a single notification as read for the requesting user.
 */
export const markNotificationAsRead = async (id, uid = null, role = null) => {
  if (!id || typeof id !== 'string' || id.startsWith('temp_')) {
    return { id, isRead: true };
  }
  return notificationRepository.markAsRead(id, uid, role);
};

export const markOrganizerRequestsAsRead = async (senderId) => {
  if (!senderId) return false;
  return notificationRepository.markOrganizerRequestsAsRead(senderId);
};

export const markEventRequestsAsRead = async (eventId) => {
  if (!eventId) return false;
  return notificationRepository.markEventRequestsAsRead(eventId);
};

/**
 * Mark all notifications as read for the requesting user.
 */
export const markAllNotificationsAsRead = async ({ uid = null, role = 'admin' } = {}) => {
  return notificationRepository.markAllForUserAsRead({ uid, role });
};
