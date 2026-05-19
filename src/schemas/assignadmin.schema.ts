import { z } from 'zod';

export enum AdminRoleName {
  ShopAdmin = 'ShopAdmin',
  OperationAdmin = 'OperationAdmin',
}

export const assignAdminSchema = z.object({
  role: z.nativeEnum(AdminRoleName),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  name: z.string().optional(),
  username: z.string().optional(),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string()
    .min(1, 'Confirm Password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type AssignAdminFormValues = z.infer<typeof assignAdminSchema>;
