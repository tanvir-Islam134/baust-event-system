import { Router } from 'express';
import * as eventController from '../../controllers/event.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { CreateEventInputSchema, UpdateEventStatusSchema, UpdateEventSchema } from '../../schemas/event.schema.js';

const router = Router();

// GET /api/v1/events - Public/Protected: List approved events by default
router.get('/', optionalAuth, eventController.getApproved);

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

// GET /api/v1/events/calendar - Public/Protected: List approved events for calendar view
router.get('/calendar', optionalAuth, eventController.getCalendarEvents);

// GET /api/v1/events/:id - Public: Get event details by ID
router.get('/:id', eventController.getById);

// PUT /api/v1/events/:id - Protected (Organizer | Admin): Update event details
router.put(
  '/:id',
  requireAuth,
  requireRole(['organizer', 'admin']),
  validate(UpdateEventSchema),
  eventController.update
);

// PATCH /api/v1/events/:id - Protected (Organizer | Admin): Partially update event details
router.patch(
  '/:id',
  requireAuth,
  requireRole(['organizer', 'admin']),
  validate(UpdateEventSchema),
  eventController.update
);

// DELETE /api/v1/events/:id - Protected (Organizer | Admin): Delete an event
router.delete(
  '/:id',
  requireAuth,
  requireRole(['organizer', 'admin']),
  eventController.remove
);

// PATCH /api/v1/events/:eventId/status & /:id/status - Protected (Admin only): Update event approval status
router.patch(
  '/:eventId/status',
  requireAuth,
  requireRole(['admin']),
  validate(UpdateEventStatusSchema),
  eventController.updateStatus
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole(['admin']),
  validate(UpdateEventStatusSchema),
  eventController.updateStatus
);

export default router;

