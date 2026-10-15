import { expenseRepository } from '../repositories/expense.repository.js';
import { incomeRepository } from '../repositories/income.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { AppError } from '../middlewares/errorHandler.js';
import { CreateExpenseInputSchema } from '../schemas/expense.schema.js';
import { CreateIncomeInputSchema } from '../schemas/income.schema.js';

/**
 * Service managing financial tracking (expenses & incomes).
 */

/**
 * Create an expense entry for an event.
 * @param {string} userId - User UID recording the expense
 * @param {object} rawData - Expense payload
 */
export const createExpense = async (userId, rawData) => {
  const validated = CreateExpenseInputSchema.parse(rawData);

  const event = await eventRepository.findById(validated.eventId);
  if (!event) {
    throw new AppError(`Event with ID '${validated.eventId}' not found`, 404);
  }

  const expense = await expenseRepository.createExpense({
    ...validated,
    addedBy: userId,
  });

  return expense;
};

/**
 * List all expenses for an event with sum total.
 * @param {string} eventId
 * @param {string|null} [category=null]
 */
export const getEventExpenses = async (eventId, category = null) => {
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }

  const items = await expenseRepository.findByEvent(eventId, category);
  const total = await expenseRepository.getTotalByEvent(eventId);

  return {
    items,
    totalAmount: total,
    count: items.length,
  };
};

/**
 * Create an income entry for an event (Admin only).
 * @param {string} userId - Admin UID recording the income
 * @param {object} rawData - Income payload
 */
export const createIncome = async (userId, rawData) => {
  const validated = CreateIncomeInputSchema.parse(rawData);

  const event = await eventRepository.findById(validated.eventId);
  if (!event) {
    throw new AppError(`Event with ID '${validated.eventId}' not found`, 404);
  }

  const income = await incomeRepository.createIncome({
    ...validated,
    addedBy: userId,
  });

  return income;
};

/**
 * List all incomes for an event with sum total.
 * @param {string} eventId
 * @param {'sponsor'|'alumni'|null} [type=null]
 */
export const getEventIncomes = async (eventId, type = null) => {
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }

  const items = await incomeRepository.findByEvent(eventId, type);
  const total = await incomeRepository.getTotalByEvent(eventId);

  return {
    items,
    totalAmount: total,
    count: items.length,
  };
};

