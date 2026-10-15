import crypto from 'node:crypto';
import { BaseRepository } from './base.repository.js';
import { PollSchema, CreatePollInputSchema, VoteSchema } from '../schemas/poll.schema.js';

export class PollRepository extends BaseRepository {
  constructor() {
    super('polls');
  }

  /**
   * Reference to the votes subcollection for a given poll.
   * @param {string} pollId
   */
  getVotesSubcollection(pollId) {
    return this.collection.doc(pollId).collection('votes');
  }

  /**
   * Create a poll with formatted options.
   * @param {object} rawData
   */
  async createPoll(rawData) {
    const validatedInput = CreatePollInputSchema.parse(rawData);

    // Convert string options into option objects with vote counters
    const formattedOptions = validatedInput.options.map((text) => ({
      id: crypto.randomBytes(4).toString('hex'),
      text,
      voteCount: 0,
    }));

    const pollPayload = PollSchema.parse({
      ...validatedInput,
      options: formattedOptions,
    });

    return this.create(pollPayload);
  }

  /**
   * Find all polls associated with an event.
   * @param {string} eventId
   */
  async findByEvent(eventId) {
    return this.find([['eventId', '==', eventId]], {
      orderBy: ['createdAt', 'desc'],
    });
  }

  /**
   * Cast a vote atomically inside a Firestore transaction.
   * Enforces:
   * 1. Poll exists and has not expired.
   * 2. Exactly one vote per user (via subcollection document ID: polls/{pollId}/votes/{userId}).
   * 3. Increments option voteCount on the poll document.
   *
   * @param {string} pollId
   * @param {string} userId
   * @param {string} selectedOptionId
   */
  async castVoteTransactional(pollId, userId, selectedOptionId) {
    return this.runTransaction(async (transaction) => {
      const pollRef = this.collection.doc(pollId);
      const voteRef = this.getVotesSubcollection(pollId).doc(userId);

      // 1. Read poll document
      const pollDoc = await transaction.get(pollRef);
      if (!pollDoc.exists) {
        throw new Error(`Poll with ID '${pollId}' not found.`);
      }
      const pollData = pollDoc.data();

      // 2. Check expiration
      const expirationDate = new Date(pollData.expiresAt);
      if (new Date() > expirationDate) {
        throw new Error('Voting failed: This poll has expired.');
      }

      // 3. Ensure user hasn't already voted
      const voteDoc = await transaction.get(voteRef);
      if (voteDoc.exists) {
        throw new Error('Voting failed: You have already voted in this poll.');
      }

      // 4. Validate selected option
      const optionIndex = pollData.options.findIndex((opt) => opt.id === selectedOptionId);
      if (optionIndex === -1) {
        throw new Error(`Invalid option '${selectedOptionId}'. Option not found in poll.`);
      }

      // 5. Build vote payload
      const voteTimestamp = new Date();
      const votePayload = VoteSchema.parse({
        pollId,
        userId,
        selectedOption: selectedOptionId,
        votedAt: voteTimestamp,
      });

      // 6. Record vote in subcollection
      transaction.set(voteRef, votePayload);

      // 7. Increment vote count for selected option
      const updatedOptions = [...pollData.options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        voteCount: (updatedOptions[optionIndex].voteCount || 0) + 1,
      };

      transaction.update(pollRef, {
        options: updatedOptions,
        updatedAt: voteTimestamp,
      });

      return {
        success: true,
        pollId,
        userId,
        selectedOption: selectedOptionId,
      };
    });
  }

  /**
   * Retrieve all votes cast in a poll's subcollection (for audit/admin tally).
   * @param {string} pollId
   */
  async getVotes(pollId) {
    const snapshot = await this.getVotesSubcollection(pollId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

export const pollRepository = new PollRepository();

