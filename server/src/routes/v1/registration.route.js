import { Router } from 'express';
import * as registrationController from '../../controllers/registration.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/registrations - Create a registration (Logged-in user or guest)
router.post('/', optionalAuth, registrationController.create);

// GET /api/v1/registrations/event/:eventId - Protected (Organizer | Admin): List event registrations
router.get(
  '/event/:eventId',
  requireAuth,
  requireRole(['organizer', 'admin']),
  registrationController.getByEvent
);

// POST /api/v1/registrations/:id/cancel - Protected (Admin only): Cancel a registration
router.post(
  '/:id/cancel',
  requireAuth,
  requireRole(['admin']),
  registrationController.cancel
);

export default router;

