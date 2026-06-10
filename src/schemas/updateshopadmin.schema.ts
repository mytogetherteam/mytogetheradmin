import { z } from 'zod';

export const updateShopAdminSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    name: z.string().optional(),
    username: z.string().optional(),
    // Leave blank to keep the current password.
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 6, {
        message: 'Password must be at least 6 characters long',
      }),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => (data.password || '') === (data.confirmPassword || ''), {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UpdateShopAdminFormValues = z.infer<typeof updateShopAdminSchema>;
