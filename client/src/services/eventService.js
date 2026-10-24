import api from './api.js';

/**
 * Service handling event discovery, creation, and administrative approval API calls.
 */
export const eventService = {
  /**
   * Create an event under pending review (Organizer or Admin).
   * @param {object} eventData
   */
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data?.data || response.data;
  },

  /**
   * Get all approved public events with optional filters (clubName, search).
   * @param {object} [params={}]
   */
  getApprovedEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data?.data || response.data;
  },

  /**
   * Get events created by current organizer/admin.
   */
  getMyEvents: async () => {
    const response = await api.get('/events/my-events');
    return response.data?.data || response.data;
  },

  /**
   * Get pending events awaiting review (Admin only).
   */
  getAdminQueue: async () => {
    const response = await api.get('/events/admin/queue');
    return response.data?.data || response.data;
  },

  /**
   * Get event details by ID.
   * @param {string} id - Event ID
   */
  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Update event review status (Admin only).
   * @param {string} id - Event ID
   * @param {{ status: 'approved' | 'rejected' | 'completed', rejectionReason?: string | null }} data
   */
  updateEventStatus: async (id, data) => {
    const response = await api.patch(`/events/${id}/status`, data);
    return response.data?.data || response.data;
  },
};

export default eventService;

