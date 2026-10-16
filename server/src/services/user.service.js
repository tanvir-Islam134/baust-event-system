import { userRepository } from '../repositories/user.repository.js';
import { auth as firebaseAdminAuth } from '../config/firebase.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  UpdateStudentProfileSchema,
  AdminUpdateUserRoleSchema,
  ListUsersQuerySchema,
} from '../schemas/user.schema.js';

/**
 * Update the logged-in user's student academic profile.
 * @param {string} userId - Firebase UID
 * @param {object} profileData
 */
export const updateStudentProfile = async (userId, profileData) => {
  const validated = UpdateStudentProfileSchema.parse(profileData);

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updated = await userRepository.updateUser(userId, validated);
  return updated;
};

/**
 * Allow a logged-in user to submit an organizer request with club selection.
 * Sets organizerRequestStatus and organizerStatus to 'pending'.
 * @param {string} userId - Firebase UID
 * @param {{ clubAffiliation?: string, club?: string }} data
 */
export const submitOrganizerRequest = async (userId, data = {}) => {
  const club = data.clubAffiliation || data.club;
  if (!club || typeof club !== 'string' || !club.trim()) {
    throw new AppError('Club selection is required to request organizer privileges', 400);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'admin') {
    throw new AppError('Administrators already hold elevated management access', 400);
  }

  if (user.role === 'organizer' && user.clubAffiliation === club.trim()) {
    throw new AppError(`User is already an approved organizer for '${club.trim()}'`, 400);
  }

  const currentStatus = user.organizerRequestStatus || user.organizerStatus;
  if (currentStatus === 'pending' && user.clubAffiliation === club.trim()) {
    throw new AppError('An organizer access request for this club is already pending review', 400);
  }

  const updated = await userRepository.update(userId, {
    clubAffiliation: club.trim(),
    organizerRequestStatus: 'pending',
    organizerStatus: 'pending',
    organizerRejectionReason: null,
  });

  return updated;
};

/**
 * Backwards-compatible alias for requestOrganizerAccess.
 * @param {string} userId - Firebase UID
 * @param {string} [clubAffiliation]
 */
export const requestOrganizerAccess = async (userId, clubAffiliation = null) => {
  if (clubAffiliation) {
    return submitOrganizerRequest(userId, { clubAffiliation });
  }
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const updated = await userRepository.update(userId, {
    organizerRequestStatus: 'pending',
    organizerStatus: 'pending',
  });
  return updated;
};

/**
 * Admin only: Fetch all users with pending organizer status.
 */
export const getOrganizerRequests = async () => {
  return userRepository.findPendingOrganizers();
};

/**
 * Admin only: Approve an organizer request.
 * CRITICAL LOGIC:
 * 1. Checks current count of users where role === 'organizer' AND clubAffiliation === requested_club.
 * 2. If count >= 2, returns a 400 error: "Capacity Full: Maximum 2 organizers are allowed for this club."
 * 3. If < 2, updates user's role to 'organizer' and organizerRequestStatus to 'approved'.
 * @param {string} targetUserId - Target Firebase UID
 */
export const approveOrganizerRequest = async (targetUserId) => {
  return userRepository.runTransaction(async (transaction) => {
    const userRef = userRepository.collection.doc(targetUserId);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new AppError(`User with ID '${targetUserId}' not found`, 404);
    }
    const userData = userSnap.data();
    const club = userData.clubAffiliation;
    if (!club) {
      throw new AppError('User has not specified a club affiliation for organizer approval', 400);
    }

    // Query active organizers for this club
    const activeOrganizersQuery = userRepository.collection
      .where('role', '==', 'organizer')
      .where('clubAffiliation', '==', club);
    const activeOrganizersSnap = await transaction.get(activeOrganizersQuery);

    // Count how many users currently have role === 'organizer' AND clubAffiliation === requested_club
    // Filter out target user in case they already had role organizer
    const otherOrganizers = activeOrganizersSnap.docs.filter(
      (doc) => doc.id !== targetUserId
    );

    if (otherOrganizers.length >= 2) {
      throw new AppError('Capacity Full: Maximum 2 organizers are allowed for this club.', 400);
    }

    const timestamp = new Date();
    transaction.update(userRef, {
      role: 'organizer',
      organizerRequestStatus: 'approved',
      organizerStatus: 'approved',
      updatedAt: timestamp,
    });

    return {
      id: targetUserId,
      ...userData,
      role: 'organizer',
      organizerRequestStatus: 'approved',
      organizerStatus: 'approved',
      updatedAt: timestamp,
    };
  });
};

