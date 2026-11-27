import { BaseRepository } from './base.repository.js';
import { FeedbackSchema } from '../schemas/feedback.schema.js';

export class FeedbackRepository extends BaseRepository {
  constructor() {
    super('feedbacks');
  }

  getDocId(eventId, userId) {
    return `${eventId}_${userId}`;
  }

  async createFeedbackUnique(data) {
    const docId = this.getDocId(data.eventId, data.userId);
    const validated = FeedbackSchema.parse(data);
    const timestamp = new Date();

    return this.runTransaction(async (transaction) => {
      const ref = this.collection.doc(docId);
      const existing = await transaction.get(ref);
      if (existing.exists) {
        const err = new Error('You have already submitted feedback for this event.');
        err.code = 'ALREADY_EXISTS';
        throw err;
      }

      const payload = {
        ...validated,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      transaction.set(ref, payload);
      return { id: docId, ...payload };
    });
  }

  async findByEvent(eventId) {
    const items = await this.find([['eventId', '==', eventId]]);
    return items.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });
  }
}

export const feedbackRepository = new FeedbackRepository();
