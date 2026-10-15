import { BaseRepository } from './base.repository.js';
import { UserSchema, UpdateUserSchema, OrganizerStatusUpdateSchema } from '../schemas/user.schema.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Upsert a user document keyed by Firebase UID.
   * @param {string} firebaseUid
   * @param {object} userData
   */
  async upsertUser(firebaseUid, userData) {
    const validated = UserSchema.parse(userData);
    return this.create(validated, firebaseUid);
  }

  /**
   * Update specific user fields.
   * @param {string} firebaseUid
   * @param {object} updateData
   */
  async updateUser(firebaseUid, updateData) {
    const validated = UpdateUserSchema.parse(updateData);
    return this.update(firebaseUid, validated);
  }

  /**
   * Update user organizer request status.
   * @param {string} firebaseUid
   * @param {'none' | 'pending' | 'approved' | 'rejected'} status
   */
  async updateOrganizerStatus(firebaseUid, status) {
    OrganizerStatusUpdateSchema.parse({ organizerStatus: status });
    const updatePayload = {
      organizerStatus: status,
      ...(status === 'approved' ? { role: 'organizer' } : {}),
    };
    return this.update(firebaseUid, updatePayload);
  }

  /**
   * Query all users with pending organizer status.
   */
  async findPendingOrganizers() {
    return this.find([['organizerStatus', '==', 'pending']], {
      orderBy: ['createdAt', 'asc'],
    });
  }

  /**
   * Query users by role.
   * @param {'admin' | 'organizer' | 'participant' | 'guest'} role
   */
  async findByRole(role) {
    return this.find([['role', '==', role]], {
      orderBy: ['createdAt', 'desc'],
    });
  }
}

export const userRepository = new UserRepository();

