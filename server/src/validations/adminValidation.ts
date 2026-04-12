import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
  search: z.string().optional(),
  role: z.enum(['admin', 'user', 'therapist']).optional(),
  isPro: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),
  // ISO date strings for proSince range
  proSinceFrom: z.string().optional(),
  proSinceTo: z.string().optional(),
  includeDeleted: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

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
