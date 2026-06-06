import { z } from "zod";
import { visaSectionSchema } from "./visa.schema";

export const visaCategoryFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  section: visaSectionSchema.default("VISA_TYPES"),
  displayOrder: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().min(1, "Display order must be at least 1").optional(),
  ),
  isActive: z.boolean().default(true),
});

export type VisaCategoryFormValues = z.infer<typeof visaCategoryFormSchema>;

export function visaCategoryToFormValues(category: {
  title: string;
  section: z.infer<typeof visaSectionSchema>;
  displayOrder: number;
  isActive: boolean;
}): VisaCategoryFormValues {
  return {
    title: category.title,
    section: category.section,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
  };
}
