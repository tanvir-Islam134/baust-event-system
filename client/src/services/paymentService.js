import api from './api.js';

/**
 * Service handling bKash Payment Gateway requests.
 */
export const paymentService = {
  /**
   * Initialize a bKash checkout payment session for an event.
   * @param {object} payload - { eventId, guest, tshirtSize, foodType, batch, section, level, term }
   */
  createBkashPayment: async (payload) => {
    const response = await api.post('/payments/bkash/create', payload);
    return response.data?.data || response.data;
  },

  /**
   * Execute bKash payment with payer phone and PIN to capture funds and issue ticket.
   * @param {object} payload - { paymentID, payerPhone, otp, pin }
   */
  executeBkashPayment: async (payload) => {
    const response = await api.post('/payments/bkash/execute', payload);
    return response.data?.data || response.data;
  },

  /**
   * Query payment session status.
   * @param {string} paymentID
   */
  queryBkashPayment: async (paymentID) => {
    const response = await api.get(`/payments/bkash/query/${paymentID}`);
    return response.data?.data || response.data;
  },
};

export default paymentService;
