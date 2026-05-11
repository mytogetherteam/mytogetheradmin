import { z } from 'zod';

/** Login form values (admin panel UX field name). */
export const adminLoginFormSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(1, 'Enter email or username')
    .trim(),
  password: z.string().min(1, 'Enter password'),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginFormSchema>;

/** Nested payload from Nest admin auth when login succeeds */
export const adminLoginDataSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  id: z.number(),
  email: z.string(),
  name: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  role: z.string(),
  isAdmin: z.boolean().optional(),
});

export type AdminLoginData = z.infer<typeof adminLoginDataSchema>;

const adminLoginFailSchema = z.object({
  success: z.literal(false),
  message: z.string().optional(),
  code: z
    .enum(['ADMIN_NOT_FOUND', 'BAD_PASSWORD', 'ROLE_NOT_ALLOWED'])
    .optional(),
});

const adminLoginOkSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: adminLoginDataSchema,
});

export const adminLoginApiResponseSchema = z.union([
  adminLoginOkSchema,
  adminLoginFailSchema,
]);

export type AdminLoginApiResponse = z.infer<typeof adminLoginApiResponseSchema>;
