import { z } from 'zod';

export const EventStatusEnum = z.enum(['pending', 'approved', 'rejected', 'completed']);

export const EventItemsSchema = z.object({
  food: z.boolean().default(false),
  tshirt: z.boolean().default(false),
});

export const EventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().default(''),
  date: z.string().trim().min(1, 'Date is required (e.g. YYYY-MM-DD)'),
  startTime: z.string().trim().min(1, 'Start time is required (e.g. HH:mm)'),
  endTime: z.string().trim().min(1, 'End time is required (e.g. HH:mm)'),
  venue: z.string().trim().min(1, 'Venue is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  registeredCount: z.number().int().min(0).default(0),
  fee: z.number().min(0).default(0),
  items: EventItemsSchema.default({ food: false, tshirt: false }),
  status: EventStatusEnum.default('pending'),
  createdBy: z.string().min(1, 'Creator UID is required'),
  clubId: z.string().trim().nullable().optional().default(null),
  clubAffiliation: z.string().trim().nullable().optional().default(null),
  rejectionReason: z.string().trim().nullable().default(null),
  createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
  updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
});

export const CreateEventSchema = EventSchema.omit({
  registeredCount: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateEventInputSchema = EventSchema.omit({
  registeredCount: true,
  status: true,
  rejectionReason: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateEventSchema = EventSchema.partial().omit({
  registeredCount: true, // Only updated atomically inside transactions
  createdBy: true,
  createdAt: true,
});

export const UpdateEventStatusSchema = z
  .object({
    status: z.enum(['approved', 'rejected', 'completed']),
    rejectionReason: z.string().trim().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'rejected') {
        return !!data.rejectionReason && data.rejectionReason.length > 0;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when rejecting an event',
      path: ['rejectionReason'],
    }
  );
