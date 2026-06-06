import { z } from "zod";

export const newsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  isActive: z.boolean().default(true),
});

export type NewsFormValues = z.infer<typeof newsSchema>;
