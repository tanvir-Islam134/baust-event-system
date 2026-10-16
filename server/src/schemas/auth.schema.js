import { z } from 'zod';

export const LoginInputSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase ID token is required'),
});

export const RegisterInputSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase ID token is required'),
});
