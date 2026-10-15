import { z } from 'zod';

export const ExpenseSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  category: z.string().trim().min(1, 'Expense category is required'),
  amount: z.number().positive('Expense amount must be greater than zero'),
  note: z.string().trim().nullable().default(null),
  receiptUrl: z.string().trim().url().nullable().optional().default(null),
  addedBy: z.string().min(1, 'Added by UID is required'),
  createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
  updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
});

export const CreateExpenseSchema = ExpenseSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const CreateExpenseInputSchema = ExpenseSchema.omit({
  addedBy: true,
  createdAt: true,
  updatedAt: true,
});
