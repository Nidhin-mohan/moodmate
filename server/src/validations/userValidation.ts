import { z } from 'zod';

// Emails are case-insensitive: normalise before lookup and storage.
const email = z.string().trim().email('Invalid email format').toLowerCase();

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email,
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
