import * as registrationService from '../services/registration.service.js';
import * as eventService from '../services/event.service.js';
import { isEventInPast } from '../utils/conflictDetector.js';

/**
 * POST /api/v1/registrations (and POST /api/v1/register)
 * Register for an event (authenticated participant or guest).
 * Validates that event has not concluded before registering.
 */
export const create = async (req, res, next) => {
  try {
    const { eventId } = req.body;

    // Check if event has already concluded using timezone/end-time aware helper
    if (eventId) {
      const event = await eventService.getEventById(eventId);
      if (event && isEventInPast(event)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Registration is closed for past events.',
          },
          message: 'Registration is closed for past events.',
        });
      }
    }

    const registration = await registrationService.createRegistration(req.user?.uid || null, req.body);
    res.status(201).json({
      success: true,
      message: 'Registration completed successfully',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/registrations/organizer/pending
 * Protected (Organizer only): List pending registrations for caller's club.
 */
export const getOrganizerPending = async (req, res, next) => {
  try {
    const registrations = await registrationService.getOrganizerPendingRegistrations(req.user.uid);
    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/registrations/:id/approve
 * Protected (Organizer only): Approve a pending participant registration.
 */
export const approve = async (req, res, next) => {
  try {
    const updated = await registrationService.updateRegistrationStatusByOrganizer(
      req.user.uid,
      req.params.id,
      'approved'
    );
    res.status(200).json({
      success: true,
      message: 'Registration approved successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/registrations/:id/reject
 * Protected (Organizer only): Reject a pending participant registration.
 */
export const reject = async (req, res, next) => {
  try {
    const updated = await registrationService.updateRegistrationStatusByOrganizer(
      req.user.uid,
      req.params.id,
      'rejected',
      req.body.rejectionReason || req.body.reason || null
    );
    res.status(200).json({
      success: true,
      message: 'Registration rejected',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/registrations/event/:eventId
 * Protected (Organizer | Admin): List registrations for an event.
 */
export const getByEvent = async (req, res, next) => {
  try {
    const registrations = await registrationService.getEventRegistrations(
      req.params.eventId,
      req.query.paymentStatus || null,
      req.user?.uid || null,
      req.user?.role || null
    );
    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/registrations/:id/cancel
 * Protected (Admin only): Cancel a registration.
 */
export const cancel = async (req, res, next) => {
  try {
    const result = await registrationService.cancelRegistration(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/registrations/my
 * Protected: Fetch all registrations for current logged-in user.
 */
export const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await registrationService.getMyRegistrations(req.user.uid);
    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/registrations/:id/ticket
 * Protected: Get full digital ticket details for a specific registration.
 */
export const getTicket = async (req, res, next) => {
  try {
    const ticketData = await registrationService.getTicketDetails(
      req.params.id,
      req.user.uid,
      req.user.role
    );
    res.status(200).json({
      success: true,
      data: ticketData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/registrations/check-in
 * Protected (Organizer | Admin): Verify and check-in an attendee via QR token or ticket code.
 */
export const checkIn = async (req, res, next) => {
  try {
    const result = await registrationService.checkInAttendee(
      req.user.uid,
      req.user.role,
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/registrations/:id/items/:itemType
 * Protected (Organizer | Admin): Mark an event item (food / tshirt) as collected.
 */
export const distributeItem = async (req, res, next) => {
  try {
    const updated = await registrationService.distributeItem(
      req.user.uid,
      req.user.role,
      req.params.id,
      req.params.itemType
    );
    res.status(200).json({
      success: true,
      message: `${req.params.itemType === 'food' ? 'Food token' : 'T-shirt'} marked as collected.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/registrations/:id/certificate
 * Protected: Validate eligibility and download PDF participation certificate.
 */
export const downloadCertificate = async (req, res, next) => {
  try {
    const { pdfBytes, filename, certificateId } = await registrationService.generateParticipationCertificate(
      req.params.id,
      req.user.uid,
      req.user.role
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Certificate-Id', certificateId);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    next(error);
  }
};

