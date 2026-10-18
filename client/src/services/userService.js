import api from './api.js';

/**
 * Service handling user profile and administrative role management API calls.
 */
export const userService = {
  /**
   * Update current user's student profile (batch, section, level, term).
   * @param {{ batch?: string|null, section?: string|null, level?: number|string|null, term?: number|string|null }} profileData
   */
  updateMyProfile: async (profileData) => {
    const response = await api.patch('/users/me', profileData);
    return response.data?.data || response.data;
  },

  /**
   * Submit an organizer status request with club selection.
   * @param {{ clubAffiliation: string }} data
   */
  requestOrganizer: async (data) => {
    const response = await api.post('/users/request-organizer', data);
    return response.data?.data || response.data;
  },

  /**
   * Submit an organizer status request (backward compatible alias).
   */
  requestOrganizerAccess: async (data = {}) => {
    const response = await api.post('/users/request-organizer', data);
    return response.data?.data || response.data;
  },

  /**
   * Fetch all users where organizerRequestStatus === 'pending' (Admin only).
   */
  getOrganizerRequests: async () => {
    const response = await api.get('/users/organizer-requests');
    return response.data?.data || response.data;
  },

  /**
   * Approve an organizer request (Admin only). Enforces max 2 organizers per club limit.
   * @param {string} userId - Target user Firebase UID
   */
  approveOrganizer: async (userId) => {
    const response = await api.post('/users/approve-organizer', { userId });
    return response.data?.data || response.data;
  },

  /**
   * Reject an organizer request (Admin only).
   * @param {string} userId - Target user Firebase UID
   * @param {string} [rejectionReason]
   */
  rejectOrganizer: async (userId, rejectionReason = null) => {
    const response = await api.post('/users/reject-organizer', { userId, rejectionReason });
    return response.data?.data || response.data;
  },

  /**
   * List all users with optional query filters (Admin only).
   * @param {{ role?: 'admin'|'organizer'|'participant'|'guest', organizerStatus?: 'none'|'pending'|'approved'|'rejected', organizerRequestStatus?: 'none'|'pending'|'approved'|'rejected', clubAffiliation?: string }} [params]
   */
  listUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data?.data || response.data;
  },

  /**
   * Update a specific user's role and/or organizer status (Admin only).
   * @param {string} userId - Target user Firebase UID
   * @param {{ role?: 'admin'|'organizer'|'participant'|'guest', organizerStatus?: 'none'|'pending'|'approved'|'rejected', organizerRequestStatus?: 'none'|'pending'|'approved'|'rejected', clubAffiliation?: string }} data
   */
  updateUserRole: async (userId, data) => {
    const response = await api.patch(`/users/${userId}/role`, data);
    return response.data?.data || response.data;
  },

  /**
   * Permanently delete currently authenticated user account.
   */
  deleteMyAccount: async () => {
    const response = await api.delete('/users/me');
    return response.data?.data || response.data;
  },

  /**
   * Fetch all approved organizers grouped/sorted by Club/Society (Admin only).
   */
  getApprovedOrganizers: async () => {
    const response = await api.get('/admin/organizers');
    return response.data?.data || response.data;
  },

  /**
   * Demote or remove an organizer back to student/participant (Admin only).
   * @param {string} userId - Target user Firebase UID
   */
  demoteOrganizer: async (userId) => {
    const response = await api.post(`/admin/organizers/${userId}/demote`);
    return response.data?.data || response.data;
  },
};

export default userService;
