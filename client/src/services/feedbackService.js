import api from './api.js';

export const feedbackService = {
  getEventFeedbacks: async (eventId) => {
    const response = await api.get(`/feedback/event/${eventId}`);
    return response.data?.data || response.data;
  },

  submitFeedback: async ({ eventId, rating, comment }) => {
    const response = await api.post('/feedback', { eventId, rating, comment });
    return response.data?.data || response.data;
  },
};

export default feedbackService;
