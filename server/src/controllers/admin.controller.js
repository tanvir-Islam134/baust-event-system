import * as adminService from '../services/admin.service.js';

/**
 * GET /api/v1/admin/organizers
 * Admin-only: Fetch all approved organizers grouped/sorted by Club/Society.
 */
export const getApprovedOrganizers = async (req, res, next) => {
  try {
    const organizers = await adminService.getApprovedOrganizers();
    res.status(200).json({
      success: true,
      count: organizers.length,
      data: organizers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/organizers/:id/demote
 * DELETE /api/v1/admin/organizers/:id
 * Admin-only: Demote an organizer back to participant and remove club assignment.
 */
export const demoteOrganizer = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const updatedUser = await adminService.demoteOrganizer(targetUserId);
    res.status(200).json({
      success: true,
      message: 'Organizer demoted to student successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

