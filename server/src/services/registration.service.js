import { registrationRepository } from '../repositories/registration.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { CreateRegistrationInputSchema } from '../schemas/registration.schema.js';
import { AppError } from '../middlewares/errorHandler.js';
import { signTicketQr, verifyTicketQr } from '../utils/qr.js';

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
      error.message.includes('not open for registration') ||
      error.message.includes('past events')
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
 * Fetch all pending registrations for events owned by the authenticated Organizer.
 * Enforces strict event ownership (createdBy / organizerId === organizerUid).
 * @param {string} organizerUid
 */
export const getOrganizerPendingRegistrations = async (organizerUid) => {
  if (!organizerUid) {
    throw new AppError('Organizer UID is required', 400);
  }

  const ownedEvents = await eventRepository.findByCreator(organizerUid);
  if (!ownedEvents.length) {
    return [];
  }

  const eventMap = new Map(ownedEvents.map((ev) => [ev.id, ev]));
  const ownedEventIds = ownedEvents.map((ev) => ev.id);

  const pendingList = await registrationRepository.findPendingByEventIds(ownedEventIds);
  if (!pendingList.length) {
    return [];
  }

  // Hydrate each registration with event & student cohort details
  const hydrated = await Promise.all(
    pendingList.map(async (reg) => {
      const event = eventMap.get(reg.eventId) || (await eventRepository.findById(reg.eventId).catch(() => null));
      const user = reg.userId ? await userRepository.findById(reg.userId).catch(() => null) : null;

      return {
        ...reg,
        eventName: event?.title || event?.eventName || 'Unknown Event',
        eventTitle: event?.title || event?.eventName || 'Unknown Event',
        eventDate: event?.date || null,
        eventVenue: event?.venue || null,
        eventFee: event?.ticketPrice ?? event?.fee ?? 0,
        studentName: user?.name || reg.guest?.name || 'Unknown Student',
        participantName: user?.name || reg.guest?.name || 'Unknown Student',
        participantEmail: user?.email || reg.guest?.email || 'N/A',
        participantPhone: user?.mobileNumber || reg.guest?.phone || 'N/A',
        participantPhotoURL: user?.photoURL || null,
        department: user?.department || null,
        studentId: user?.studentId || null,
        batch: reg.batch || user?.batch || null,
        section: reg.section || user?.section || null,
        level: reg.level ?? user?.level ?? null,
        term: reg.term ?? user?.term ?? null,
        isGuest: !reg.userId,
      };
    })
  );

  return hydrated;
};

/**
 * Approve or reject an event registration by the event's owning Organizer.
 * Enforces event ownership (createdBy / organizerId === organizerUid) and prevents
 * repeated status modifications on already-processed registrations.
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

  if (!registrationId) {
    throw new AppError('Registration ID is required.', 400);
  }

  const registration = await registrationRepository.findById(registrationId);
  if (!registration) {
    throw new AppError(`Registration with ID '${registrationId}' not found`, 404);
  }

  if (registration.status !== 'pending') {
    throw new AppError(
      `Registration has already been ${registration.status} and cannot be modified again.`,
      409
    );
  }

  const event = await eventRepository.findById(registration.eventId);
  if (!event) {
    throw new AppError(`Associated event '${registration.eventId}' not found`, 404);
  }

  const isEventOwner = event.createdBy === organizerUid || event.organizerId === organizerUid;
  if (!isEventOwner) {
    throw new AppError(
      'Unauthorized: Only the organizer who created or owns this event can manage its registrations.',
      403
    );
  }

  try {
    return await registrationRepository.updateStatusTransactional(registrationId, {
      status,
      rejectionReason: status === 'rejected' ? rejectionReason || 'Rejected by event organizer' : null,
      reviewedBy: organizerUid,
    });
  } catch (error) {
    if (error.code === 'ALREADY_PROCESSED') {
      throw new AppError(error.message, 409);
    }
    if (error.code === 'NOT_FOUND') {
      throw new AppError(error.message, 404);
    }
    throw error;
  }
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

/**
 * Fetch all registrations for the currently authenticated user with signed ticket QR tokens.
 * @param {string} userId - Firebase UID of attendee
 */
