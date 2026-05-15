import { z } from "zod";

export const cuisineSchema = z.object({
  nameEn: z.string().min(1, "Name (English) is required"),
  nameMm: z.string().optional(),
  nameTh: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().min(1, "Display order must be at least 1").default(1),
});

export type CuisineFormValues = z.infer<typeof cuisineSchema>;
