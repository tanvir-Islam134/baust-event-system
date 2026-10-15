import api from './api.js';

/**
 * Service handling financial tracking (Expenses and Incomes) API calls.
 */
export const financeService = {
  /**
   * Record a new expense for an event (Organizer or Admin).
   * @param {{ eventId: string, category: string, amount: number, note?: string|null, receiptUrl?: string|null }} data
   */
  createExpense: async (data) => {
    const response = await api.post('/finances/expenses', data);
    return response.data?.data || response.data;
  },

  /**
   * List all expenses for an event with totals.
   * @param {string} eventId
   * @param {{ category?: string }} [params]
   */
  getExpensesByEvent: async (eventId, params = {}) => {
    const response = await api.get(`/finances/expenses/event/${eventId}`, { params });
    return response.data?.data || response.data;
  },

  /**
   * Record a new income entry (sponsor or alumni) for an event (Admin only).
   * @param {{ eventId: string, source: string, amount: number, type: 'sponsor'|'alumni' }} data
   */
  createIncome: async (data) => {
    const response = await api.post('/finances/incomes', data);
    return response.data?.data || response.data;
  },

  /**
   * List all incomes for an event with totals.
   * @param {string} eventId
   * @param {{ type?: 'sponsor'|'alumni' }} [params]
   */
  getIncomesByEvent: async (eventId, params = {}) => {
    const response = await api.get(`/finances/incomes/event/${eventId}`, { params });
    return response.data?.data || response.data;
  },
};

export default financeService;

