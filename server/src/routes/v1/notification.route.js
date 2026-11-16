import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import * as notifController from '../../controllers/notification.controller.js';

const router = Router();

// Protect all notification routes to admin only
router.use(requireAuth, requireRole(['admin']));

router.get('/', notifController.getAdminNotifications);
router.patch('/read-all', notifController.markAllNotificationsAsRead);
router.patch('/:id/read', notifController.markNotificationAsRead);

export default router;
