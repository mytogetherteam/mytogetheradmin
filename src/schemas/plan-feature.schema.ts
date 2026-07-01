import { z } from "zod";

export const planFeatureSchema = z.object({
  nameEn: z.string().trim().min(1, "English name is required").max(150),
  nameMm: z.string().max(150).optional().or(z.literal("")),
  nameTh: z.string().max(150).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type PlanFeatureFormValues = z.infer<typeof planFeatureSchema>;
