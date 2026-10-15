import * as financeService from '../services/finance.service.js';

/**
 * POST /api/v1/finances/expenses
 * Create an expense entry (Organizer or Admin).
 */
export const createExpense = async (req, res, next) => {
  try {
    const expense = await financeService.createExpense(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/finances/expenses/event/:eventId
 * List expenses for an event (Organizer or Admin).
 */
export const getExpenses = async (req, res, next) => {
  try {
    const data = await financeService.getEventExpenses(req.params.eventId, req.query.category || null);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/finances/incomes
 * Create an income entry (Admin only).
 */
export const createIncome = async (req, res, next) => {
  try {
    const income = await financeService.createIncome(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      message: 'Income recorded successfully',
      data: income,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/finances/incomes/event/:eventId
 * List incomes for an event (Organizer or Admin).
 */
export const getIncomes = async (req, res, next) => {
  try {
    const data = await financeService.getEventIncomes(req.params.eventId, req.query.type || null);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

