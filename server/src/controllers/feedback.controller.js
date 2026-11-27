import * as feedbackService from '../services/feedback.service.js';

/**
 * POST /api/v1/feedback
 * Protected: Checked-in attendees submit 1-5 star rating & feedback after event ends.
 */
export const create = async (req, res, next) => {
  try {
    const feedback = await feedbackService.submitFeedback(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      message: 'Thank you! Your event rating and feedback have been submitted.',
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/feedback/event/:eventId
 * Public: Get all verified attendee feedback and rating summary for an event.
 */
export const getByEvent = async (req, res, next) => {
  try {
    const data = await feedbackService.getEventFeedbacks(req.params.eventId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
