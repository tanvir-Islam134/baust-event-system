import { z } from 'zod';
import { GuestInfoSchema, TshirtSizeEnum, FoodTypeEnum } from './registration.schema.js';

export const CreateBkashPaymentSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  tshirtSize: TshirtSizeEnum.optional().default(null),
  foodType: FoodTypeEnum.optional().default(null),
  guest: GuestInfoSchema.nullable().optional().default(null),
  batch: z.string().trim().nullable().optional().default(null),
  section: z.string().trim().nullable().optional().default(null),
  level: z.union([z.number(), z.string()]).nullable().optional().default(null),
  term: z.union([z.number(), z.string()]).nullable().optional().default(null),
});

export const ExecuteBkashPaymentSchema = z.object({
  paymentID: z.string().min(1, 'Payment ID is required'),
  payerPhone: z.string().trim().optional().default('01712345678'),
  otp: z.string().trim().optional().default('123456'),
  pin: z.string().trim().optional().default('12121'),
});

export const QueryBkashPaymentSchema = z.object({
  paymentID: z.string().min(1, 'Payment ID is required'),
});
