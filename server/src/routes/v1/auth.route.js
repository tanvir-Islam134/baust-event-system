import { Router } from 'express';
import * as authController from '../../controllers/auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { LoginInputSchema, RegisterInputSchema } from '../../schemas/auth.schema.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { strictLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// POST /api/v1/auth/login - Existing users only
router.post('/login', strictLimiter, validate(LoginInputSchema), authController.login);

// POST /api/v1/auth/register - Separate registration logic creating new user
router.post('/register', strictLimiter, validate(RegisterInputSchema), authController.register);

// GET /api/v1/auth/me (Protected)
router.get('/me', requireAuth, authController.getMe);

export default router;
