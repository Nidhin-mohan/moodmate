import { z } from 'zod';

export const updateUserSchema = z
  .object({
    role: z.enum(['admin', 'user', 'therapist']).optional(),
    isPro: z.boolean().optional(),
    name: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
