import * as registrationService from '../services/registration.service.js';

/**
 * POST /api/v1/registrations
 * Register for an event (authenticated participant or guest).
 */
export const create = async (req, res, next) => {
  try {
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
 * GET /api/v1/registrations/event/:eventId
 * Protected (Organizer | Admin): List registrations for an event.
 */
export const getByEvent = async (req, res, next) => {
  try {
    const registrations = await registrationService.getEventRegistrations(
      req.params.eventId,
      req.query.paymentStatus || null
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

