import * as userService from '../services/user.service.js';
import * as notifService from '../services/notification.service.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * PATCH /api/v1/users/me
 * Update logged-in user's own student profile.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateStudentProfile(req.user.uid, req.body, req.user?.role);
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
 * Creates an admin notification document and emits Socket.io event.
 */
export const requestOrganizer = async (req, res, next) => {
  try {
    const updatedUser = await userService.submitOrganizerRequest(req.user.uid, req.body);
    const targetClub = req.body?.clubAffiliation || req.body?.club || updatedUser.clubAffiliation || 'Club';
    const appDetails = updatedUser.organizerApplicationDetails || {};

    // Create Notification document for Admin
    let notification = null;
    try {
      notification = await notifService.createAdminNotification({
        senderId: req.user.uid,
        senderName: appDetails.name || updatedUser.name || req.user.name || 'Student Applicant',
        senderEmail: updatedUser.email || req.user.email,
        type: 'new_organizer_request',
        title: 'New Organizer Request',
        message: `${appDetails.name || updatedUser.name || 'A student'} has applied for ${appDetails.designation || 'Organizer'} role for ${targetClub}.`,
        data: {
          clubAffiliation: targetClub,
          department: appDetails.department || updatedUser.department || null,
          studentId: appDetails.studentId || updatedUser.studentId || null,
          batch: appDetails.batch || updatedUser.batch || null,
          mobileNumber: appDetails.mobileNumber || updatedUser.mobileNumber || null,
          designation: appDetails.designation || null,
          reason: appDetails.reason || null,
        },
      });
    } catch (notifErr) {
      console.warn('[UserController] Notification creation error:', notifErr.message);
    }

    // Emit real-time Socket.io event if socket instance exists
    const io = req.app.get('io');
    if (io) {
      try {
        io.to('admin_room').emit('new_organizer_request', {
          notification,
          applicant: {
            id: req.user.uid,
            name: appDetails.name || updatedUser.name,
            email: updatedUser.email,
            clubAffiliation: targetClub,
            designation: appDetails.designation,
            studentId: appDetails.studentId || updatedUser.studentId,
            batch: appDetails.batch || updatedUser.batch,
            department: appDetails.department || updatedUser.department,
            mobileNumber: appDetails.mobileNumber || updatedUser.mobileNumber,
            reason: appDetails.reason,
          },
        });
      } catch (socketErr) {
        console.warn('[UserController] Socket emit error:', socketErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Organizer request submitted successfully and is pending administrative review',
      data: updatedUser,
      notification,
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

    // Auto-mark any pending admin notifications for this applicant as read
    try {
      await notifService.markOrganizerRequestsAsRead(targetUserId);
    } catch (readErr) {
      console.warn('[UserController] markOrganizerRequestsAsRead error:', readErr.message);
    }

    // Notify applicant
    try {
      await notifService.createOrganizerNotification({
        recipientId: targetUserId,
        type: 'organizer_request_approved',
        title: 'Organizer Application Approved',
        message: `Congratulations! Your organizer privileges for ${updatedUser.clubAffiliation || 'your club'} have been approved.`,
        data: {
          role: 'organizer',
          clubAffiliation: updatedUser.clubAffiliation,
        },
      });
    } catch (notifErr) {
      console.warn('[UserController] Approve notification error:', notifErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      try {
        io.to(`user_${targetUserId}`).emit('organizer_status_updated', {
          status: 'approved',
          role: 'organizer',
          clubAffiliation: updatedUser.clubAffiliation,
        });
        io.to('admin_room').emit('organizer_request_processed', {
          userId: targetUserId,
          status: 'approved',
        });
      } catch (ioErr) {
        console.warn('[UserController] Socket emit error:', ioErr.message);
      }
    }

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

    // Auto-mark any pending admin notifications for this applicant as read
    try {
      await notifService.markOrganizerRequestsAsRead(targetUserId);
    } catch (readErr) {
      console.warn('[UserController] markOrganizerRequestsAsRead error:', readErr.message);
    }

    // Notify applicant
    try {
      await notifService.createOrganizerNotification({
        recipientId: targetUserId,
        type: 'organizer_request_rejected',
        title: 'Organizer Request Declined',
        message: rejectionReason
          ? `Your organizer request for ${updatedUser.clubAffiliation || 'the club'} was declined: ${rejectionReason}`
          : `Your organizer request for ${updatedUser.clubAffiliation || 'the club'} was not approved by administration.`,
        data: {
          status: 'rejected',
          rejectionReason,
          clubAffiliation: updatedUser.clubAffiliation,
        },
      });
    } catch (notifErr) {
      console.warn('[UserController] Reject notification error:', notifErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      try {
        io.to(`user_${targetUserId}`).emit('organizer_status_updated', {
          status: 'rejected',
          rejectionReason,
          clubAffiliation: updatedUser.clubAffiliation,
        });
        io.to('admin_room').emit('organizer_request_processed', {
          userId: targetUserId,
          status: 'rejected',
        });
      } catch (ioErr) {
        console.warn('[UserController] Socket emit error:', ioErr.message);
      }
    }

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
 * POST /api/v1/users/me/dismiss-rejection
 * Dismiss/acknowledge a declined organizer request notice.
 */
export const dismissOrganizerRejection = async (req, res, next) => {
  try {
    const updated = await userService.dismissOrganizerRejection(req.user.uid);
    res.status(200).json({
      success: true,
      message: 'Declined notice dismissed successfully',
      data: updated,
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

