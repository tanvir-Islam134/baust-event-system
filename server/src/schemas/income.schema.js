import { z } from 'zod';

export const IncomeTypeEnum = z.enum(['sponsor', 'alumni']);

export const IncomeSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  source: z.string().trim().min(1, 'Source name is required'),
  amount: z.number().positive('Income amount must be greater than zero'),
  type: IncomeTypeEnum,
  addedBy: z.string().min(1, 'Added by UID is required'),
  createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
  updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
});

export const CreateIncomeSchema = IncomeSchema.omit({
  createdAt: true,
  updatedAt: true,
});

