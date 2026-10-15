import { registrationRepository } from '../repositories/registration.repository.js';
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
 * List all registrations for a specific event (Organizer or Admin).
 * @param {string} eventId
 * @param {'pending' | 'paid' | 'failed' | 'refunded' | null} [paymentStatus=null]
 */
export const getEventRegistrations = async (eventId, paymentStatus = null) => {
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }
  return registrationRepository.findByEvent(eventId, paymentStatus);
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

