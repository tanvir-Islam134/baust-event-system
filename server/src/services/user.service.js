import { userRepository } from '../repositories/user.repository.js';
import { auth as firebaseAdminAuth } from '../config/firebase.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  UpdateStudentProfileSchema,
  AdminUpdateUserRoleSchema,
  ListUsersQuerySchema,
} from '../schemas/user.schema.js';

/**
 * Helper to format user response by merging the active role's isolated profile data.
 * Guarantees that Participant, Organizer, and Admin profiles are completely separate.
 */
export const formatUserResponse = (user, activeRole = null) => {
  if (!user) return null;
  const role = activeRole || user.role || 'participant';
  const roleProfiles = user.roleProfiles || {};
  const currentRoleData = roleProfiles[role] || {};

  return {
    uid: user.id || user.uid,
    id: user.id || user.uid,
    name: user.name,
    email: user.email,
    role: user.role,
    photoURL: user.photoURL || null,
    roleProfiles,
    // Active role specific values merged
    department: currentRoleData.department !== undefined ? currentRoleData.department : (role === 'participant' ? user.department : null),
    studentId: currentRoleData.studentId !== undefined ? currentRoleData.studentId : (role === 'participant' ? user.studentId : null),
    mobileNumber: currentRoleData.mobileNumber !== undefined ? currentRoleData.mobileNumber : (user.mobileNumber || null),
    batch: currentRoleData.batch !== undefined ? currentRoleData.batch : (role === 'participant' ? user.batch : null),
    section: currentRoleData.section !== undefined ? currentRoleData.section : (role === 'participant' ? user.section : null),
    level: currentRoleData.level !== undefined ? currentRoleData.level : (role === 'participant' ? user.level : null),
    term: currentRoleData.term !== undefined ? currentRoleData.term : (role === 'participant' ? user.term : null),
    clubAffiliation: role === 'organizer'
      ? (currentRoleData.clubAffiliation !== undefined ? currentRoleData.clubAffiliation : (user.clubAffiliation || null))
      : null,
    designation: currentRoleData.designation !== undefined ? currentRoleData.designation : (user.designation || null),
    office: currentRoleData.office !== undefined ? currentRoleData.office : (user.office || null),
    officeLocation: currentRoleData.officeLocation !== undefined ? currentRoleData.officeLocation : (user.officeLocation || null),
    authorityScope: currentRoleData.authorityScope !== undefined ? currentRoleData.authorityScope : (user.authorityScope || null),
    bio: currentRoleData.bio !== undefined ? currentRoleData.bio : (user.bio || null),
    organizerRequestStatus: user.organizerRequestStatus || user.organizerStatus || 'none',
    organizerStatus: user.organizerRequestStatus || user.organizerStatus || 'none',
    organizerRejectionReason: user.organizerRejectionReason || null,
    organizerApplicationDetails: user.organizerApplicationDetails || null,
  };
};

/**
 * Update the logged-in user's profile strictly for their active role.
 * Guarantees that updating information in one role NEVER modifies other roles' data.
 * @param {string} userId - Firebase UID
 * @param {object} profileData
 * @param {string} [callerRole] - Active role from req.user.role
 */
