import { eventRepository } from '../repositories/event.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/errorHandler.js';
import { CreateEventInputSchema, UpdateEventStatusSchema } from '../schemas/event.schema.js';
import { attachConflictFlags } from '../utils/conflictDetector.js';

/**
 * Service handling event creation, discovery, conflict management, and status updates.
 */

/**
 * Helper to fetch all active events for cross-schedule conflict evaluation.
 */
const getAllActiveEvents = async () => {
  try {
    const all = await eventRepository.findAll();
    return all.filter((e) => e.status !== 'rejected');
  } catch {
    return [];
  }
};

/**
 * Create a new event under pending review.
 * Allows approved Organizers or Admins.
 * Strictly links event to creator's UID as organizerId/createdBy
 * and organizer's assigned Club as clubName/clubId/clubAffiliation.
 *
 * @param {string} creatorUid
 * @param {object} rawEventData
 */
export const createEvent = async (creatorUid, rawEventData) => {
  const validatedInput = CreateEventInputSchema.parse(rawEventData);

  const creator = await userRepository.findById(creatorUid);
  if (!creator) {
    throw new AppError('Authenticated user account not found', 404);
  }

  const isAdmin = creator.role === 'admin';
  const isOrganizer = creator.role === 'organizer';

  if (!isAdmin && !isOrganizer) {
    throw new AppError('Forbidden: Only approved club organizers or administrators can create events', 403);
  }

  if (isOrganizer) {
    const isApproved =
      creator.organizerStatus === 'approved' ||
      creator.organizerRequestStatus === 'approved';

    if (!isApproved) {
      throw new AppError(
        'Forbidden: Only approved organizers are authorized to create events. Your organizer status is pending or not approved.',
        403
      );
    }

    if (!creator.clubAffiliation) {
      throw new AppError(
        'Organizer must be assigned to an active club affiliation to create events. Please contact the administrator.',
        400
      );
    }
  }

  // Strictly link the event to the organizer's assigned club
  const assignedClub = isOrganizer
    ? creator.clubAffiliation
    : (validatedInput.clubName ||
       validatedInput.clubAffiliation ||
       validatedInput.clubId ||
       creator.clubAffiliation ||
       'Central BAUST Event');

  const eventPayload = {
    ...validatedInput,
    createdBy: creatorUid,
    organizerId: creatorUid,
    clubName: assignedClub,
    clubId: assignedClub,
    clubAffiliation: assignedClub,
    status: 'pending',
    registeredCount: 0,
    rejectionReason: null,
  };

  const created = await eventRepository.createEvent(eventPayload);
  return created;
};

/**
 * List all public approved events with optional query filters (clubName, search/title).
 * Attaches conflict detection flags (`hasConflict: true/false`).
 * @param {object} [filters={}]
 */
export const getApprovedEvents = async (filters = {}) => {
  const events = await eventRepository.findApproved(filters);
  const activeEvents = await getAllActiveEvents();
  return attachConflictFlags(events, activeEvents);
};

/**
 * List events created by a specific organizer or admin.
 * Attaches conflict detection flags (`hasConflict: true/false`).
 * @param {string} creatorUid
 */
export const getMyEvents = async (creatorUid) => {
  const events = await eventRepository.findByCreator(creatorUid);
  const activeEvents = await getAllActiveEvents();
  return attachConflictFlags(events, activeEvents);
};

/**
 * List pending events awaiting administrative review.
 * Attaches conflict detection flags (`hasConflict: true/false`).
 */
export const getAdminQueue = async () => {
  const events = await eventRepository.findPendingEvents();
  const activeEvents = await getAllActiveEvents();
  return attachConflictFlags(events, activeEvents);
};

/**
 * List events for calendar view (approved + pending/organizer events) with conflict flags.
 * @param {object} [filters={}]
 */
export const getCalendarEvents = async (filters = {}) => {
  const allEvents = await getAllActiveEvents();
  let events = allEvents;

  // Filter if club specified
  if (filters.clubName && filters.clubName !== 'all') {
    const c = filters.clubName.trim().toLowerCase();
    events = events.filter((ev) => {
      const club = (ev.clubName || ev.clubAffiliation || '').toLowerCase();
      return club.includes(c);
    });
  }

  // Filter by category if specified
  if (filters.category && filters.category !== 'all') {
    const cat = filters.category.trim().toLowerCase();
    events = events.filter((ev) => (ev.category || 'General').toLowerCase() === cat);
  }

  return attachConflictFlags(events, allEvents);
};

/**
 * Retrieve public event details by ID with conflict details.
 * @param {string} eventId
 */
export const getEventById = async (eventId) => {
  const event = await eventRepository.findById(eventId);
  if (!event) {
    throw new AppError(`Event with ID '${eventId}' not found`, 404);
  }
  const activeEvents = await getAllActiveEvents();
  const [flagged] = attachConflictFlags([event], activeEvents);
  return flagged;
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
