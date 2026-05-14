import { z } from 'zod';

export const schemas = {
  email: z.string().email('Invalid email format').toLowerCase().trim(),

  password: z
    .string()
    .min(8, 'Must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/\d/, 'Must contain at least one number'),

  uuid: z.string().uuid('Invalid ID format'),

  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),

  url: z.string().url('Invalid URL format'),

  isoDate: z.string().datetime('Invalid date format'),

  positiveInt: z.number().int().positive(),

  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),

  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
};

export type PaginationInput = z.infer<typeof schemas.pagination>;
