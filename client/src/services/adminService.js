import api from './api.js';

/**
 * Service handling Admin-specific dashboard and directory operations.
 */
export const adminService = {
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

export default adminService;

