import { Router } from 'express';
import * as registrationController from '../../controllers/registration.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/registrations - Create a registration (Logged-in user or guest)
router.post('/', optionalAuth, registrationController.create);

// GET /api/v1/registrations/my - Protected: List all registered events for current student
router.get('/my', requireAuth, registrationController.getMyRegistrations);

// POST /api/v1/registrations/check-in - Protected (Organizer | Admin): Verify attendee QR and mark check-in
router.post(
  '/check-in',
  requireAuth,
  requireRole(['organizer', 'admin']),
  registrationController.checkIn
);

// GET /api/v1/registrations/:id/ticket - Protected: Get complete digital ticket and signed QR
router.get('/:id/ticket', requireAuth, registrationController.getTicket);

// POST /api/v1/registrations/:id/items/:itemType - Protected (Organizer | Admin): Distribute food/tshirt voucher
router.post(
  '/:id/items/:itemType',
  requireAuth,
  requireRole(['organizer', 'admin']),
  registrationController.distributeItem
);

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

