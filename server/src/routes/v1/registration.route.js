import { Router } from 'express';
import * as registrationController from '../../controllers/registration.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/registrations - Create a registration (Logged-in user or guest)
router.post('/', optionalAuth, registrationController.create);

// GET /api/v1/registrations/organizer/pending - Protected (Organizer only): List pending registrations for caller's club
router.get(
  '/organizer/pending',
  requireAuth,
  requireRole(['organizer']),
  registrationController.getOrganizerPending
);

// POST /api/v1/registrations/:id/approve - Protected (Organizer only): Approve a pending registration
router.post(
  '/:id/approve',
  requireAuth,
  requireRole(['organizer']),
  registrationController.approve
);

// POST /api/v1/registrations/:id/reject - Protected (Organizer only): Reject a pending registration
router.post(
  '/:id/reject',
  requireAuth,
  requireRole(['organizer']),
  registrationController.reject
);

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

