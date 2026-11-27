import * as financeService from '../services/finance.service.js';

/**
 * POST /api/v1/finances/expenses
 * Create an expense entry (Organizer or Admin).
 */
export const createExpense = async (req, res, next) => {
  try {
    const expense = await financeService.createExpense(req.user.uid, req.body, req.user);
    const io = req.app.get('io');
    if (io) {
      io.emit('finance_updated', { eventId: expense.eventId, type: 'expense_created' });
    }
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
    const data = await financeService.getEventExpenses(
      req.params.eventId,
      req.query.category || null,
      req.user.uid,
      req.user
    );
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
    const data = await financeService.getEventIncomes(
      req.params.eventId,
      req.query.type || null,
      req.user.uid,
      req.user
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/finances/revenue/event/:eventId
 * Return total ticket revenue for an event.
 */
export const getRevenue = async (req, res, next) => {
  try {
    const result = await financeService.getEventRevenue(req.params.eventId, req.user.uid, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/finances/summary/event/:eventId
 * Return full budget summary comparing ticket revenue vs logged expenses.
 */
export const getSummary = async (req, res, next) => {
  try {
    const result = await financeService.getEventBudgetSummary(req.params.eventId, req.user.uid, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/finances/expenses/:expenseId
 * Delete an expense entry (Organizer or Admin).
 */
export const deleteExpense = async (req, res, next) => {
  try {
    const result = await financeService.deleteExpense(req.params.expenseId, req.user.uid, req.user);
    const io = req.app.get('io');
    if (io) {
      io.emit('finance_updated', { eventId: result.eventId, type: 'expense_deleted' });
    }
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

