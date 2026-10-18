import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Admin Service handling administrative directory queries and organizer lifecycle management.
 */

/**
 * Fetch all approved organizers, sorted by their assigned Club/Society.
 * Ensures Name, Email, Student ID, Department, and assigned clubName/clubId are included.
 */
export const getApprovedOrganizers = async () => {
  const users = await userRepository.findApprovedOrganizers();

  const organizers = users.map((u) => {
    const clubAssigned = u.clubAffiliation || u.clubName || u.clubId || 'Unassigned';
    return {
      id: u.id,
      name: u.name || 'Unnamed Organizer',
      email: u.email,
      studentId: u.studentId || null,
      department: u.department || null,
      batch: u.batch || null,
      section: u.section || null,
      level: u.level || null,
      term: u.term || null,
      mobileNumber: u.mobileNumber || null,
      clubAffiliation: clubAssigned,
      clubName: clubAssigned,
      clubId: u.clubId || clubAssigned,
      role: u.role || 'organizer',
      organizerRequestStatus: u.organizerRequestStatus || 'approved',
      organizerStatus: u.organizerStatus || 'approved',
      createdAt: u.createdAt || null,
      updatedAt: u.updatedAt || null,
    };
  });

  // Sort by clubName / clubAffiliation ascending, then by name
  organizers.sort((a, b) => {
    const clubCompare = (a.clubName || '').localeCompare(b.clubName || '');
    if (clubCompare !== 0) return clubCompare;
    return (a.name || '').localeCompare(b.name || '');
  });

  return organizers;
};

/**
 * Demote or remove an organizer back to participant/student role.
 * Clears their club affiliation and resets request status.
 * @param {string} targetUserId - Target Firebase UID
 */
export const demoteOrganizer = async (targetUserId) => {
  const user = await userRepository.findById(targetUserId);
  if (!user) {
    throw new AppError(`User with ID '${targetUserId}' not found`, 404);
  }

  const updated = await userRepository.update(targetUserId, {
    role: 'participant',
    organizerRequestStatus: 'none',
    organizerStatus: 'none',
    clubAffiliation: null,
  });

  return updated;
};

