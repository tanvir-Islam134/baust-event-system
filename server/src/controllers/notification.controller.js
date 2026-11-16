import * as notifService from '../services/notification.service.js';

/**
 * GET /api/v1/notifications
 * Admin-only: Fetch notifications list & unread count
 */
export const getAdminNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const { notifications, unreadCount } = await notifService.getAdminNotifications({
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

/**
 * PATCH /api/v1/notifications/:id/read
 * Admin-only: Mark single notification as read
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const updated = await notifService.markNotificationAsRead(req.params.id);
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
 * Admin-only: Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await notifService.markAllNotificationsAsRead();
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
