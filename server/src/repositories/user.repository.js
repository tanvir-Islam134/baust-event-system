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
   * Update user organizer request status and optional club affiliation.
   * @param {string} firebaseUid
   * @param {'none' | 'pending' | 'approved' | 'rejected'} status
   * @param {string|null} [clubAffiliation=null]
   */
  async updateOrganizerStatus(firebaseUid, status, clubAffiliation = null) {
    OrganizerStatusUpdateSchema.parse({
      organizerRequestStatus: status,
      organizerStatus: status,
      ...(clubAffiliation ? { clubAffiliation } : {}),
    });

    const updatePayload = {
      organizerRequestStatus: status,
      organizerStatus: status,
      ...(clubAffiliation ? { clubAffiliation } : {}),
      ...(status === 'approved' ? { role: 'organizer' } : {}),
    };
    return this.update(firebaseUid, updatePayload);
  }

  /**
   * Query all users with pending organizer status.
   */
  async findPendingOrganizers() {
    // Query users where organizerRequestStatus is pending or organizerStatus is pending
    const byReqStatus = await this.find([['organizerRequestStatus', '==', 'pending']]);
    const byStatus = await this.find([['organizerStatus', '==', 'pending']]);

    const userMap = new Map();
    for (const u of [...byReqStatus, ...byStatus]) {
      userMap.set(u.id, u);
    }

    const results = Array.from(userMap.values());
    results.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    return results;
  }

  /**
   * Count how many active organizers are currently assigned to a specific club.
   * @param {string} clubAffiliation
   * @returns {Promise<number>}
   */
  async countOrganizersByClub(clubAffiliation) {
    if (!clubAffiliation) return 0;
    const organizers = await this.find([
      ['role', '==', 'organizer'],
      ['clubAffiliation', '==', clubAffiliation],
    ]);
    return organizers.length;
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

  /**
   * Find users matching optional filters (role, organizerRequestStatus/organizerStatus, clubAffiliation).
   * @param {{ role?: string, organizerRequestStatus?: string, organizerStatus?: string, clubAffiliation?: string }} [filters={}]
   */
  async findUsers(filters = {}) {
    const queryFilters = [];
    if (filters.role) {
      queryFilters.push(['role', '==', filters.role]);
    }
    const status = filters.organizerRequestStatus || filters.organizerStatus;
    if (status) {
      queryFilters.push(['organizerRequestStatus', '==', status]);
    }
    if (filters.clubAffiliation) {
      queryFilters.push(['clubAffiliation', '==', filters.clubAffiliation]);
    }

    if (queryFilters.length > 0) {
      return this.find(queryFilters, { orderBy: ['createdAt', 'desc'] });
    }
    return this.findAll();
  }

  /**
   * Query all approved organizers.
   * Fetches users with role === 'organizer' or organizerRequestStatus/organizerStatus === 'approved',
   * excluding pending or rejected ones.
   */
  async findApprovedOrganizers() {
    const byRole = await this.find([['role', '==', 'organizer']]);
    const byApprovedReq = await this.find([['organizerRequestStatus', '==', 'approved']]);
    const byApprovedStatus = await this.find([['organizerStatus', '==', 'approved']]);

    const userMap = new Map();
    for (const u of [...byRole, ...byApprovedReq, ...byApprovedStatus]) {
      const isPending = u.organizerRequestStatus === 'pending' || u.organizerStatus === 'pending';
      const isRejected = u.organizerRequestStatus === 'rejected' || u.organizerStatus === 'rejected';
      const isApprovedRole = u.role === 'organizer';
      const isApprovedStatus = u.organizerRequestStatus === 'approved' || u.organizerStatus === 'approved';

      if ((isApprovedRole || isApprovedStatus) && !isPending && !isRejected) {
        userMap.set(u.id, u);
      }
    }

    const results = Array.from(userMap.values());
    results.sort((a, b) => {
      const clubA = (a.clubAffiliation || a.clubName || a.clubId || 'Unassigned').toLowerCase();
      const clubB = (b.clubAffiliation || b.clubName || b.clubId || 'Unassigned').toLowerCase();
      if (clubA < clubB) return -1;
      if (clubA > clubB) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return results;
  }
}

export const userRepository = new UserRepository();
