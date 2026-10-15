import { BaseRepository } from './base.repository.js';
import { ExpenseSchema, CreateExpenseSchema } from '../schemas/expense.schema.js';

export class ExpenseRepository extends BaseRepository {
  constructor() {
    super('expenses');
  }

  /**
   * Create an expense entry for an event.
   * @param {object} expenseData
   */
  async createExpense(expenseData) {
    const validated = CreateExpenseSchema.parse(expenseData);
    const fullPayload = ExpenseSchema.parse(validated);
    return this.create(fullPayload);
  }

  /**
   * Query all expenses for an event, optionally filtered by category.
   * @param {string} eventId
   * @param {string|null} [category=null]
   */
  async findByEvent(eventId, category = null) {
    if (category) {
      return this.find(
        [
          ['eventId', '==', eventId],
          ['category', '==', category],
        ],
        { orderBy: ['createdAt', 'desc'] }
      );
    }
    return this.find([['eventId', '==', eventId]], {
      orderBy: ['createdAt', 'desc'],
    });
  }

  /**
   * Compute the total expense amount for an event.
   * @param {string} eventId
   * @returns {Promise<number>}
   */
  async getTotalByEvent(eventId) {
    const expenses = await this.findByEvent(eventId);
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }
}

export const expenseRepository = new ExpenseRepository();

