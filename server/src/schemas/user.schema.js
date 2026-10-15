import { z } from 'zod';

export const UserRoleEnum = z.enum(['admin', 'organizer', 'participant', 'guest']);
export const OrganizerStatusEnum = z.enum(['none', 'pending', 'approved', 'rejected']);

export const UserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  role: UserRoleEnum.default('participant'),
  batch: z.string().trim().nullable().optional().default(null),
  section: z.string().trim().nullable().optional().default(null),
  level: z.union([z.number(), z.string()]).nullable().optional().default(null),
  term: z.union([z.number(), z.string()]).nullable().optional().default(null),
  organizerStatus: OrganizerStatusEnum.default('none'),
  createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
  updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
});

export const UpdateUserSchema = UserSchema.partial().omit({ email: true, createdAt: true });

export const OrganizerStatusUpdateSchema = z.object({
  organizerStatus: OrganizerStatusEnum,
});

