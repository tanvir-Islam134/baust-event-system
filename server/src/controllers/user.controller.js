import * as userService from '../services/user.service.js';

/**
 * PATCH /api/v1/users/me
 * Update logged-in user's own student profile.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateStudentProfile(req.user.uid, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/me/request-organizer
 * Request organizer privileges for current participant.
 */
export const requestOrganizer = async (req, res, next) => {
  try {
    const updatedUser = await userService.requestOrganizerAccess(req.user.uid);
    res.status(200).json({
      success: true,
      message: 'Organizer request submitted successfully and is pending administrative review',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users
 * Admin only: List all users with optional filters.
 */
export const listUsers = async (req, res, next) => {
  try {
    const users = await userService.listUsers(req.query);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/role
 * Admin only: Update a target user's role and organizer status.
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUserRoleAndStatus(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'User role and status updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

