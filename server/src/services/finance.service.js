import { expenseRepository } from '../repositories/expense.repository.js';
import { incomeRepository } from '../repositories/income.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { userRepository } from '../repositories/user.repository.js';
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
 * @param {object|null} [requestingUser=null]
 */
export const createExpense = async (userId, rawData, requestingUser = null) => {
  const validated = CreateExpenseInputSchema.parse(rawData);

  const event = await eventRepository.findById(validated.eventId);
  if (!event) {
    throw new AppError(`Event with ID '${validated.eventId}' not found`, 404);
  }

  // Authorize organizer against event's host club
  const user = await userRepository.findById(userId);
  const isAdmin = requestingUser?.role === 'admin' || user?.role === 'admin';
  if (!isAdmin) {
    const eventClub = (event.clubAffiliation || event.clubId || event.clubName || '').trim().toLowerCase();
    const userClub = (user?.clubAffiliation || '').trim().toLowerCase();
    const isOwner = event.createdBy === userId || event.organizerId === userId;
    const isClubOrganizer = userClub && eventClub && userClub === eventClub;

    if (!isOwner && !isClubOrganizer) {
      throw new AppError('Unauthorized: You can only record expenses for events hosted by your assigned club.', 403);
    }
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

