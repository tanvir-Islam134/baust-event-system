import { pollRepository } from '../repositories/poll.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { AppError } from '../middlewares/errorHandler.js';
import { CreatePollInputSchema, CastVoteInputSchema } from '../schemas/poll.schema.js';

/**
 * Service managing event polls and atomic subcollection voting.
 */

/**
 * Create a new poll for an event.
 * @param {string} userId - Organizer or Admin UID
 * @param {object} rawData - Poll payload
 */
export const createPoll = async (userId, rawData) => {
  const validated = CreatePollInputSchema.parse(rawData);

  const event = await eventRepository.findById(validated.eventId);
  if (!event) {
    throw new AppError(`Event with ID '${validated.eventId}' not found`, 404);
  }

  const poll = await pollRepository.createPoll({
    ...validated,
    createdBy: userId,
  });

  return poll;
};

/**
 * List all polls for a specific event (Public).
 * @param {string} eventId
 */
export const getEventPolls = async (eventId) => {
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }
  return pollRepository.findByEvent(eventId);
};

/**
 * Cast a vote on a poll atomically.
 * Enforces poll expiration, valid option, and single vote per user.
 * @param {string} pollId
 * @param {string} userId
 * @param {object} voteData - { selectedOptionId }
 */
export const castVote = async (pollId, userId, voteData) => {
  const validated = CastVoteInputSchema.parse(voteData);

  try {
    const result = await pollRepository.castVoteTransactional(
      pollId,
      userId,
      validated.selectedOptionId
    );
    return result;
  } catch (error) {
    if (
      error.message.includes('expired') ||
      error.message.includes('already voted') ||
      error.message.includes('Invalid option')
    ) {
      throw new AppError(error.message, 400);
    }
    if (error.message.includes('not found')) {
      throw new AppError(error.message, 404);
    }
    throw error;
  }
};

