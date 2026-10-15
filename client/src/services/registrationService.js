import api from './api.js';

/**
 * Service handling attendee event registration and administrative cancellations.
 */
export const registrationService = {
  /**
   * Register for an event (authenticated participant or guest).
   * @param {object} registrationData
   */
  createRegistration: async (registrationData) => {
    const response = await api.post('/registrations', registrationData);
    return response.data?.data || response.data;
  },

  /**
   * List all registrations for a specific event (Organizer or Admin).
   * @param {string} eventId
   * @param {{ paymentStatus?: 'pending'|'paid'|'failed'|'refunded' }} [params]
   */
  getEventRegistrations: async (eventId, params = {}) => {
    const response = await api.get(`/registrations/event/${eventId}`, { params });
    return response.data?.data || response.data;
  },

  /**
   * Cancel an event registration atomically (Admin only).
   * @param {string} registrationId
   */
  cancelRegistration: async (registrationId) => {
    const response = await api.post(`/registrations/${registrationId}/cancel`);
    return response.data;
  },
};

export default registrationService;

