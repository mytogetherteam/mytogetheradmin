import { z } from "zod";

/** Select value standing in for "no capability linked" (the field itself is null). */
export const DISPLAY_ONLY_FEATURE_KEY = "__DISPLAY_ONLY__";

const planFeatureOptionSchema = z.object({
  /** Present when editing — keeps plans that already reference this option. */
  id: z.coerce.number().int().min(1).optional(),
  textEn: z.string().trim().min(1, "Option text (EN) is required").max(500),
  textMm: z.string().max(500).optional().or(z.literal("")),
  textTh: z.string().max(500).optional().or(z.literal("")),
  /** How many are included, e.g. 2 for "Facebook post ×2". Blank = not countable. */
  quantity: z.coerce.number().int().min(1).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const planFeatureSchema = z.object({
  nameEn: z.string().trim().min(1, "English name is required").max(150),
  /** Capability key, or the display-only sentinel. */
  featureKey: z.string().default(DISPLAY_ONLY_FEATURE_KEY),
  nameMm: z.string().max(150).optional().or(z.literal("")),
  nameTh: z.string().max(150).optional().or(z.literal("")),
  descriptionEn: z.string().max(5000).optional().or(z.literal("")),
  descriptionMm: z.string().max(5000).optional().or(z.literal("")),
  descriptionTh: z.string().max(5000).optional().or(z.literal("")),
  options: z.array(planFeatureOptionSchema).optional(),
  isActive: z.boolean().default(true),
});

export type PlanFeatureFormValues = z.infer<typeof planFeatureSchema>;
export type PlanFeatureOptionFormValues = z.infer<
  typeof planFeatureOptionSchema
>;
