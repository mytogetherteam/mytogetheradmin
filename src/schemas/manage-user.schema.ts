import { z } from "zod";

export const manageUserAccountTypeSchema = z.enum(["admin", "user"]);

export const manageUserRoleSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const manageUserSchema = z.object({
  accountType: manageUserAccountTypeSchema,
  id: z.number(),
  name: z.string().nullable(),
  // Users sign in by phone and may have no email; admins always have one.
  email: z.string().email().nullable(),
  username: z.string().nullable(),
  phone: z.string().nullable().optional(),
  role: z.string(),
  roleId: z.number().nullable().optional(),
  status: z.enum(["Active", "Inactive"]),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const manageUsersPageSchema = z.object({
  content: z.array(manageUserSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  number: z.number(),
  size: z.number(),
});

export const editManageUserSchema = z
  .object({
    name: z.string().trim().max(100, "Name must be 100 characters or less").nullable(),
    username: z
      .string()
      .trim()
      .max(100, "Username must be 100 characters or less")
      .nullable(),
    // Optional: users sign in by phone and may have no email.
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .max(30, "Phone must be 30 characters or less")
      .nullable(),
    roleId: z.number().int().min(1).nullable(),
    roleName: z.string().trim().min(1).nullable(),
    isActive: z.boolean(),
    // Admin only — leave blank to keep the current password.
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    // User only — leave blank to keep the current PIN.
    pin: z.string().optional(),
    confirmPin: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password) {
      if (data.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password must be at least 6 characters",
        });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match",
        });
      }
    }

    if (data.pin) {
      if (!/^\d{6}$/.test(data.pin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pin"],
          message: "PIN must be 6 numeric digits",
        });
      }
      if (data.pin !== data.confirmPin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPin"],
          message: "PINs do not match",
        });
      }
    }
  });

export type ManageUserAccountType = z.infer<typeof manageUserAccountTypeSchema>;
export type ManageUserRole = z.infer<typeof manageUserRoleSchema>;
export type ManageUser = z.infer<typeof manageUserSchema>;
export type ManageUsersPage = z.infer<typeof manageUsersPageSchema>;
export type EditManageUserFormValues = z.infer<typeof editManageUserSchema>;
