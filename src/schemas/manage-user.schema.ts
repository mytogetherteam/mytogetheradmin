import { z } from "zod";

export const manageUserAccountTypeSchema = z.enum(["admin", "customer"]);

export const manageUserRoleSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const manageUserSchema = z.object({
  accountType: manageUserAccountTypeSchema,
  id: z.number(),
  name: z.string().nullable(),
  email: z.string().email(),
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

export const editManageUserSchema = z.object({
  name: z.string().trim().max(100, "Name must be 100 characters or less").nullable(),
  username: z
    .string()
    .trim()
    .max(100, "Username must be 100 characters or less")
    .nullable(),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone must be 30 characters or less")
    .nullable(),
  roleId: z.number().int().min(1).nullable(),
  roleName: z.string().trim().min(1).nullable(),
  isActive: z.boolean(),
});

export type ManageUserAccountType = z.infer<typeof manageUserAccountTypeSchema>;
export type ManageUserRole = z.infer<typeof manageUserRoleSchema>;
export type ManageUser = z.infer<typeof manageUserSchema>;
export type ManageUsersPage = z.infer<typeof manageUsersPageSchema>;
export type EditManageUserFormValues = z.infer<typeof editManageUserSchema>;
