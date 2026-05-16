import { z } from "zod";

export const shopSubCategorySchema = z.object({
  categoryId: z.coerce.number().min(1, "Please select a parent category"),
  nameEn: z.string().min(1, "Name (English) is required"),
  nameMm: z.string().optional(),
  nameTh: z.string().optional(),
  displayOrder: z.coerce.number().min(1, "Display order must be at least 1").default(1),
  isActive: z.boolean().default(true),
});

export type ShopSubCategoryFormValues = z.infer<typeof shopSubCategorySchema>;
