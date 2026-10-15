import { BaseRepository } from './base.repository.js';
import { IncomeSchema, CreateIncomeSchema } from '../schemas/income.schema.js';

export class IncomeRepository extends BaseRepository {
  constructor() {
    super('incomes');
  }

  /**
   * Create an income entry for an event.
   * @param {object} incomeData
   */
  async createIncome(incomeData) {
    const validated = CreateIncomeSchema.parse(incomeData);
    const fullPayload = IncomeSchema.parse(validated);
    return this.create(fullPayload);
  }

  /**
   * Query all incomes for an event, optionally filtered by type (sponsor | alumni).
   * @param {string} eventId
   * @param {'sponsor' | 'alumni' | null} [type=null]
   */
  async findByEvent(eventId, type = null) {
    if (type) {
      return this.find(
        [
          ['eventId', '==', eventId],
          ['type', '==', type],
        ],
        { orderBy: ['createdAt', 'desc'] }
      );
    }
    return this.find([['eventId', '==', eventId]], {
      orderBy: ['createdAt', 'desc'],
    });
  }

  /**
   * Compute the total income for an event.
   * @param {string} eventId
   * @returns {Promise<number>}
   */
  async getTotalByEvent(eventId) {
    const incomes = await this.findByEvent(eventId);
    return incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }
}

export const incomeRepository = new IncomeRepository();

