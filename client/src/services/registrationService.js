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

  /**
   * Fetch all pending event registrations for events created by the caller's assigned club (Organizer only).
   */
  getOrganizerPendingRegistrations: async () => {
    const response = await api.get('/registrations/organizer/pending');
    return response.data?.data || response.data;
  },

  /**
   * Approve a participant's event registration (Organizer only).
   * @param {string} registrationId
   */
  approveRegistration: async (registrationId) => {
    const response = await api.post(`/registrations/${registrationId}/approve`);
    return response.data?.data || response.data;
  },

  /**
   * Reject a participant's event registration (Organizer only).
   * @param {string} registrationId
   * @param {string} [rejectionReason]
   */
  rejectRegistration: async (registrationId, rejectionReason = '') => {
    const response = await api.post(`/registrations/${registrationId}/reject`, {
      rejectionReason,
    });
    return response.data?.data || response.data;
  },

  /**
   * Fetch all registered events for currently authenticated student.
   */
  getMyRegistrations: async () => {
    const response = await api.get('/registrations/my');
    return response.data?.data || response.data;
  },

  /**
   * Fetch full ticket and signed QR code for a specific registration.
   * @param {string} registrationId
   */
  getTicket: async (registrationId) => {
    const response = await api.get(`/registrations/${registrationId}/ticket`);
    return response.data?.data || response.data;
  },

  /**
   * Check in an attendee at the gate using scanned QR token or ticket code.
   * @param {{ qrToken?: string, ticketCode?: string, eventId?: string }} checkInData
   */
  checkInAttendee: async (checkInData) => {
    const response = await api.post('/registrations/check-in', checkInData);
    return response.data;
  },

  /**
   * Mark event item (food / tshirt) as collected by attendee.
   * @param {string} registrationId
   * @param {'food' | 'tshirt'} itemType
   */
  distributeItem: async (registrationId, itemType) => {
    const response = await api.post(`/registrations/${registrationId}/items/${itemType}`);
    return response.data?.data || response.data;
  },
};

export default registrationService;

