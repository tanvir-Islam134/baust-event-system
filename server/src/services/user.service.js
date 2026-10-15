import { userRepository } from '../repositories/user.repository.js';
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
 * Allow a participant to request organizer access (sets organizerStatus to 'pending').
 * @param {string} userId - Firebase UID
 */
export const requestOrganizerAccess = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'admin' || user.role === 'organizer') {
    throw new AppError(`User already holds role '${user.role}'`, 400);
  }

  if (user.organizerStatus === 'pending') {
    throw new AppError('An organizer access request is already pending review', 400);
  }

  if (user.organizerStatus === 'approved') {
    throw new AppError('Organizer access has already been granted', 400);
  }

  const updated = await userRepository.updateOrganizerStatus(userId, 'pending');
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
 * @param {object} updateData - { role, organizerStatus }
 */
export const updateUserRoleAndStatus = async (targetUserId, updateData) => {
  const validated = AdminUpdateUserRoleSchema.parse(updateData);

  const user = await userRepository.findById(targetUserId);
  if (!user) {
    throw new AppError(`User with ID '${targetUserId}' not found`, 404);
  }

  const payload = {};
  if (validated.role) {
    payload.role = validated.role;
  }
  if (validated.organizerStatus) {
    payload.organizerStatus = validated.organizerStatus;
    // Auto-align role if organizerStatus is approved or rejected
    if (validated.organizerStatus === 'approved' && !validated.role) {
      payload.role = 'organizer';
    } else if (validated.organizerStatus === 'rejected' && user.role === 'organizer' && !validated.role) {
      payload.role = 'participant';
    }
  }

  const updated = await userRepository.updateUser(targetUserId, payload);
  return updated;
};

