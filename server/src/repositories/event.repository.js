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
    try {
      return await this.find([['status', '==', 'approved']], {
        orderBy: ['date', 'asc'],
      });
    } catch {
      const all = await this.find([['status', '==', 'approved']]);
      return all.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }
  }

  /**
   * Find approved past/recent events ordered by date descending.
   */
  async findRecentApprovedEvents() {
    try {
      return await this.find([['status', '==', 'approved']], {
        orderBy: ['date', 'desc'],
      });
    } catch {
      const all = await this.find([['status', '==', 'approved']]);
      return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
  }

  /**
   * Find pending events for administrative approval.
   */
  async findPendingEvents() {
    try {
      return await this.find([['status', '==', 'pending']], {
        orderBy: ['createdAt', 'desc'],
      });
    } catch {
      const all = await this.find([['status', '==', 'pending']]);
      return all.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    }
  }

  /**
   * Find all events created by a specific user/organizer.
   * Matches either createdBy or organizerId.
   * @param {string} creatorUid - Firebase UID / User ID
   */
  async findByCreator(creatorUid) {
    let results = [];
    try {
      results = await this.find([['createdBy', '==', creatorUid]], {
        orderBy: ['createdAt', 'desc'],
      });
    } catch {
      results = await this.find([['createdBy', '==', creatorUid]]);
    }

    // Also check if any were saved by organizerId if not captured
    if (results.length === 0) {
      try {
        results = await this.find([['organizerId', '==', creatorUid]]);
      } catch {
        // ignore
      }
    }

    return results.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }
}

export const eventRepository = new EventRepository();
