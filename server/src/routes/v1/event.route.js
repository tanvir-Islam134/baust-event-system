import { Router } from 'express';
import * as eventController from '../../controllers/event.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { CreateEventInputSchema, UpdateEventStatusSchema } from '../../schemas/event.schema.js';

const router = Router();

// GET /api/v1/events - Public: List all approved events
router.get('/', eventController.getApproved);

// POST /api/v1/events - Protected (Organizer | Admin): Create an event
router.post(
  '/',
  requireAuth,
  requireRole(['organizer', 'admin']),
  validate(CreateEventInputSchema),
  eventController.create
);

// GET /api/v1/events/my-events - Protected (Organizer | Admin): List events created by current user
router.get(
  '/my-events',
  requireAuth,
  requireRole(['organizer', 'admin']),
  eventController.getMyEvents
);

// GET /api/v1/events/admin/queue - Protected (Admin only): List pending events queue
router.get(
  '/admin/queue',
  requireAuth,
  requireRole(['admin']),
  eventController.getAdminQueue
);

// GET /api/v1/events/:id - Public: Get event details by ID
router.get('/:id', eventController.getById);

// PATCH /api/v1/events/:id/status - Protected (Admin only): Update event approval status
router.patch(
  '/:id/status',
  requireAuth,
  requireRole(['admin']),
  validate(UpdateEventStatusSchema),
  eventController.updateStatus
);

export default router;

