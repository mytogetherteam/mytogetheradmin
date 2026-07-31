import { z } from "zod";

/**
 * Reset window for a quantity quota. A closed set, not free text: quota
 * enforcement has to turn this into a date range. Empty = the whole billing cycle.
 * Mirrors PLAN_FEATURE_PERIODS on the API.
 */
export const PLAN_FEATURE_PERIODS = [
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
] as const;

export const NO_PERIOD = "__PER_CYCLE__";

export const PLAN_FEATURE_PERIOD_LABELS: Record<string, string> = {
  [NO_PERIOD]: "Per billing cycle",
  minute: "Per minute",
  hour: "Per hour",
  day: "Per day",
  week: "Per week",
  month: "Per month",
  year: "Per year",
};

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
  period: z.enum(PLAN_FEATURE_PERIODS).optional().or(z.literal("")),
  valueLabel: z.string().max(100).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  /** "(Choose 2)" — how many of the offered options a shop may pick. */
  chooseCount: z.coerce.number().int().min(1).optional(),
  /** "(All)" — every offered option is included. */
  isChooseAll: z.boolean().optional(),
  /**
   * Which options this plan offers and how much of each it gives.
   * Empty = all active options at the catalogue's own amounts.
   */
  options: z
    .array(
      z.object({
        optionId: z.coerce.number().int().min(1),
        /** Per-plan amount; blank inherits the option's own. */
        quantity: z.coerce.number().int().min(1).optional(),
      }),
    )
    .optional(),
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
    annualPrice: z.coerce.number().min(0).optional(),
    billingPeriod: z.enum(PLAN_BILLING_PERIODS).default("MONTHLY"),
    isCustomPricing: z.boolean().default(false),
    isPopular: z.boolean().default(false),
    ctaLabel: z.string().max(100).optional().or(z.literal("")),
    isActive: z.boolean().default(true),
    featureValues: z.array(planFeatureValueSchema).optional(),
    highlights: z.array(planHighlightSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isCustomPricing) return;

    if (data.price === undefined || Number.isNaN(data.price)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required unless custom pricing is enabled",
        path: ["price"],
      });
    }

    const hasAnnual =
      data.annualPrice !== undefined && !Number.isNaN(data.annualPrice);

    if (data.billingPeriod === "YEARLY" && !hasAnnual) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Annual price is required when the default billing period is Yearly",
        path: ["annualPrice"],
      });
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
