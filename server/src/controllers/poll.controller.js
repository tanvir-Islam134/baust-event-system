import * as pollService from '../services/poll.service.js';

/**
 * POST /api/v1/polls
 * Create a new poll (Organizer or Admin).
 */
export const create = async (req, res, next) => {
  try {
    const poll = await pollService.createPoll(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: poll,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/polls/event/:eventId
 * Public: List all polls for an event.
 */
export const getByEvent = async (req, res, next) => {
  try {
    const polls = await pollService.getEventPolls(req.params.eventId);
    res.status(200).json({
      success: true,
      data: polls,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/polls/:pollId/vote
 * Protected (Any authenticated user): Cast vote on poll option.
 */
export const vote = async (req, res, next) => {
  try {
    const result = await pollService.castVote(req.params.pollId, req.user.uid, req.body);
    res.status(200).json({
      success: true,
      message: 'Vote cast successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

