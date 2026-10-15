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
   * Submit an organizer status request for the currently logged-in participant.
   */
  requestOrganizerAccess: async () => {
    const response = await api.post('/users/me/request-organizer');
    return response.data?.data || response.data;
  },

  /**
   * List all users with optional query filters (Admin only).
   * @param {{ role?: 'admin'|'organizer'|'participant'|'guest', organizerStatus?: 'none'|'pending'|'approved'|'rejected' }} [params]
   */
  listUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data?.data || response.data;
  },

  /**
   * Update a specific user's role and/or organizer status (Admin only).
   * @param {string} userId - Target user Firebase UID
   * @param {{ role?: 'admin'|'organizer'|'participant'|'guest', organizerStatus?: 'none'|'pending'|'approved'|'rejected' }} data
   */
  updateUserRole: async (userId, data) => {
    const response = await api.patch(`/users/${userId}/role`, data);
    return response.data?.data || response.data;
  },
};

export default userService;

