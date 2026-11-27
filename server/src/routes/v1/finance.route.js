import { Router } from 'express';
import * as financeController from '../../controllers/finance.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { CreateExpenseInputSchema } from '../../schemas/expense.schema.js';
import { CreateIncomeInputSchema } from '../../schemas/income.schema.js';

const router = Router();

// Protect all finance routes with authentication
router.use(requireAuth);

// POST /api/v1/finances/expenses - Protected (Organizer | Admin)
router.post(
  '/expenses',
  requireRole(['organizer', 'admin']),
  validate(CreateExpenseInputSchema),
  financeController.createExpense
);

// GET /api/v1/finances/expenses/event/:eventId - Protected (Organizer | Admin)
router.get(
  '/expenses/event/:eventId',
  requireRole(['organizer', 'admin']),
  financeController.getExpenses
);

// POST /api/v1/finances/incomes - Protected (Admin only)
router.post(
  '/incomes',
  requireRole(['admin']),
  validate(CreateIncomeInputSchema),
  financeController.createIncome
);

// GET /api/v1/finances/incomes/event/:eventId - Protected (Organizer | Admin)
router.get(
  '/incomes/event/:eventId',
  requireRole(['organizer', 'admin']),
  financeController.getIncomes
);

// GET /api/v1/finances/revenue/event/:eventId - Protected (Organizer | Admin)
router.get(
  '/revenue/event/:eventId',
  requireRole(['organizer', 'admin']),
  financeController.getRevenue
);

// GET /api/v1/finances/summary/event/:eventId - Protected (Organizer | Admin)
router.get(
  '/summary/event/:eventId',
  requireRole(['organizer', 'admin']),
  financeController.getSummary
);

// DELETE /api/v1/finances/expenses/:expenseId - Protected (Organizer | Admin)
router.delete(
  '/expenses/:expenseId',
  requireRole(['organizer', 'admin']),
  financeController.deleteExpense
);

export default router;

