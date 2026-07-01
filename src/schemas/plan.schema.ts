import { z } from "zod";

export const PLAN_BILLING_PERIODS = ["MONTHLY", "YEARLY"] as const;

const planHighlightSchema = z.object({
  textEn: z.string().trim().min(1, "English text is required").max(500),
  textMm: z.string().max(500).optional().or(z.literal("")),
  textTh: z.string().max(500).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

const planFeatureValueSchema = z.object({
  featureId: z.coerce.number().int().min(1, "Feature is required"),
  quantity: z.coerce.number().int().min(0).optional(),
  isUnlimited: z.boolean().optional(),
  period: z.string().max(50).optional().or(z.literal("")),
  valueLabel: z.string().max(100).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const planSchema = z
  .object({
    nameEn: z.string().trim().min(1, "English name is required").max(150),
    nameMm: z.string().max(150).optional().or(z.literal("")),
    nameTh: z.string().max(150).optional().or(z.literal("")),
    descriptionEn: z.string().max(5000).optional().or(z.literal("")),
    descriptionMm: z.string().max(5000).optional().or(z.literal("")),
    descriptionTh: z.string().max(5000).optional().or(z.literal("")),
    price: z.coerce.number().min(0).optional(),
    billingPeriod: z.enum(PLAN_BILLING_PERIODS).default("MONTHLY"),
    isCustomPricing: z.boolean().default(false),
    isPopular: z.boolean().default(false),
    ctaLabel: z.string().max(100).optional().or(z.literal("")),
    isActive: z.boolean().default(true),
    featureValues: z.array(planFeatureValueSchema).optional(),
    highlights: z.array(planHighlightSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isCustomPricing) {
      if (data.price === undefined || Number.isNaN(data.price)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price is required unless custom pricing is enabled",
          path: ["price"],
        });
      }
    }
  });

export type PlanFormValues = z.infer<typeof planSchema>;
export type PlanHighlightFormValues = z.infer<typeof planHighlightSchema>;
export type PlanFeatureValueFormValues = z.infer<typeof planFeatureValueSchema>;

export const billingPeriodLabels: Record<
  (typeof PLAN_BILLING_PERIODS)[number],
  string
> = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};
