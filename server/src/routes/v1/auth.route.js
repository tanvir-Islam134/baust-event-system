import { Router } from 'express';
import * as authController from '../../controllers/auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { LoginInputSchema } from '../../schemas/auth.schema.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { strictLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', strictLimiter, validate(LoginInputSchema), authController.login);

// GET /api/v1/auth/me (Protected)
router.get('/me', requireAuth, authController.getMe);

export default router;

