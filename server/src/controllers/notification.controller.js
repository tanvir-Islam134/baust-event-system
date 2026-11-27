import * as notifService from '../services/notification.service.js';

/**
 * GET /api/v1/notifications
 * Authenticated: Fetch role-scoped notifications & unread count (Admin, Organizer, or Participant).
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const { notifications, unreadCount } = await notifService.getUserNotifications({
      uid: req.user.uid,
      role: req.user.role,
      unreadOnly: unreadOnly === 'true',
    });

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminNotifications = getNotifications;

/**
 * PATCH /api/v1/notifications/:id/read
 * Authenticated: Mark single notification as read for the caller.
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const updated = await notifService.markNotificationAsRead(
      req.params.id,
      req.user.uid,
      req.user.role
    );
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 * Authenticated: Mark all notifications as read for the caller.
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await notifService.markAllNotificationsAsRead({
      uid: req.user.uid,
      role: req.user.role,
    });
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
