import { expenseRepository } from '../repositories/expense.repository.js';
import { incomeRepository } from '../repositories/income.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { registrationRepository } from '../repositories/registration.repository.js';
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
/**
 * Verify that the caller is an admin, the event owner, or an organizer of the event's club.
 */
const assertEventFinanceAccess = async (userId, event, requestingUser = null) => {
  const user = await userRepository.findById(userId);
  const isAdmin = requestingUser?.role === 'admin' || user?.role === 'admin';
  if (isAdmin) return;

  const eventClub = (event.clubAffiliation || event.clubId || event.clubName || '').trim().toLowerCase();
  const userClub = (user?.clubAffiliation || '').trim().toLowerCase();
  const isOwner = event.createdBy === userId || event.organizerId === userId;
  const isClubOrganizer = userClub && eventClub && userClub === eventClub;

  if (!isOwner && !isClubOrganizer) {
    throw new AppError(
      'Unauthorized: You can only manage expenses for events hosted by your assigned club.',
      403
    );
  }
};

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

  await assertEventFinanceAccess(userId, event, requestingUser);

  const expense = await expenseRepository.createExpense({
    ...validated,
    addedBy: userId,
  });

  return expense;
};

/**
 * Delete an expense entry for an event.
 * @param {string} expenseId
 * @param {string} userId
 * @param {object|null} [requestingUser=null]
 */
export const deleteExpense = async (expenseId, userId, requestingUser = null) => {
  if (!expenseId) {
    throw new AppError('Expense ID is required', 400);
  }

  const expense = await expenseRepository.findById(expenseId);
  if (!expense) {
    throw new AppError(`Expense with ID '${expenseId}' not found`, 404);
  }

  const event = await eventRepository.findById(expense.eventId);
  if (event) {
    await assertEventFinanceAccess(userId, event, requestingUser);
  }

  await expenseRepository.delete(expenseId);
  return { id: expenseId, eventId: expense.eventId, deleted: true };
};

/**
 * Calculate total ticket revenue for an event based on approved registrations.
 * Revenue = ticketPrice * number of approved registrations.
 */
export const getEventRevenue = async (eventId) => {
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }

  const event = await eventRepository.findById(eventId);
  if (!event) {
    throw new AppError(`Event with ID '${eventId}' not found`, 404);
  }

  const registrations = await registrationRepository.findByEvent(eventId);
  const approvedCount = registrations.filter((r) => r.status === 'approved').length;

  const ticketPrice = Number(event.ticketPrice ?? event.fee ?? 0) || 0;
  const totalRevenue = ticketPrice * approvedCount;

  return {
    totalRevenue,
    approvedCount,
    totalRegistrations: registrations.length,
    ticketPrice,
  };
};

/**
 * Compute comprehensive real-time budget summary for an event:
 * ticket revenue (approved registrations) vs logged expenses & other incomes.
 * @param {string} eventId
 */
export const getEventBudgetSummary = async (eventId) => {
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }

  const event = await eventRepository.findById(eventId);
  if (!event) {
    throw new AppError(`Event with ID '${eventId}' not found`, 404);
  }

  const [registrations, expenses, incomes] = await Promise.all([
    registrationRepository.findByEvent(eventId),
    expenseRepository.findByEvent(eventId),
    incomeRepository.findByEvent(eventId),
  ]);

  const approvedCount = registrations.filter((r) => r.status === 'approved').length;
  const ticketPrice = Number(event.ticketPrice ?? event.fee ?? 0) || 0;
  const ticketRevenue = ticketPrice * approvedCount;

  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalOtherIncomes = incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const categoryTotalsMap = {};
  for (const exp of expenses) {
    const cat = (exp.category || 'Other').trim();
    categoryTotalsMap[cat] = (categoryTotalsMap[cat] || 0) + (Number(exp.amount) || 0);
  }

  const categoryBreakdown = Object.entries(categoryTotalsMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    eventId,
    eventTitle: event.title || event.eventName || 'Event',
    ticketPrice,
    approvedCount,
    totalRegistrations: registrations.length,
    ticketRevenue,
    totalOtherIncomes,
    totalRevenue: ticketRevenue + totalOtherIncomes,
    totalExpenses,
    expenseCount: expenses.length,
    netTicketBalance: ticketRevenue - totalExpenses,
    netTotalBalance: ticketRevenue + totalOtherIncomes - totalExpenses,
    categoryBreakdown,
  };
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