/**
 * Admin only: Reject an organizer request.
 * Sets organizerRequestStatus and organizerStatus to 'rejected'.
 * @param {string} targetUserId - Target Firebase UID
 * @param {string|null} [rejectionReason=null]
 */
export const rejectOrganizerRequest = async (targetUserId, rejectionReason = null) => {
  const user = await userRepository.findById(targetUserId);
  if (!user) {
    throw new AppError(`User with ID '${targetUserId}' not found`, 404);
  }

  const payload = {
    organizerRequestStatus: 'rejected',
    organizerStatus: 'rejected',
    ...(rejectionReason ? { organizerRejectionReason: rejectionReason } : {}),
  };

  const updated = await userRepository.update(targetUserId, payload);
  return updated;
};

/**
 * List all users with optional query filtering (Admin only).
 * @param {object} queryFilters
 */
export const listUsers = async (queryFilters) => {
  const validatedFilters = ListUsersQuerySchema.parse(queryFilters);
  return userRepository.findUsers(validatedFilters);
};

/**
 * Update a user's role and/or organizer status (Admin only).
 * @param {string} targetUserId - Target Firebase UID
 * @param {object} updateData - { role, organizerRequestStatus, organizerStatus, clubAffiliation }
 */
export const updateUserRoleAndStatus = async (targetUserId, updateData) => {
  const validated = AdminUpdateUserRoleSchema.parse(updateData);

  const user = await userRepository.findById(targetUserId);
  if (!user) {
    throw new AppError(`User with ID '${targetUserId}' not found`, 404);
  }

  const status = validated.organizerRequestStatus || validated.organizerStatus;

  // If promoting to organizer or approving, enforce max 2 organizers rule if club is known
  const targetClub = validated.clubAffiliation || user.clubAffiliation;
  if ((status === 'approved' || validated.role === 'organizer') && targetClub) {
    const currentOrganizersCount = await userRepository.countOrganizersByClub(targetClub);
    const isAlreadyOrganizer = user.role === 'organizer' && user.clubAffiliation === targetClub;
    if (!isAlreadyOrganizer && currentOrganizersCount >= 2) {
      throw new AppError('Capacity Full: Maximum 2 organizers are allowed for this club.', 400);
    }
  }

  const payload = {};
  if (validated.role) {
    payload.role = validated.role;
  }
  if (validated.clubAffiliation !== undefined) {
    payload.clubAffiliation = validated.clubAffiliation;
  }
  if (status) {
    payload.organizerRequestStatus = status;
    payload.organizerStatus = status;
    if (status === 'approved' && !validated.role) {
      payload.role = 'organizer';
    } else if (status === 'rejected' && user.role === 'organizer' && !validated.role) {
      payload.role = 'participant';
    }
  }

  const updated = await userRepository.update(targetUserId, payload);
  return updated;
};

/**
 * Permanently delete the user account from Firestore database and Firebase Auth.
 * @param {string} userId - Firebase UID
 */
export const deleteUserAccount = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // 1. Delete user document from Firestore database
  await userRepository.delete(userId);

  // 2. Delete user from Firebase Auth using Firebase Admin SDK (if configured)
  if (firebaseAdminAuth) {
    try {
      await firebaseAdminAuth.deleteUser(userId);
      console.log(`[Firebase Admin Auth] Successfully deleted user account record for ${userId}`);
    } catch (authErr) {
      console.warn(`[Firebase Admin Auth] Warning deleting user ${userId}:`, authErr.message);
    }
  }

  return { success: true, message: 'Account deleted successfully' };
};