export const getMyRegistrations = async (userId) => {
  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  const registrations = await registrationRepository.findByUser(userId);
  if (!registrations || !registrations.length) {
    return [];
  }

  // Hydrate with event details and sign QR
  const now = new Date();
  const hydrated = await Promise.all(
    registrations.map(async (reg) => {
      const event = await eventRepository.findById(reg.eventId).catch(() => null);
      const qrToken = signTicketQr(reg, event || {});

      // Calculate whether the event has already taken place
      let isPastEvent = false;
      if (event?.date) {
        try {
          const dateStr = String(event.date).slice(0, 10);
          const eventDateObj = new Date(`${dateStr}T${event.endTime || '23:59:59'}`);
          if (!isNaN(eventDateObj.getTime())) {
            isPastEvent = eventDateObj < now;
          } else {
            const fallbackDate = new Date(dateStr);
            isPastEvent = !isNaN(fallbackDate.getTime()) && fallbackDate < now;
          }
        } catch {
          // ignore
        }
      }

      // If an event has ended and registration remained pending, mark status as expired
      let status = reg.status || 'pending';
      if (isPastEvent && status === 'pending' && !reg.attended) {
        status = 'expired';
      }

      return {
        ...reg,
        status,
        originalStatus: reg.status || 'pending',
        isPastEvent,
        qrToken,
        eventTitle: event?.title || event?.eventName || 'BAUST Event',
        eventDate: event?.date || null,
        eventTime: event?.time || `${event?.startTime || ''} - ${event?.endTime || ''}`.trim() || null,
        eventVenue: event?.venue || null,
        eventBannerUrl: event?.bannerUrl || '',
        eventCategory: event?.category || 'General',
        eventFee: event?.fee ?? event?.ticketPrice ?? 0,
        clubName: event?.clubName || event?.clubId || reg.clubId || null,
      };
    })
  );

  return hydrated;
};

/**
 * Fetch detailed digital ticket information for a single registration.
 * Accessible by: Attendee themselves, Event Organizer, or Admin.
 * @param {string} registrationId
 * @param {string} callerUid
 * @param {string} callerRole
 */
export const getTicketDetails = async (registrationId, callerUid, callerRole) => {
  const reg = await registrationRepository.findById(registrationId);
  if (!reg) {
    throw new AppError(`Registration with ID '${registrationId}' not found`, 404);
  }

  const event = await eventRepository.findById(reg.eventId);
  if (!event) {
    throw new AppError('Associated event not found', 404);
  }

  // Authorization check
  const isOwner = reg.userId === callerUid;
  const isAdmin = callerRole === 'admin';
  let isClubOrganizer = false;

  if (callerRole === 'organizer') {
    const organizer = await userRepository.findById(callerUid);
    const eventClub = event.clubId || event.clubAffiliation;
    isClubOrganizer = (organizer && organizer.clubAffiliation && organizer.clubAffiliation === eventClub) || event.createdBy === callerUid;
  }

  if (!isOwner && !isAdmin && !isClubOrganizer) {
    throw new AppError('Forbidden: You do not have permission to view this ticket.', 403);
  }

  const user = reg.userId ? await userRepository.findById(reg.userId) : null;
  const qrToken = signTicketQr(reg, event);

  let isPastEvent = false;
  if (event?.date) {
    try {
      const dateStr = String(event.date).slice(0, 10);
      const eventDateObj = new Date(`${dateStr}T${event.endTime || '23:59:59'}`);
      if (!isNaN(eventDateObj.getTime())) {
        isPastEvent = eventDateObj < new Date();
      } else {
        const fallbackDate = new Date(dateStr);
        isPastEvent = !isNaN(fallbackDate.getTime()) && fallbackDate < new Date();
      }
    } catch {
      // ignore
    }
  }

  let status = reg.status || 'pending';
  if (isPastEvent && status === 'pending' && !reg.attended) {
    status = 'expired';
  }

  return {
    registration: {
      ...reg,
      status,
      originalStatus: reg.status || 'pending',
      isPastEvent,
      qrToken,
    },
    event: {
      id: event.id,
      title: event.title || event.eventName || 'BAUST Event',
      date: event.date || null,
      time: event.time || `${event.startTime || ''} - ${event.endTime || ''}`.trim() || null,
      venue: event.venue || null,
      bannerUrl: event.bannerUrl || '',
      category: event.category || 'General',
      fee: event.fee ?? event.ticketPrice ?? 0,
      clubName: event.clubName || event.clubId || null,
      isPast: isPastEvent,
    },
    attendee: {
      name: user?.name || reg.guest?.name || 'Attendee',
      email: user?.email || reg.guest?.email || 'N/A',
      studentId: user?.studentId || null,
      department: user?.department || null,
      batch: user?.batch || reg.batch || null,
      section: user?.section || reg.section || null,
      level: user?.level || reg.level || null,
      term: user?.term || reg.term || null,
      mobileNumber: user?.mobileNumber || reg.guest?.phone || null,
      isGuest: !reg.userId,
    },
  };
};

/**
 * Gate check-in verification for an attendee at the venue.
 * Accessible by Event Organizers or Admins.
 * @param {string} scannerUid - UID of organizer/admin checking in
 * @param {string} scannerRole - Role of organizer/admin
 * @param {{ qrToken?: string, ticketCode?: string, eventId?: string }} checkInData
 */
