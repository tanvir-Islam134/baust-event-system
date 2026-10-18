import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import * as adminController from '../../controllers/admin.controller.js';

const router = Router();

// Protect all admin routes with authentication and admin role requirement
router.use(requireAuth);
router.use(requireRole(['admin']));

// GET /api/v1/admin/organizers - Fetch all approved organizers grouped/sorted by Club/Society
router.get('/organizers', adminController.getApprovedOrganizers);

// POST /api/v1/admin/organizers/:id/demote - Demote an organizer back to student
router.post('/organizers/:id/demote', adminController.demoteOrganizer);

// DELETE /api/v1/admin/organizers/:id - Delete / Demote organizer role alias
router.delete('/organizers/:id', adminController.demoteOrganizer);

export default router;

