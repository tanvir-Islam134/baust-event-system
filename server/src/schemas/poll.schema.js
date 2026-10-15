import { z } from 'zod';

export const PollOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, 'Option text cannot be empty'),
  voteCount: z.number().int().min(0).default(0),
});

export const PollSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  question: z.string().trim().min(1, 'Poll question is required'),
  options: z.array(PollOptionSchema).min(2, 'At least 2 options are required for a poll'),
  expiresAt: z.union([z.date(), z.string(), z.any()]),
  createdBy: z.string().min(1, 'CreatedBy UID is required'),
  createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
  updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
});

export const CreatePollInputSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  question: z.string().trim().min(1, 'Poll question is required'),
  options: z.array(z.string().trim().min(1)).min(2, 'At least 2 options are required'),
  expiresAt: z.union([z.date(), z.string()]),
  createdBy: z.string().min(1),
});

export const VoteSchema = z.object({
  pollId: z.string().min(1),
  userId: z.string().min(1),
  selectedOption: z.string().min(1, 'Selected option ID or label is required'),
  votedAt: z.union([z.date(), z.string(), z.any()]).optional(),
});