export const checkInAttendee = async (scannerUid, scannerRole, checkInData) => {
  let regId = null;
  let targetEventId = checkInData.eventId || null;
  let targetTicketCode = checkInData.ticketCode ? checkInData.ticketCode.trim().toUpperCase() : null;

  // 1. If QR token string provided, verify cryptographic signature
  if (checkInData.qrToken) {
    const decoded = verifyTicketQr(checkInData.qrToken);
    regId = decoded.regId;
    targetEventId = targetEventId || decoded.eventId;
    targetTicketCode = targetTicketCode || decoded.ticketCode;
  }

  let reg = null;
  if (regId) {
    reg = await registrationRepository.findById(regId);
  } else if (targetEventId && targetTicketCode) {
    reg = await registrationRepository.findByTicketCode(targetEventId, targetTicketCode);
  }

  if (!reg) {
    throw new AppError('Ticket not found: No matching registration record found in database.', 404);
  }

  // 2. Fetch event details
  const event = await eventRepository.findById(reg.eventId);
  if (!event) {
    throw new AppError('Event associated with this ticket not found', 404);
  }

  // 3. Organizer authorization check (only event's club organizers or admins can check in)
  if (scannerRole === 'organizer') {
    const organizer = await userRepository.findById(scannerUid);
    const eventClub = event.clubId || event.clubAffiliation;
    const isAuthorized =
      (organizer && organizer.clubAffiliation && organizer.clubAffiliation === eventClub) ||
      event.createdBy === scannerUid;

    if (!isAuthorized) {
      throw new AppError('Unauthorized: You can only check in attendees for events created by your assigned club.', 403);
    }
  }

  // 4. Validate registration status
  if (reg.status === 'rejected') {
    throw new AppError('Entry Denied: This registration was previously rejected by the organizer.', 400);
  }
  if (reg.status === 'cancelled') {
    throw new AppError('Entry Denied: This registration was cancelled.', 400);
  }

  // Hydrate attendee info
  const user = reg.userId ? await userRepository.findById(reg.userId) : null;
  const attendeeInfo = {
    name: user?.name || reg.guest?.name || 'Attendee',
    email: user?.email || reg.guest?.email || 'N/A',
    studentId: user?.studentId || null,
    department: user?.department || null,
    batch: user?.batch || reg.batch || null,
    section: user?.section || reg.section || null,
    phone: user?.mobileNumber || reg.guest?.phone || null,
    isGuest: !reg.userId,
    tshirtSize: reg.tshirtSize || null,
    foodType: reg.foodType || null,
    received: reg.received || {
      food: { done: false, at: null, by: null },
      tshirt: { done: false, at: null, by: null },
    },
  };

  const eventInfo = {
    id: event.id,
    title: event.title || event.eventName || 'BAUST Event',
    venue: event.venue || 'Venue Hall',
    date: event.date || null,
  };

  // 5. Duplicate Check-in Prevention
  if (reg.attended) {
    const checkInTime = reg.attendedAt
      ? new Date(reg.attendedAt.toDate ? reg.attendedAt.toDate() : reg.attendedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'earlier today';

    return {
      success: true,
      alreadyAttended: true,
      message: `⚠️ Attendee was ALREADY checked in at ${checkInTime}.`,
      attendee: attendeeInfo,
      registration: reg,
      event: eventInfo,
    };
  }

  // 6. Mark attendance atomically
  const updatedReg = await registrationRepository.markAttended(reg.id, { by: scannerUid });

  return {
    success: true,
    alreadyAttended: false,
    message: `✅ Check-in verified! Welcome, ${attendeeInfo.name}.`,
    attendee: attendeeInfo,
    registration: updatedReg,
    event: eventInfo,
  };
};

/**
 * Distribute event items (Food / T-shirt) to attendee at the gate/counter.
 * @param {string} scannerUid
 * @param {string} scannerRole
 * @param {string} registrationId
 * @param {'food' | 'tshirt'} itemType
 */
export const distributeItem = async (scannerUid, scannerRole, registrationId, itemType) => {
  if (!['food', 'tshirt'].includes(itemType)) {
    throw new AppError("Invalid item type. Must be 'food' or 'tshirt'.", 400);
  }

  const reg = await registrationRepository.findById(registrationId);
  if (!reg) {
    throw new AppError(`Registration with ID '${registrationId}' not found`, 404);
  }

  const event = await eventRepository.findById(reg.eventId);
  if (scannerRole === 'organizer') {
    const organizer = await userRepository.findById(scannerUid);
    const eventClub = event?.clubId || event?.clubAffiliation;
    const isAuthorized =
      (organizer && organizer.clubAffiliation && organizer.clubAffiliation === eventClub) ||
      event?.createdBy === scannerUid;

    if (!isAuthorized) {
      throw new AppError('Unauthorized: You do not have permission to distribute items for this event.', 403);
    }
  }

  const updated = await registrationRepository.markItemReceived(registrationId, itemType, { by: scannerUid });
  return updated;
};

