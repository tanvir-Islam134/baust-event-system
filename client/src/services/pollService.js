import api from './api.js';

/**
 * Service handling event polls and voting API calls.
 */
export const pollService = {
  /**
   * Create a new poll for an event (Organizer or Admin).
   * @param {{ eventId: string, question: string, options: string[], expiresAt: string|Date }} data
   */
  createPoll: async (data) => {
    const response = await api.post('/polls', data);
    return response.data?.data || response.data;
  },

  /**
   * List all polls for an event (Public).
   * @param {string} eventId
   */
  getPollsByEvent: async (eventId) => {
    const response = await api.get(`/polls/event/${eventId}`);
    return response.data?.data || response.data;
  },

  /**
   * Cast a vote on a poll option (Protected: Any authenticated user).
   * @param {string} pollId
   * @param {{ selectedOptionId: string }} data
   */
  vote: async (pollId, data) => {
    const response = await api.post(`/polls/${pollId}/vote`, data);
    return response.data?.data || response.data;
  },
};

export default pollService;

