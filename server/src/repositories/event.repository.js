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
   * Find approved events with optional filtering by clubName and title/keyword.
   * Strictly filters for status === 'approved' to prevent data leakage of pending events.
   * @param {{ clubName?: string, club?: string, title?: string, search?: string, q?: string, status?: string }} [filters={}]
   */
  async findApproved(filters = {}) {
    let events = [];

    // Fetch strictly approved events
    try {
      events = await this.find([['status', '==', 'approved']], {
        orderBy: ['date', 'asc'],
      });
    } catch {
      events = await this.find([['status', '==', 'approved']]);
    }

    // Apply Query Filters
    const clubFilter = (filters.clubName || filters.club || '').trim().toLowerCase();
    const titleFilter = (filters.title || filters.search || filters.q || '').trim().toLowerCase();

    if (clubFilter && clubFilter !== 'all') {
      events = events.filter((ev) => {
        const cName = (ev.clubName || ev.clubAffiliation || ev.clubId || '').toLowerCase();
        return cName.includes(clubFilter);
      });
    }

    if (titleFilter) {
      events = events.filter((ev) => {
        const t = (ev.title || ev.eventName || '').toLowerCase();
        const d = (ev.description || '').toLowerCase();
        const v = (ev.venue || '').toLowerCase();
        return t.includes(titleFilter) || d.includes(titleFilter) || v.includes(titleFilter);
      });
    }

    // Sort: upcoming events first (soonest date first), past/ended events at the bottom (most recently ended first)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const isPast = (ev) => {
      if (!ev) return false;
      if (ev.status === 'completed') return true;
      const d = (ev.date || '').slice(0, 10);
      if (!d) return false;
      return d < todayStr;
    };

    return events.sort((a, b) => {
      const aPast = isPast(a);
      const bPast = isPast(b);
      // Upcoming events come first
      if (!aPast && bPast) return -1;
      if (aPast && !bPast) return 1;
      // Both are upcoming: earliest date first (ascending) so soonest event is at the top
      if (!aPast && !bPast) {
        return (a.date || '').localeCompare(b.date || '');
      }
      // Both are past: most recently ended first (descending)
      return (b.date || '').localeCompare(a.date || '');
    });
  }

  /**
   * Find approved upcoming events ordered by date ascending.
   * @param {object} [filters={}]
   */
  async findUpcomingEvents(filters = {}) {
    return this.findApproved(filters);
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
