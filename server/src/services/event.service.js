import { eventRepository } from '../repositories/event.repository.js';
import { AppError } from '../middlewares/errorHandler.js';
import { CreateEventInputSchema, UpdateEventStatusSchema } from '../schemas/event.schema.js';

/**
 * Service handling event creation, discovery, and status management.
 */

/**
 * Create a new event under pending review.
 * Forces status: 'pending', registeredCount: 0, createdBy: creatorUid.
 * @param {string} creatorUid
 * @param {object} rawEventData
 */
export const createEvent = async (creatorUid, rawEventData) => {
  const validatedInput = CreateEventInputSchema.parse(rawEventData);

  const eventPayload = {
    ...validatedInput,
    createdBy: creatorUid,
    status: 'pending',
    registeredCount: 0,
    rejectionReason: null,
  };

  const created = await eventRepository.createEvent(eventPayload);
  return created;
};

/**
 * List all public approved events.
 */
export const getApprovedEvents = async () => {
  return eventRepository.findUpcomingEvents();
};

/**
 * List events created by a specific organizer or admin.
 * @param {string} creatorUid
 */
export const getMyEvents = async (creatorUid) => {
  return eventRepository.findByCreator(creatorUid);
};

/**
 * List pending events awaiting administrative review.
 */
export const getAdminQueue = async () => {
  return eventRepository.findPendingEvents();
};

/**
 * Retrieve public event details by ID.
 * @param {string} eventId
 */
export const getEventById = async (eventId) => {
  const event = await eventRepository.findById(eventId);
  if (!event) {
    throw new AppError(`Event with ID '${eventId}' not found`, 404);
  }
  return event;
};

/**
 * Update event review status (Admin only).
 * @param {string} eventId
 * @param {{ status: 'approved' | 'rejected' | 'completed', rejectionReason?: string | null }} statusData
 */
export const updateEventStatus = async (eventId, statusData) => {
  const validated = UpdateEventStatusSchema.parse(statusData);

  const existingEvent = await eventRepository.findById(eventId);
  if (!existingEvent) {
    throw new AppError(`Event with ID '${eventId}' not found`, 404);
  }

  const updated = await eventRepository.updateEventStatus(
    eventId,
    validated.status,
    validated.rejectionReason || null
  );

  return updated;
};

