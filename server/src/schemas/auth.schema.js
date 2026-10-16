import { z } from 'zod';

export const LoginInputSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase ID token is required'),
});

export const RegisterInputSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase ID token is required'),
  uid: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  name: z.string().trim().min(1, 'Name is required').optional(),
  department: z.string().trim().nullable().optional(),
  studentId: z.string().trim().nullable().optional(),
  batch: z.string().trim().nullable().optional(),
  section: z.string().trim().nullable().optional(),
  level: z.union([z.number(), z.string()]).nullable().optional(),
  term: z.union([z.number(), z.string()]).nullable().optional(),
  mobileNumber: z.string().trim().nullable().optional(),
  accountType: z.enum(['Student', 'Organizer', 'participant', 'organizer']).optional(),
  requestedRole: z.enum(['Student', 'Organizer', 'participant', 'organizer']).optional(),
  clubAffiliation: z.string().trim().nullable().optional(),
  clubId: z.string().trim().nullable().optional(),
  club: z.string().trim().nullable().optional(),
});
