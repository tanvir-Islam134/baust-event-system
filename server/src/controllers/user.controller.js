import * as userService from '../services/user.service.js';
import { AppError } from '../middlewares/errorHandler.js';

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
 * POST /api/v1/users/request-organizer & POST /api/v1/users/me/request-organizer
 * Submit organizer role request with club affiliation selection.
 */
export const requestOrganizer = async (req, res, next) => {
  try {
    const updatedUser = await userService.submitOrganizerRequest(req.user.uid, req.body);
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
 * GET /api/v1/users/organizer-requests
 * Admin only: Fetch all users where organizerRequestStatus === 'pending'.
 */
export const getOrganizerRequests = async (req, res, next) => {
  try {
    const requests = await userService.getOrganizerRequests();
    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/approve-organizer
 * Admin only: Approve an organizer request (max 2 organizers per club).
 */
export const approveOrganizer = async (req, res, next) => {
  try {
    const targetUserId = req.body?.userId || req.body?.id;
    if (!targetUserId) {
      throw new AppError('userId is required', 400);
    }
    const updatedUser = await userService.approveOrganizerRequest(targetUserId);
    res.status(200).json({
      success: true,
      message: 'Organizer request approved successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/reject-organizer
 * Admin only: Reject an organizer request.
 */
export const rejectOrganizer = async (req, res, next) => {
  try {
    const targetUserId = req.body?.userId || req.body?.id;
    if (!targetUserId) {
      throw new AppError('userId is required', 400);
    }
    const rejectionReason = req.body?.rejectionReason || req.body?.reason || null;
    const updatedUser = await userService.rejectOrganizerRequest(targetUserId, rejectionReason);
    res.status(200).json({
      success: true,
      message: 'Organizer request rejected successfully',
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

/**
 * DELETE /api/v1/users/me
 * Permanently delete current logged-in user account.
 */
export const deleteMyAccount = async (req, res, next) => {
  try {
    await userService.deleteUserAccount(req.user.uid);
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/organizers
 * Admin only: Fetch all approved organizers.
 */
export const getApprovedOrganizers = async (req, res, next) => {
  try {
    const organizers = await userService.getApprovedOrganizers();
    res.status(200).json({
      success: true,
      count: organizers.length,
      data: organizers,
    });
  } catch (error) {
    next(error);
  }
};

