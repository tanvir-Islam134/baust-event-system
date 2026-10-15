import { z } from 'zod';

export const PaymentMethodEnum = z.enum(['bkash', 'cash']);
export const PaymentStatusEnum = z.enum(['pending', 'paid', 'failed', 'refunded']);
export const TshirtSizeEnum = z.enum(['S', 'M', 'L', 'XL', 'XXL']).nullable();
export const FoodTypeEnum = z.enum(['vegetarian', 'non-vegetarian', 'standard']).nullable();

export const GuestInfoSchema = z.object({
  name: z.string().trim().min(1, 'Guest name is required'),
  email: z.string().trim().email('Invalid guest email address'),
  phone: z.string().trim().min(10, 'Valid guest phone number is required'),
});

export const ItemReceivedSchema = z.object({
  done: z.boolean().default(false),
  at: z.union([z.date(), z.string(), z.any()]).nullable().default(null),
  by: z.string().nullable().default(null),
});

export const ReceivedItemsSchema = z.object({
  food: ItemReceivedSchema.default({ done: false, at: null, by: null }),
  tshirt: ItemReceivedSchema.default({ done: false, at: null, by: null }),
});

export const RegistrationSchema = z
  .object({
    eventId: z.string().min(1, 'Event ID is required'),
    userId: z.string().nullable().default(null),
    guest: GuestInfoSchema.nullable().default(null),
    batch: z.string().trim().nullable().default(null),
    section: z.string().trim().nullable().default(null),
    level: z.union([z.number(), z.string()]).nullable().default(null),
    term: z.union([z.number(), z.string()]).nullable().default(null),
    tshirtSize: TshirtSizeEnum.default(null),
    foodType: FoodTypeEnum.default(null),
    paymentMethod: PaymentMethodEnum.default('cash'),
    paymentStatus: PaymentStatusEnum.default('pending'),
    trxId: z.string().trim().nullable().default(null),
    ticketCode: z.string().min(1, 'Ticket code is required'),
    received: ReceivedItemsSchema.default({
      food: { done: false, at: null, by: null },
      tshirt: { done: false, at: null, by: null },
    }),
    createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
    updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
  })
  .refine((data) => data.userId || (data.guest && data.guest.email), {
    message: 'Either userId (for authenticated students) or guest information must be provided',
    path: ['userId'],
  });

export const CreateRegistrationInputSchema = z
  .object({
    eventId: z.string().min(1, 'Event ID is required'),
    userId: z.string().nullable().optional().default(null),
    guest: GuestInfoSchema.nullable().optional().default(null),
    batch: z.string().trim().nullable().optional().default(null),
    section: z.string().trim().nullable().optional().default(null),
    level: z.union([z.number(), z.string()]).nullable().optional().default(null),
    term: z.union([z.number(), z.string()]).nullable().optional().default(null),
    tshirtSize: TshirtSizeEnum.optional().default(null),
    foodType: FoodTypeEnum.optional().default(null),
    paymentMethod: PaymentMethodEnum.default('cash'),
  })
  .refine((data) => data.userId || (data.guest && data.guest.email), {
    message: 'Either userId or guest details must be provided',
    path: ['userId'],
  });