export const updateStudentProfile = async (userId, profileData, callerRole = null) => {
  const validated = UpdateStudentProfileSchema.parse(profileData);

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const role = callerRole || user.role || 'participant';
  const roleProfiles = { ...(user.roleProfiles || {}) };
  const currentRoleProfile = { ...(roleProfiles[role] || {}) };

  // Filter out top-level metadata like name, photoURL
  const roleSpecificFields = { ...validated };
  delete roleSpecificFields.photoURL;

  // Build the updated sub-profile for this specific role
  const updatedRoleProfile = {
    ...currentRoleProfile,
    ...roleSpecificFields,
    updatedAt: new Date().toISOString(),
  };

  roleProfiles[role] = updatedRoleProfile;

  const topLevelUpdates = {
    roleProfiles,
    updatedAt: new Date(),
  };

  if (validated.name) {
    topLevelUpdates.name = validated.name.trim();
  }
  if (validated.photoURL !== undefined) {
    topLevelUpdates.photoURL = validated.photoURL;
  }

  // Update top-level mirror for whichever role is currently active
  if (role === 'participant') {
    topLevelUpdates.department = validated.department !== undefined ? validated.department : (currentRoleProfile.department || null);
    topLevelUpdates.studentId = validated.studentId !== undefined ? validated.studentId : (currentRoleProfile.studentId || null);
    topLevelUpdates.mobileNumber = validated.mobileNumber !== undefined ? validated.mobileNumber : (currentRoleProfile.mobileNumber || null);
    topLevelUpdates.batch = validated.batch !== undefined ? validated.batch : (currentRoleProfile.batch || null);
    topLevelUpdates.section = validated.section !== undefined ? validated.section : (currentRoleProfile.section || null);
    topLevelUpdates.level = validated.level !== undefined ? validated.level : (currentRoleProfile.level || null);
    topLevelUpdates.term = validated.term !== undefined ? validated.term : (currentRoleProfile.term || null);
  } else if (role === 'organizer') {
    topLevelUpdates.clubAffiliation = validated.clubAffiliation !== undefined ? validated.clubAffiliation : (currentRoleProfile.clubAffiliation || user.clubAffiliation || null);
    topLevelUpdates.department = validated.department !== undefined ? validated.department : (currentRoleProfile.department || null);
    topLevelUpdates.designation = validated.designation !== undefined ? validated.designation : (currentRoleProfile.designation || null);
    topLevelUpdates.mobileNumber = validated.mobileNumber !== undefined ? validated.mobileNumber : (currentRoleProfile.mobileNumber || null);
    topLevelUpdates.officeLocation = validated.officeLocation !== undefined ? validated.officeLocation : (currentRoleProfile.officeLocation || null);
    topLevelUpdates.bio = validated.bio !== undefined ? validated.bio : (currentRoleProfile.bio || null);
  } else if (role === 'admin') {
    topLevelUpdates.office = validated.office !== undefined ? validated.office : (currentRoleProfile.office || null);
    topLevelUpdates.designation = validated.designation !== undefined ? validated.designation : (currentRoleProfile.designation || null);
    topLevelUpdates.mobileNumber = validated.mobileNumber !== undefined ? validated.mobileNumber : (currentRoleProfile.mobileNumber || null);
    topLevelUpdates.officeLocation = validated.officeLocation !== undefined ? validated.officeLocation : (currentRoleProfile.officeLocation || null);
    topLevelUpdates.authorityScope = validated.authorityScope !== undefined ? validated.authorityScope : (currentRoleProfile.authorityScope || null);
  }

  const updated = await userRepository.update(userId, topLevelUpdates);
  return formatUserResponse(updated, role);
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

  const targetClub = club.trim();
  const applicationDetails = {
    name: data.name?.trim() || user.name || '',
    studentId: data.studentId?.trim() || user.studentId || '',
    batch: data.batch?.trim() || user.batch || '',
    department: data.department?.trim() || user.department || '',
    mobileNumber: data.mobileNumber?.trim() || user.mobileNumber || '',
    clubAffiliation: targetClub,
    designation: data.designation?.trim() || 'Club Organizer',
    reason: data.reason?.trim() || data.statement?.trim() || '',
    appliedAt: new Date().toISOString(),
  };

  const updatePayload = {
    clubAffiliation: targetClub,
    organizerRequestStatus: 'pending',
    organizerStatus: 'pending',
    organizerRejectionReason: null,
    organizerApplicationDetails: applicationDetails,
  };

  if (data.name?.trim()) updatePayload.name = data.name.trim();
  if (data.studentId?.trim()) updatePayload.studentId = data.studentId.trim();
  if (data.batch?.trim()) updatePayload.batch = data.batch.trim();
  if (data.department?.trim()) updatePayload.department = data.department.trim();
  if (data.mobileNumber?.trim()) updatePayload.mobileNumber = data.mobileNumber.trim();
  if (data.designation?.trim()) updatePayload.designation = data.designation.trim();

  const updated = await userRepository.update(userId, updatePayload);

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
    const appDetails = userData.organizerApplicationDetails || {};
    const club = userData.clubAffiliation || appDetails.clubAffiliation;
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

    // Prepare updated roleProfiles so the organizer role has its own complete profile
    const roleProfiles = { ...(userData.roleProfiles || {}) };
    const organizerProfile = { ...(roleProfiles.organizer || {}) };
    organizerProfile.clubAffiliation = club;
    organizerProfile.designation = appDetails.designation || userData.designation || organizerProfile.designation || 'Club Organizer';
    if (appDetails.department || userData.department) {
      organizerProfile.department = appDetails.department || userData.department;
    }
    if (appDetails.mobileNumber || userData.mobileNumber) {
      organizerProfile.mobileNumber = appDetails.mobileNumber || userData.mobileNumber;
    }
    if (appDetails.reason) {
      organizerProfile.bio = appDetails.reason;
    }
    organizerProfile.updatedAt = timestamp.toISOString();
    roleProfiles.organizer = organizerProfile;

    const updateFields = {
      role: 'organizer',
      clubAffiliation: club,
      designation: organizerProfile.designation,
      roleProfiles,
      organizerRequestStatus: 'approved',
      organizerStatus: 'approved',
      updatedAt: timestamp,
    };

    transaction.update(userRef, updateFields);

    return {
      id: targetUserId,
      ...userData,
      ...updateFields,
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
 * Acknowledge and dismiss an organizer application rejection notice.
 * Resets organizerRequestStatus and organizerStatus to 'none'.
 * @param {string} userId - Target user Firebase UID
 */
export const dismissOrganizerRejection = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(`User with ID '${userId}' not found`, 404);
  }

  const updated = await userRepository.update(userId, {
    organizerRequestStatus: 'none',
    organizerStatus: 'none',
    organizerRejectionReason: null,
  });
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
    // When changing/demoting role away from organizer, automatically revoke organizer status & club affiliation
    if (validated.role !== 'organizer') {
      if (validated.organizerRequestStatus === undefined && validated.organizerStatus === undefined) {
        payload.organizerRequestStatus = 'none';
        payload.organizerStatus = 'none';
      }
      if (validated.clubAffiliation === undefined) {
        payload.clubAffiliation = null;
      }
    } else {
      // If setting directly to organizer role, ensure status is approved
      if (validated.organizerRequestStatus === undefined && validated.organizerStatus === undefined) {
        payload.organizerRequestStatus = 'approved';
        payload.organizerStatus = 'approved';
      }
    }
  }
  if (validated.clubAffiliation !== undefined) {
    payload.clubAffiliation = validated.clubAffiliation;
  }
  if (status) {
    payload.organizerRequestStatus = status;
    payload.organizerStatus = status;
    if (status === 'approved' && !validated.role) {
      payload.role = 'organizer';
    } else if ((status === 'rejected' || status === 'none') && !validated.role && user.role === 'organizer') {
      payload.role = 'participant';
      payload.clubAffiliation = null;
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

export { getApprovedOrganizers, demoteOrganizer } from './admin.service.js';

