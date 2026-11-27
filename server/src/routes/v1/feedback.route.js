import { Router } from 'express';
import * as feedbackController from '../../controllers/feedback.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { CreateFeedbackInputSchema } from '../../schemas/feedback.schema.js';

const router = Router();

// GET /api/v1/feedback/event/:eventId - Public: List event ratings and reviews
router.get('/event/:eventId', feedbackController.getByEvent);

// POST /api/v1/feedback - Protected: Checked-in student feedback submission
router.post(
  '/',
  requireAuth,
  requireRole(['participant', 'organizer', 'admin']),
  validate(CreateFeedbackInputSchema),
  feedbackController.create
);

export default router;
