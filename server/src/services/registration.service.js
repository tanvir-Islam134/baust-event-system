import { registrationRepository } from '../repositories/registration.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { CreateRegistrationInputSchema } from '../schemas/registration.schema.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Service handling attendee event registration and cancellation.
 */

/**
 * Create a registration atomically for an authenticated user or guest.
 * @param {string|null} authUserId - Authenticated user Firebase UID (or null for guest)
 * @param {object} rawData - Incoming registration body
 */
export const createRegistration = async (authUserId, rawData) => {
  // If user is authenticated, associate registration with authUserId
  const registrationPayload = {
    ...rawData,
    userId: authUserId || rawData.userId || null,
    guest: authUserId ? null : rawData.guest || null,
  };

  const validated = CreateRegistrationInputSchema.parse(registrationPayload);

  try {
    const created = await registrationRepository.createRegistrationTransactional(validated);
    return created;
  } catch (error) {
    // If it's a domain/capacity/duplicate error, bubble it up with 400 status
    if (
      error.message.includes('capacity') ||
      error.message.includes('Duplicate registration') ||
      error.message.includes('not open for registration')
    ) {
      throw new AppError(error.message, 400);
    }
    if (error.message.includes('does not exist')) {
      throw new AppError(error.message, 404);
    }
    throw error;
  }
};

/**
 * List all registrations for a specific event with club-level authorization.
 * @param {string} eventId
 * @param {'pending' | 'paid' | 'failed' | 'refunded' | null} [paymentStatus=null]
 * @param {string|null} [callerUid=null]
 * @param {string|null} [callerRole=null]
 */
export const getEventRegistrations = async (eventId, paymentStatus = null, callerUid = null, callerRole = null) => {
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }

  // If caller is an organizer, strictly enforce club isolation
  if (callerRole === 'organizer' && callerUid) {
    const [organizer, event] = await Promise.all([
      userRepository.findById(callerUid),
      eventRepository.findById(eventId),
    ]);

    if (!organizer || !organizer.clubAffiliation) {
      throw new AppError('Unauthorized: You do not have an active club affiliation.', 403);
    }

    const eventClub = event?.clubId || event?.clubAffiliation;
    if (event && eventClub && eventClub !== organizer.clubAffiliation && event.createdBy !== callerUid) {
      throw new AppError('Unauthorized: You can only view registrations for events created by your assigned club.', 403);
    }
  }

  return registrationRepository.findByEvent(eventId, paymentStatus);
};

/**
 * Fetch all pending registrations for events created by the caller's assigned club/society exclusively.
 * @param {string} organizerUid
 */
export const getOrganizerPendingRegistrations = async (organizerUid) => {
  const organizer = await userRepository.findById(organizerUid);
  if (!organizer || !organizer.clubAffiliation) {
    return [];
  }

  const pendingList = await registrationRepository.findPendingByClub(organizer.clubAffiliation);
  if (!pendingList.length) {
    return [];
  }

  // Hydrate each registration with event & participant cohort details
  const hydrated = await Promise.all(
    pendingList.map(async (reg) => {
      const [event, user] = await Promise.all([
        eventRepository.findById(reg.eventId).catch(() => null),
        reg.userId ? userRepository.findById(reg.userId).catch(() => null) : null,
      ]);

      return {
        ...reg,
        eventTitle: event?.title || 'Unknown Event',
        eventDate: event?.date || null,
        eventVenue: event?.venue || null,
        eventFee: event?.fee ?? 0,
        participantName: user?.name || reg.guest?.name || 'Unknown Attendee',
        participantEmail: user?.email || reg.guest?.email || 'N/A',
        participantPhone: user?.mobileNumber || reg.guest?.phone || 'N/A',
        department: user?.department || null,
        studentId: user?.studentId || null,
        isGuest: !reg.userId,
      };
    })
  );

  return hydrated;
};

/**
 * Approve or reject an event registration by the club organizer.
 * Validates that the event registration belongs to the organizer's assigned club.
 * @param {string} organizerUid
 * @param {string} registrationId
 * @param {'approved' | 'rejected'} status
 * @param {string|null} [rejectionReason=null]
 */
export const updateRegistrationStatusByOrganizer = async (
  organizerUid,
  registrationId,
  status,
  rejectionReason = null
) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError('Invalid status. Must be approved or rejected.', 400);
  }

  const organizer = await userRepository.findById(organizerUid);
  if (!organizer || !organizer.clubAffiliation) {
    throw new AppError('Unauthorized: You do not have an active club affiliation.', 403);
  }

  const registration = await registrationRepository.findById(registrationId);
  if (!registration) {
    throw new AppError(`Registration with ID '${registrationId}' not found`, 404);
  }

  // If clubId was not explicitly set on registration, fallback to event clubId
  let regClub = registration.clubId;
  if (!regClub && registration.eventId) {
    const event = await eventRepository.findById(registration.eventId);
    regClub = event?.clubId || event?.clubAffiliation || null;
  }

  if (regClub && regClub !== organizer.clubAffiliation) {
    throw new AppError('Unauthorized: You can only approve/reject registrations for your assigned club/society.', 403);
  }

  return registrationRepository.updateStatusTransactional(registrationId, {
    status,
    rejectionReason: status === 'rejected' ? rejectionReason || 'Rejected by club organizer' : null,
    reviewedBy: organizerUid,
  });
};

/**
 * Cancel a registration and decrement event registeredCount atomically (Admin only).
 * @param {string} registrationId
 */
export const cancelRegistration = async (registrationId) => {
  if (!registrationId) {
    throw new AppError('Registration ID is required', 400);
  }

  try {
    await registrationRepository.cancelRegistrationTransactional(registrationId);
    return { success: true, message: `Registration '${registrationId}' cancelled successfully` };
  } catch (error) {
    if (error.message.includes('does not exist')) {
      throw new AppError(error.message, 404);
    }
    throw error;
  }
};

