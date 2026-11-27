import { feedbackRepository } from '../repositories/feedback.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { registrationRepository } from '../repositories/registration.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { CreateFeedbackInputSchema } from '../schemas/feedback.schema.js';
import { isEventInPast } from '../utils/conflictDetector.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Submit a 1-5 star rating and feedback for a concluded event.
 * Strictly requires:
 * 1. Event exists and has officially concluded (isEventInPast)
 * 2. Student holds an 'approved' registration AND attended === true (Checked In)
 * 3. No duplicate feedback from the same user for the same event
 */
export const submitFeedback = async (userId, rawData) => {
  const validated = CreateFeedbackInputSchema.parse(rawData);

  const event = await eventRepository.findById(validated.eventId);
  if (!event) {
    throw new AppError(`Event with ID '${validated.eventId}' not found`, 404);
  }

  if (!isEventInPast(event)) {
    throw new AppError('Feedback can only be submitted after the event has concluded.', 403);
  }

  const regId = registrationRepository.generateRegistrationId(validated.eventId, { userId });
  const reg = await registrationRepository.findById(regId);

  if (!reg) {
    throw new AppError('Forbidden: You did not register for this event.', 403);
  }
  if (reg.status !== 'approved') {
    throw new AppError('Forbidden: Only approved participants can submit feedback.', 403);
  }
  if (!reg.attended) {
    throw new AppError('Forbidden: Only Checked In attendees can submit feedback and ratings.', 403);
  }

  const student = await userRepository.findById(userId).catch(() => null);

  try {
    return await feedbackRepository.createFeedbackUnique({
      eventId: validated.eventId,
      rating: validated.rating,
      comment: validated.comment,
      userId,
      studentName: student?.name || 'BAUST Student',
      studentId: student?.studentId || null,
      department: student?.department || null,
      photoURL: student?.photoURL || null,
      registrationId: reg.id,
    });
  } catch (err) {
    if (err.code === 'ALREADY_EXISTS') {
      throw new AppError(err.message, 409);
    }
    throw err;
  }
};

/**
 * Get all feedback and aggregate rating metrics for an event.
 */
export const getEventFeedbacks = async (eventId) => {
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }

  const feedbacks = await feedbackRepository.findByEvent(eventId);
  const totalReviews = feedbacks.length;
  const ratingSum = feedbacks.reduce((sum, f) => sum + (Number(f.rating) || 0), 0);
  const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(2)) : 0;

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const f of feedbacks) {
    const star = Math.min(5, Math.max(1, Math.round(Number(f.rating) || 0)));
    breakdown[star] = (breakdown[star] || 0) + 1;
  }

  return {
    feedbacks,
    totalReviews,
    averageRating,
    breakdown,
  };
};
