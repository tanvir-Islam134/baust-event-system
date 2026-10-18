import crypto from 'node:crypto';
import { BaseRepository } from './base.repository.js';
import { RegistrationSchema } from '../schemas/registration.schema.js';

export class RegistrationRepository extends BaseRepository {
  constructor() {
    super('registrations');
  }

  /**
   * Generates a deterministic registration ID: {eventId}_{userId or hashed guest email}
   * to guarantee duplicate registrations are impossible at the database level.
   * @param {string} eventId
   * @param {{ userId?: string|null, guestEmail?: string|null }} identity
   * @returns {string}
   */
  generateRegistrationId(eventId, { userId, guestEmail }) {
    if (userId) {
      return `${eventId}_${userId}`;
    }
    if (guestEmail) {
      const emailHash = crypto
        .createHash('sha256')
        .update(guestEmail.trim().toLowerCase())
        .digest('hex')
        .substring(0, 16);
      return `${eventId}_guest_${emailHash}`;
    }
    throw new Error('Either userId or guestEmail is required to generate registration ID');
  }

  /**
   * Registers a participant or guest atomically inside a Firestore transaction.
   * Validates capacity and guarantees registeredCount is incremented atomically.
   * @param {object} rawData - Registration payload
   * @returns {Promise<object>} Created registration document
   */
  async createRegistrationTransactional(rawData) {
    const regId = this.generateRegistrationId(rawData.eventId, {
      userId: rawData.userId,
      guestEmail: rawData.guest?.email,
    });

    const ticketCode = rawData.ticketCode || `TKT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const timestamp = new Date();
    const payload = RegistrationSchema.parse({
      ...rawData,
      ticketCode,
      createdAt: rawData.createdAt || timestamp,
      updatedAt: timestamp,
    });

    return this.runTransaction(async (transaction) => {
      const eventRef = this.db.collection('events').doc(payload.eventId);
      const regRef = this.collection.doc(regId);

      // 1. Read event document
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) {
        throw new Error(`Event with ID '${payload.eventId}' does not exist.`);
      }
      const eventData = eventDoc.data();

      // Resolve event's clubId strictly
      let clubId = eventData.clubId || eventData.clubAffiliation || null;
      if (!clubId && eventData.createdBy) {
        const creatorDoc = await transaction.get(this.db.collection('users').doc(eventData.createdBy));
        if (creatorDoc.exists) {
          clubId = creatorDoc.data().clubAffiliation || null;
        }
      }

      // 2. Validate event status
      if (eventData.status !== 'approved') {
        throw new Error(`Event is not open for registration (Current status: ${eventData.status}).`);
      }

      // 3. Validate capacity limit
      const currentCount = eventData.registeredCount || 0;
      if (currentCount >= eventData.capacity) {
        throw new Error(`Registration failed: Event capacity (${eventData.capacity}) has been reached.`);
      }

      // 4. Ensure no existing registration exists with this deterministic ID
      const existingReg = await transaction.get(regRef);
      if (existingReg.exists) {
        throw new Error('Duplicate registration: This user or guest is already registered for this event.');
      }

      const finalPayload = {
        ...payload,
        clubId: clubId || null,
        status: 'pending',
      };

      // 5. Write registration document
      transaction.set(regRef, finalPayload);

      // 6. Atomically increment event registeredCount
      transaction.update(eventRef, {
        registeredCount: currentCount + 1,
        updatedAt: timestamp,
      });

      return { id: regId, ...finalPayload };
    });
  }

  /**
   * Cancels a registration atomically inside a Firestore transaction,
   * decrementing the event registeredCount.
   * @param {string} registrationId
   * @returns {Promise<boolean>}
   */
  async cancelRegistrationTransactional(registrationId) {
    return this.runTransaction(async (transaction) => {
      const regRef = this.collection.doc(registrationId);
      const regDoc = await transaction.get(regRef);

      if (!regDoc.exists) {
        throw new Error(`Registration '${registrationId}' does not exist.`);
      }

      const regData = regDoc.data();
      const eventRef = this.db.collection('events').doc(regData.eventId);
      const eventDoc = await transaction.get(eventRef);

      // Delete registration doc
      transaction.delete(regRef);

      // Decrement registeredCount safely (never below 0)
      if (eventDoc.exists) {
        const currentCount = eventDoc.data().registeredCount || 0;
        transaction.update(eventRef, {
          registeredCount: Math.max(0, currentCount - 1),
          updatedAt: new Date(),
        });
      }

      return true;
    });
  }

  /**
   * Query registrations for an event, optionally filtered by payment status.
   * @param {string} eventId
   * @param {'pending' | 'paid' | 'failed' | 'refunded' | null} [paymentStatus=null]
   */
  async findByEvent(eventId, paymentStatus = null) {
    if (paymentStatus) {
      return this.find(
        [
          ['eventId', '==', eventId],
          ['paymentStatus', '==', paymentStatus],
        ],
        { orderBy: ['createdAt', 'desc'] }
      );
    }
    return this.find([['eventId', '==', eventId]], {
      orderBy: ['createdAt', 'desc'],
    });
  }

  /**
   * Query all registrations for a specific authenticated user.
   * @param {string} userId
   */
  async findByUser(userId) {
    return this.find([['userId', '==', userId]], {
      orderBy: ['createdAt', 'desc'],
    });
  }

  /**
   * Find a registration by event and ticket code (for QR code gate verification).
   * @param {string} eventId
   * @param {string} ticketCode
   */
  async findByTicketCode(eventId, ticketCode) {
    const results = await this.find([
      ['eventId', '==', eventId],
      ['ticketCode', '==', ticketCode],
    ]);
    return results.length ? results[0] : null;
  }

  /**
   * Mark food or t-shirt item as distributed to attendee.
   * @param {string} registrationId
   * @param {'food' | 'tshirt'} itemType
   * @param {{ by: string }} metadata
   */
  async markItemReceived(registrationId, itemType, { by }) {
    if (!['food', 'tshirt'].includes(itemType)) {
      throw new Error(`Invalid item type '${itemType}'. Must be 'food' or 'tshirt'.`);
    }

    const payload = {
      [`received.${itemType}.done`]: true,
      [`received.${itemType}.at`]: new Date(),
      [`received.${itemType}.by`]: by,
      updatedAt: new Date(),
    };

    const docRef = this.collection.doc(registrationId);
    await docRef.update(payload);
    return this.findById(registrationId);
  }

  /**
   * Update payment status and transaction ID.
   * @param {string} registrationId
   * @param {{ paymentStatus: 'pending'|'paid'|'failed'|'refunded', trxId?: string|null }} data
   */
  async updatePaymentStatus(registrationId, { paymentStatus, trxId = null }) {
    return this.update(registrationId, {
      paymentStatus,
      ...(trxId ? { trxId } : {}),
    });
  }

  /**
   * Find all pending registrations belonging to a specific clubId.
   * @param {string} clubId
   */
  async findPendingByClub(clubId) {
    if (!clubId) return [];
    const snapshot = await this.collection
      .where('clubId', '==', clubId)
      .where('status', '==', 'pending')
      .get();

    const results = [];
    snapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });

    return results.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  /**
   * Atomically approve or reject a registration.
   * If rejected, decrements event registeredCount to free up the seat.
   * @param {string} registrationId
   * @param {{ status: 'approved' | 'rejected', rejectionReason?: string|null, reviewedBy?: string|null }} data
   */
  async updateStatusTransactional(registrationId, { status, rejectionReason = null, reviewedBy = null }) {
    const timestamp = new Date();
    return this.runTransaction(async (transaction) => {
      const regRef = this.collection.doc(registrationId);
      const regDoc = await transaction.get(regRef);

      if (!regDoc.exists) {
        throw new Error(`Registration '${registrationId}' does not exist.`);
      }

      const regData = regDoc.data();
      const eventRef = this.db.collection('events').doc(regData.eventId);

      // If rejected, decrement event registeredCount
      if (status === 'rejected' && regData.status !== 'rejected') {
        const eventDoc = await transaction.get(eventRef);
        if (eventDoc.exists) {
          const currentCount = eventDoc.data().registeredCount || 0;
          transaction.update(eventRef, {
            registeredCount: Math.max(0, currentCount - 1),
            updatedAt: timestamp,
          });
        }
      }

      const updateData = {
        status,
        rejectionReason: rejectionReason || null,
        reviewedBy: reviewedBy || null,
        reviewedAt: timestamp,
        updatedAt: timestamp,
      };

      transaction.update(regRef, updateData);
      return { id: registrationId, ...regData, ...updateData };
    });
  }
}

export const registrationRepository = new RegistrationRepository();

