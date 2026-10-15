import { Router } from 'express';
import * as userController from '../../controllers/user.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import {
  UpdateStudentProfileSchema,
  AdminUpdateUserRoleSchema,
  ListUsersQuerySchema,
} from '../../schemas/user.schema.js';

const router = Router();

// Protect all /users routes with authentication
router.use(requireAuth);

// PATCH /api/v1/users/me - Update student profile
router.patch('/me', validate(UpdateStudentProfileSchema), userController.updateProfile);

// POST /api/v1/users/me/request-organizer - Request organizer status
router.post('/me/request-organizer', userController.requestOrganizer);

// GET /api/v1/users - List users (Admin only)
router.get(
  '/',
  requireRole(['admin']),
  validate(ListUsersQuerySchema, 'query'),
  userController.listUsers
);

// PATCH /api/v1/users/:id/role - Update user role & organizerStatus (Admin only)
router.patch(
  '/:id/role',
  requireRole(['admin']),
  validate(AdminUpdateUserRoleSchema),
  userController.updateUserRole
);

export default router;

