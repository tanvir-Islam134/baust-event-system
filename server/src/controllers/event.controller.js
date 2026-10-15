import * as eventService from '../services/event.service.js';

/**
 * POST /api/v1/events
 * Create an event (organizer or admin).
 */
export const create = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      message: 'Event created successfully and is pending administrative approval',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events
 * Public: List all approved events.
 */
export const getApproved = async (req, res, next) => {
  try {
    const events = await eventService.getApprovedEvents();
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events/my-events
 * Protected: List events created by current user.
 */
export const getMyEvents = async (req, res, next) => {
  try {
    const events = await eventService.getMyEvents(req.user.uid);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events/admin/queue
 * Protected (Admin only): List pending events.
 */
export const getAdminQueue = async (req, res, next) => {
  try {
    const events = await eventService.getAdminQueue();
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/events/:id
 * Public: Get event details by ID.
 */
export const getById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/events/:id/status
 * Protected (Admin only): Update event status and rejectionReason.
 */
export const updateStatus = async (req, res, next) => {
  try {
    const updated = await eventService.updateEventStatus(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `Event status updated to '${updated.status}' successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

