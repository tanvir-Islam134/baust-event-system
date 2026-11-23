import { eventRepository } from '../repositories/event.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/errorHandler.js';
import { CreateEventInputSchema, UpdateEventStatusSchema, UpdateEventSchema } from '../schemas/event.schema.js';
import { attachConflictFlags, isEventInPast } from '../utils/conflictDetector.js';

/**
 * Service handling event creation, discovery, conflict management, and status updates.
 */

/**
 * Helper to fetch all active future events for cross-schedule conflict evaluation.
 * Concluded / past events or rejected / declined events are excluded from conflict calculation.
 */
const getAllActiveEvents = async () => {
  try {
    const all = await eventRepository.findAll();
    return all.filter((e) => e.status !== 'rejected' && e.status !== 'declined' && e.status !== 'completed' && !isEventInPast(e));
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

    // STRICT CLUB ISOLATION:
    // Organizers are strictly forbidden from creating events for any club other than their assigned club
    const requestedClub =
      validatedInput.clubName ||
      validatedInput.clubAffiliation ||
      validatedInput.clubId ||
      rawEventData?.clubName ||
      rawEventData?.clubAffiliation ||
      rawEventData?.clubId;

    if (
      requestedClub &&
      requestedClub.trim().toLowerCase() !== creator.clubAffiliation.trim().toLowerCase()
    ) {
      throw new AppError(
        `Forbidden: You are an appointed organizer for "${creator.clubAffiliation}". You are strictly prohibited from creating events for "${requestedClub}".`,
        403
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
       'Central BAUST Event Management');

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
 * List events with role-aware privacy protection against data leakage:
 * - By default (or for students/unauthenticated users): strictly returns events where status === 'approved'.
 * - If status === 'pending' is requested:
 *    * Admin: returns the administrative review queue.
 *    * Organizer: returns ONLY the organizer's own pending events.
 *    * Others: returns an empty list to prevent unapproved event leakage.
 * @param {object} [filters={}]
 * @param {object|null} [requestingUser=null] - Decoded JWT user payload
 */
export const getEvents = async (filters = {}, requestingUser = null) => {
  const statusFilter = filters.status;

  // 1. By default, or explicitly requesting approved events:
  if (!statusFilter || statusFilter === 'approved') {
    const events = await eventRepository.findApproved(filters);
    const activeEvents = await getAllActiveEvents();
    return attachConflictFlags(events, activeEvents);
  }

  // 2. Requesting 'pending' events:
  if (statusFilter === 'pending') {
    if (requestingUser?.role === 'admin') {
      return getAdminQueue();
    }
    if (requestingUser?.role === 'organizer' && requestingUser.uid) {
      const myEvents = await eventRepository.findByCreator(requestingUser.uid);
      const myPending = myEvents.filter((ev) => ev.status === 'pending');
      const activeEvents = await getAllActiveEvents();
      return attachConflictFlags(myPending, activeEvents);
    }
    // Regular students or guests cannot access unapproved events
    return [];
  }

  // 3. Admin requesting specific custom status:
  if (requestingUser?.role === 'admin') {
    const all = await eventRepository.findAll();
    const filtered = all.filter((ev) => ev.status === statusFilter);
    const activeEvents = await getAllActiveEvents();
    return attachConflictFlags(filtered, activeEvents);
  }

  // Default fallback for safe public visibility:
  const events = await eventRepository.findApproved(filters);
  const activeEvents = await getAllActiveEvents();
  return attachConflictFlags(events, activeEvents);
};

export const getApprovedEvents = getEvents;

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
 * List events for calendar view with strict protection against data leakage:
 * By default, strictly returns 'approved' events.
 * Only returns 'pending' if requestingUser is Admin, or Organizer requesting their own events.
 * @param {object} [filters={}]
 * @param {object|null} [requestingUser=null]
 */
export const getCalendarEvents = async (filters = {}, requestingUser = null) => {
  let events = [];

  // Strictly check status permissions
  if (filters.status === 'pending') {
    if (requestingUser?.role === 'admin') {
      events = await eventRepository.findPendingEvents();
    } else if (requestingUser?.role === 'organizer' && requestingUser.uid) {
      const myEvents = await eventRepository.findByCreator(requestingUser.uid);
      events = myEvents.filter((ev) => ev.status === 'pending');
    } else {
      events = [];
    }
  } else {
    // Default: strictly approved events only
    events = await eventRepository.findApproved(filters);
  }

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

  const allActive = await getAllActiveEvents();
  return attachConflictFlags(events, allActive);
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

/**
 * Update event details (Organizer or Admin).
 * - Admin can update any event.
 * - Organizer can only update their own events.
 * @param {string} eventId
 * @param {object} updateData
 * @param {object} requestingUser
 */
export const updateEvent = async (eventId, updateData, requestingUser) => {
  const existingEvent = await eventRepository.findById(eventId);
  if (!existingEvent) {
    throw new AppError(`Event with ID '${eventId}' not found`, 404);
  }

  const isAdmin = requestingUser?.role === 'admin';
  const isOwner =
    existingEvent.createdBy === requestingUser?.uid ||
    existingEvent.organizerId === requestingUser?.uid;

  if (!isAdmin && !isOwner) {
    throw new AppError('Forbidden: You are not authorized to update this event', 403);
  }

  // Strict club isolation for organizers during update
  if (!isAdmin && requestingUser?.role === 'organizer') {
    const userClub = requestingUser?.clubAffiliation;
    if (userClub && existingEvent.clubAffiliation && existingEvent.clubAffiliation.trim().toLowerCase() !== userClub.trim().toLowerCase()) {
      throw new AppError(
        `Forbidden: You can only manage events for your own assigned club ("${userClub}").`,
        403
      );
    }

    const requestedClub = updateData?.clubName || updateData?.clubAffiliation || updateData?.clubId;
    if (requestedClub && userClub && requestedClub.trim().toLowerCase() !== userClub.trim().toLowerCase()) {
      throw new AppError(
        `Forbidden: You cannot change the club affiliation to "${requestedClub}". You only manage "${userClub}".`,
        403
      );
    }
  }

  const validated = UpdateEventSchema.parse(updateData);

  let payloadToUpdate = { ...validated };

  // Ensure organizer cannot reassign club
  if (!isAdmin && requestingUser?.role === 'organizer' && requestingUser?.clubAffiliation) {
    payloadToUpdate.clubName = requestingUser.clubAffiliation;
    payloadToUpdate.clubAffiliation = requestingUser.clubAffiliation;
    payloadToUpdate.clubId = requestingUser.clubAffiliation;
  }

  // Governance check: If an approved event has its critical schedule/venue/pricing altered by an organizer,
  // revert status to 'pending' so administrators can re-verify schedule conflicts before publishing changes.
  if (!isAdmin && existingEvent.status === 'approved') {
    const isCriticalChange =
      (validated.date && validated.date !== existingEvent.date) ||
      (validated.startTime && validated.startTime !== existingEvent.startTime) ||
      (validated.endTime && validated.endTime !== existingEvent.endTime) ||
      (validated.venue && validated.venue.trim().toLowerCase() !== (existingEvent.venue || '').trim().toLowerCase()) ||
      (validated.fee !== undefined && validated.fee !== existingEvent.fee);

    if (isCriticalChange) {
      payloadToUpdate.status = 'pending';
      payloadToUpdate.rejectionReason = null;
    }
  }

  const updated = await eventRepository.updateEvent(eventId, payloadToUpdate);
  return updated;
};

/**
 * Delete an event (Organizer or Admin).
 * - Admin can delete any event.
 * - Organizer can only delete their own events.
 * @param {string} eventId
 * @param {object} requestingUser
 */
export const deleteEvent = async (eventId, requestingUser) => {
  const existingEvent = await eventRepository.findById(eventId);
  if (!existingEvent) {
    throw new AppError(`Event with ID '${eventId}' not found`, 404);
  }

  const isAdmin = requestingUser?.role === 'admin';
  const isOwner =
    existingEvent.createdBy === requestingUser?.uid ||
    existingEvent.organizerId === requestingUser?.uid;

  if (!isAdmin && !isOwner) {
    throw new AppError('Forbidden: You are not authorized to delete this event', 403);
  }

  // Strict club isolation for organizers during deletion
  if (!isAdmin && requestingUser?.role === 'organizer') {
    const userClub = requestingUser?.clubAffiliation;
    if (userClub && existingEvent.clubAffiliation && existingEvent.clubAffiliation.trim().toLowerCase() !== userClub.trim().toLowerCase()) {
      throw new AppError(
        `Forbidden: You can only delete events belonging to your own assigned club ("${userClub}").`,
        403
      );
    }
  }

  await eventRepository.delete(eventId);
  return { id: eventId, deleted: true };
};
