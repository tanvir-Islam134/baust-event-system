import { z } from 'zod';

export const CreateFeedbackInputSchema = z.object({
  eventId: z.string().trim().min(1, 'Event ID is required'),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5 stars')
    .max(5, 'Rating must be between 1 and 5 stars'),
  comment: z
    .string()
    .trim()
    .min(3, 'Please write at least 3 characters of feedback')
    .max(1000, 'Feedback must be 1000 characters or fewer'),
});

export const FeedbackSchema = CreateFeedbackInputSchema.extend({
  userId: z.string().min(1),
  studentName: z.string().min(1),
  studentId: z.string().nullable().default(null),
  department: z.string().nullable().default(null),
  photoURL: z.string().nullable().default(null),
  registrationId: z.string().min(1),
  createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
  updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
});
