import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as notifController from '../../controllers/notification.controller.js';

const router = Router();

// Protect all notification routes for authenticated users (Student, Organizer, Admin)
router.use(requireAuth);

router.get('/', notifController.getNotifications);
router.patch('/read-all', notifController.markAllNotificationsAsRead);
router.patch('/:id/read', notifController.markNotificationAsRead);

export default router;
