import type { FieldErrors, UseFormSetError } from "react-hook-form";
import type { z } from "zod";

import type {
  PlanFeatureValueFormValues,
  PlanFormValues,
} from "@/schemas/plan.schema";
import type {
  PlanFeatureListItem,
  PlanListItem,
  PlanPayload,
} from "@/services/planService";

export function collectErrorMessages(
  fieldErrors: FieldErrors<PlanFormValues>,
): string[] {
  const messages: string[] = [];
  for (const value of Object.values(fieldErrors)) {
    if (!value) continue;
    if ("message" in value && typeof value.message === "string") {
      messages.push(value.message);
      continue;
    }
    if (typeof value === "object") {
      messages.push(...collectErrorMessages(value as FieldErrors<PlanFormValues>));
    }
  }
  return messages;
}

export function mapPlanToFormValues(plan: PlanListItem): PlanFormValues {
  return {
    nameEn: plan.nameEn,
    nameMm: plan.nameMm ?? "",
    nameTh: plan.nameTh ?? "",
    descriptionEn: plan.descriptionEn ?? "",
    descriptionMm: plan.descriptionMm ?? "",
    descriptionTh: plan.descriptionTh ?? "",
    price: plan.price ?? undefined,
    billingPeriod: plan.billingPeriod,
    isCustomPricing: plan.isCustomPricing,
    isPopular: plan.isPopular,
    ctaLabel: plan.ctaLabel ?? "",
    isActive: plan.isActive,
    featureValues: plan.featureValues.map((item) => ({
      featureId: item.featureId,
      quantity: item.quantity ?? undefined,
      isUnlimited: item.isUnlimited,
      period: item.period ?? "",
      valueLabel: item.valueLabel ?? "",
      note: item.note ?? "",
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    })),
    highlights: plan.highlights.map((item) => ({
      textEn: item.textEn,
      textMm: item.textMm ?? "",
      textTh: item.textTh ?? "",
      displayOrder: item.displayOrder,
    })),
  };
}

export function toPlanPayload(values: PlanFormValues): PlanPayload {
  return {
    nameEn: values.nameEn.trim(),
    nameMm: values.nameMm?.trim() || undefined,
    nameTh: values.nameTh?.trim() || undefined,
    descriptionEn: values.descriptionEn?.trim() || undefined,
    descriptionMm: values.descriptionMm?.trim() || undefined,
    descriptionTh: values.descriptionTh?.trim() || undefined,
    price: values.isCustomPricing ? undefined : values.price,
    billingPeriod: values.billingPeriod,
    isCustomPricing: values.isCustomPricing,
    isPopular: values.isPopular,
    ctaLabel: values.ctaLabel?.trim() || undefined,
    isActive: values.isActive,
    featureValues: (values.featureValues ?? []).map((item, index) => ({
      featureId: item.featureId,
      quantity: item.isUnlimited ? undefined : item.quantity,
      isUnlimited: item.isUnlimited ?? false,
      period: item.period?.trim() || undefined,
      valueLabel: item.valueLabel?.trim() || undefined,
      note: item.note?.trim() || undefined,
      displayOrder: item.displayOrder ?? index,
      isActive: item.isActive ?? true,
    })),
    highlights: (values.highlights ?? []).map((item, index) => ({
      textEn: item.textEn.trim(),
      textMm: item.textMm?.trim() || undefined,
      textTh: item.textTh?.trim() || undefined,
      displayOrder: item.displayOrder ?? index,
    })),
  };
}

export function applyZodIssuesToForm(
  issues: z.ZodIssue[],
  setError: UseFormSetError<PlanFormValues>,
) {
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      setError(field as keyof PlanFormValues, { message: issue.message });
    }
  }
}

export function formatPlanPrice(plan: PlanListItem): string {
  if (plan.isCustomPricing || plan.price == null) return "Let's talk";
  return `฿${plan.price.toLocaleString()} / ${plan.billingPeriod === "YEARLY" ? "yr" : "mo"}`;
}

export function resolvePlanFeatureName(
  featureId: number,
  features: PlanFeatureListItem[],
): string {
  const feature = features.find((item) => item.id === featureId);
  if (!feature) return "Select feature";
  return `${feature.nameEn} (${feature.code})`;
}

export function formatFeatureValueSummary(
  value: PlanFeatureValueFormValues,
): string {
  const parts: string[] = [];

  if (value.isUnlimited) {
    parts.push("Unlimited");
  } else if (value.quantity != null && !Number.isNaN(value.quantity)) {
    const period = value.period?.trim();
    parts.push(period ? `${value.quantity}/${period}` : String(value.quantity));
  }

  if (value.valueLabel?.trim()) {
    parts.push(value.valueLabel.trim());
  }

  if (value.note?.trim()) {
    parts.push(value.note.trim());
  }

  return parts.length > 0 ? parts.join(" · ") : "No quota set";
}
