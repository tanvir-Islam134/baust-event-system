import { z } from 'zod';

export const EventStatusEnum = z.enum(['pending', 'approved', 'rejected', 'completed']);

export const EventItemsSchema = z.object({
  food: z.boolean().default(false),
  tshirt: z.boolean().default(false),
});

export const EventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  eventName: z.string().trim().optional(),
  description: z.string().trim().default(''),
  bannerUrl: z.string().trim().default(''),
  date: z.string().trim().min(1, 'Date is required (e.g. YYYY-MM-DD)'),
  time: z.string().trim().default('10:00 AM'),
  startTime: z.string().trim().default('10:00 AM'),
  endTime: z.string().trim().default(''),
  venue: z.string().trim().min(1, 'Venue is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').default(100),
  registeredCount: z.number().int().min(0).default(0),
  ticketPrice: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  items: EventItemsSchema.default({ food: false, tshirt: false }),
  status: EventStatusEnum.default('pending'),
  createdBy: z.string().min(1, 'Creator UID is required'),
  organizerId: z.string().min(1, 'Organizer ID is required'),
  clubName: z.string().trim().nullable().optional().default(null),
  clubId: z.string().trim().nullable().optional().default(null),
  clubAffiliation: z.string().trim().nullable().optional().default(null),
  rejectionReason: z.string().trim().nullable().default(null),
  createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
  updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
});

export const CreateEventInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Title / Event name is required').optional(),
    eventName: z.string().trim().min(1).optional(),
    description: z.string().trim().default(''),
    bannerUrl: z.string().trim().default(''),
    imageUrl: z.string().trim().default(''),
    date: z.string().trim().min(1, 'Date is required (e.g. YYYY-MM-DD)'),
    time: z.string().trim().optional(),
    startTime: z.string().trim().optional(),
    endTime: z.string().trim().optional().default(''),
    venue: z.string().trim().min(1, 'Venue is required'),
    capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').default(100),
    ticketPrice: z.coerce.number().min(0, 'Ticket price cannot be negative').optional(),
    fee: z.coerce.number().min(0, 'Fee cannot be negative').optional(),
    items: EventItemsSchema.default({ food: false, tshirt: false }),
    clubName: z.string().trim().nullable().optional(),
    clubId: z.string().trim().nullable().optional(),
    clubAffiliation: z.string().trim().nullable().optional(),
    organizerId: z.string().trim().nullable().optional(),
  })
  .refine((data) => data.title || data.eventName, {
    message: 'Event Name / Title is required',
    path: ['title'],
  })
  .refine((data) => data.time || data.startTime, {
    message: 'Event Time is required',
    path: ['time'],
  })
  .transform((data) => {
    const finalTitle = (data.title || data.eventName || '').trim();
    const finalTime = (data.time || data.startTime || '').trim();
    const finalBanner = (data.bannerUrl || data.imageUrl || '').trim();
    const finalPrice =
      data.ticketPrice !== undefined ? data.ticketPrice : data.fee !== undefined ? data.fee : 0;
    return {
      ...data,
      title: finalTitle,
      eventName: finalTitle,
      bannerUrl: finalBanner,
      time: finalTime,
      startTime: finalTime,
      endTime: data.endTime || '',
      ticketPrice: finalPrice,
      fee: finalPrice,
    };
  });

export const CreateEventSchema = EventSchema.omit({
  registeredCount: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateEventSchema = EventSchema.partial().omit({
  registeredCount: true,
  createdBy: true,
  organizerId: true,
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
