import { z } from "zod";

export const adminProfileFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(80, "Username is too long."),
  email: z.string().email(),
});

export type AdminProfileFormValues = z.infer<typeof adminProfileFormSchema>;
