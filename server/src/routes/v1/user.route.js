import { Router } from 'express';
import * as userController from '../../controllers/user.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import {
  UpdateStudentProfileSchema,
  AdminUpdateUserRoleSchema,
  ListUsersQuerySchema,
  RequestOrganizerSchema,
  ApproveOrganizerSchema,
  RejectOrganizerSchema,
} from '../../schemas/user.schema.js';

const router = Router();

// Protect all /users routes with authentication
router.use(requireAuth);

// PATCH /api/v1/users/me - Update student profile
router.patch('/me', validate(UpdateStudentProfileSchema), userController.updateProfile);

// POST /api/v1/users/request-organizer - Allows logged-in users to submit their club selection (sets organizerRequestStatus to pending)
router.post(
  '/request-organizer',
  validate(RequestOrganizerSchema),
  userController.requestOrganizer
);

// POST /api/v1/users/me/request-organizer - Backwards-compatible alias
router.post(
  '/me/request-organizer',
  userController.requestOrganizer
);

// GET /api/v1/users/organizer-requests - Fetches all users where organizerRequestStatus === 'pending' (Admin only)
router.get(
  '/organizer-requests',
  requireRole(['admin']),
  userController.getOrganizerRequests
);

// POST /api/v1/users/approve-organizer - Admin only: Approve with strict max 2 organizers per club check
router.post(
  '/approve-organizer',
  requireRole(['admin']),
  validate(ApproveOrganizerSchema),
  userController.approveOrganizer
);

// POST /api/v1/users/reject-organizer - Admin only: Reject organizer request
router.post(
  '/reject-organizer',
  requireRole(['admin']),
  validate(RejectOrganizerSchema),
  userController.rejectOrganizer
);

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
