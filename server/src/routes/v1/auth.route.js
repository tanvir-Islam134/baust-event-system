import { Router } from 'express';
import * as authController from '../../controllers/auth.controller.js';
import { deleteMyAccount } from '../../controllers/user.controller.js';
import { validate } from '../../middlewares/validate.js';
import { LoginInputSchema, RegisterInputSchema, SwitchRoleSchema } from '../../schemas/auth.schema.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { strictLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// POST /api/v1/auth/login - Existing users only (supports targetRole selection)
router.post('/login', strictLimiter, validate(LoginInputSchema), authController.login);

// POST /api/v1/auth/switch-role - Supervisor / evaluation role switcher
router.post('/switch-role', requireAuth, validate(SwitchRoleSchema), authController.switchRole);

// POST /api/v1/auth/register - Separate registration logic creating new user
router.post('/register', strictLimiter, validate(RegisterInputSchema), authController.register);

// GET /api/v1/auth/me (Protected)
router.get('/me', requireAuth, authController.getMe);

// DELETE /api/v1/auth/me (Protected)
router.delete('/me', requireAuth, deleteMyAccount);

export default router;
