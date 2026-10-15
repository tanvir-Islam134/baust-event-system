import { Router } from 'express';
import * as pollController from '../../controllers/poll.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { CreatePollInputSchema, CastVoteInputSchema } from '../../schemas/poll.schema.js';

const router = Router();

// POST /api/v1/polls - Protected (Organizer | Admin)
router.post(
  '/',
  requireAuth,
  requireRole(['organizer', 'admin']),
  validate(CreatePollInputSchema),
  pollController.create
);

// GET /api/v1/polls/event/:eventId - Public
router.get('/event/:eventId', pollController.getByEvent);

// POST /api/v1/polls/:pollId/vote - Protected (Any logged-in user)
router.post(
  '/:pollId/vote',
  requireAuth,
  validate(CastVoteInputSchema),
  pollController.vote
);

export default router;

