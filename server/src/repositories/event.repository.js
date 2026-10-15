import { BaseRepository } from './base.repository.js';
import { EventSchema, CreateEventSchema, UpdateEventSchema } from '../schemas/event.schema.js';

export class EventRepository extends BaseRepository {
  constructor() {
    super('events');
  }

  /**
   * Create a new event in pending status.
   * @param {object} eventData
   */
  async createEvent(eventData) {
    const validated = CreateEventSchema.parse(eventData);
    const fullPayload = EventSchema.parse({
      ...validated,
      registeredCount: 0,
      status: 'pending',
      rejectionReason: null,
    });
    return this.create(fullPayload);
  }

  /**
   * Update non-atomic event details (registeredCount is protected from direct updates).
   * @param {string} eventId
   * @param {object} updateData
   */
  async updateEvent(eventId, updateData) {
    const validated = UpdateEventSchema.parse(updateData);
    return this.update(eventId, validated);
  }

  /**
   * Update event review status (approve, reject with reason, complete).
   * @param {string} eventId
   * @param {'approved' | 'rejected' | 'completed'} status
   * @param {string|null} [rejectionReason=null]
   */
  async updateEventStatus(eventId, status, rejectionReason = null) {
    return this.update(eventId, {
      status,
      rejectionReason: status === 'rejected' ? rejectionReason : null,
    });
  }

  /**
   * Find approved upcoming events ordered by date ascending.
   */
  async findUpcomingEvents() {
    return this.find([['status', '==', 'approved']], {
      orderBy: ['date', 'asc'],
    });
  }

  /**
   * Find approved past/recent events ordered by date descending.
   */
  async findRecentApprovedEvents() {
    return this.find([['status', '==', 'approved']], {
      orderBy: ['date', 'desc'],
    });
  }

  /**
   * Find pending events for administrative approval.
   */
  async findPendingEvents() {
    return this.find([['status', '==', 'pending']], {
      orderBy: ['createdAt', 'desc'],
    });
  }

  /**
   * Find all events created by a specific user/organizer.
   * @param {string} createdBy - Firebase UID
   */
  async findByCreator(createdBy) {
    return this.find([['createdBy', '==', createdBy]], {
      orderBy: ['createdAt', 'desc'],
    });
  }
}

export const eventRepository = new EventRepository();

