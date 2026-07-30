import type { FieldErrors, UseFormSetError } from "react-hook-form";
import type { z } from "zod";

import type {
  PlanFeatureValueFormValues,
  PlanFormValues,
} from "@/schemas/plan.schema";
import type {
  PlanFeatureListItem,
  PlanFeatureOptionRow,
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
    annualPrice: plan.annualPrice ?? undefined,
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
      chooseCount: item.chooseCount ?? undefined,
      isChooseAll: item.isChooseAll,
      optionIds: item.optionIds ?? [],
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

/**
 * Drops the fields a feature's value type does not use. The form hides those
 * inputs, so this is what keeps a value from an earlier pick (or from legacy
 * data) reaching the API where nothing would read it.
 */
function stripUnusedFeatureValueFields(
  item: PlanFeatureValueFormValues,
  features: PlanFeatureListItem[],
): PlanFeatureValueFormValues {
  const valueType = features.find((feature) => feature.id === item.featureId)
    ?.featureKeyInfo?.valueType;

  return {
    ...item,
    ...(valueType === "COUNT"
      ? {}
      : { quantity: undefined, period: "", isUnlimited: false }),
    ...(valueType === "SELECTION"
      ? {}
      : { chooseCount: undefined, isChooseAll: false, optionIds: [] }),
  };
}

export function toPlanPayload(
  values: PlanFormValues,
  features: PlanFeatureListItem[] = [],
): PlanPayload {
  return {
    nameEn: values.nameEn.trim(),
    nameMm: values.nameMm?.trim() || undefined,
    nameTh: values.nameTh?.trim() || undefined,
    descriptionEn: values.descriptionEn?.trim() || undefined,
    descriptionMm: values.descriptionMm?.trim() || undefined,
    descriptionTh: values.descriptionTh?.trim() || undefined,
    price: values.isCustomPricing ? undefined : values.price,
    // null clears the annual option on an existing plan; undefined would keep it.
    annualPrice: values.isCustomPricing ? null : (values.annualPrice ?? null),
    billingPeriod: values.billingPeriod,
    isCustomPricing: values.isCustomPricing,
    isPopular: values.isPopular,
    ctaLabel: values.ctaLabel?.trim() || undefined,
    isActive: values.isActive,
    featureValues: (values.featureValues ?? [])
      .map((item) => stripUnusedFeatureValueFields(item, features))
      .map((item, index) => ({
        featureId: item.featureId,
        quantity: item.isUnlimited ? undefined : item.quantity,
        isUnlimited: item.isUnlimited ?? false,
        period: item.period?.trim() || undefined,
        valueLabel: item.valueLabel?.trim() || undefined,
        note: item.note?.trim() || undefined,
        // "(All)" wins over "(Choose N)"; the API stores them mutually exclusive.
        chooseCount: item.isChooseAll ? undefined : item.chooseCount,
        isChooseAll: item.isChooseAll ?? false,
        optionIds: item.optionIds ?? [],
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

export const MONTHS_PER_YEAR = 12;

export interface AnnualPricing {
  /** Per-month equivalent of the annual price. */
  monthlyEquivalent: number;
  /** Savings vs. paying monthly, e.g. 20 for "Save 20%". Null when not comparable. */
  discountPercent: number | null;
}

/** Mirrors the API's derived annual fields so the form can preview them live. */
export function deriveAnnualPricing(
  monthlyPrice: number | undefined | null,
  annualPrice: number | undefined | null,
): AnnualPricing | null {
  if (annualPrice == null || Number.isNaN(annualPrice)) return null;

  const monthlyEquivalent =
    Math.round((annualPrice / MONTHS_PER_YEAR) * 100) / 100;
  const comparable =
    monthlyPrice != null && !Number.isNaN(monthlyPrice) && monthlyPrice > 0;

  return {
    monthlyEquivalent,
    discountPercent: comparable
      ? Math.round((1 - monthlyEquivalent / monthlyPrice) * 100)
      : null,
  };
}

export function formatPlanPrice(plan: PlanListItem): string {
  if (plan.isCustomPricing || plan.price == null) return "Let's talk";

  const monthly = `฿${plan.price.toLocaleString()} / mo`;
  if (plan.annualPrice == null) return monthly;

  const annual = `฿${plan.annualPrice.toLocaleString()} / yr`;
  return plan.billingPeriod === "YEARLY"
    ? `${annual} · ${monthly}`
    : `${monthly} · ${annual}`;
}

export function resolvePlanFeatureName(
  featureId: number,
  features: PlanFeatureListItem[],
): string {
  const feature = features.find((item) => item.id === featureId);
  if (!feature) return "Select feature";
  return `${feature.nameEn} (${feature.code})`;
}

/** The option menu a plan offers: its own picks, or the feature's whole catalogue. */
export function resolveOfferedOptions(
  value: PlanFeatureValueFormValues | undefined,
  features: PlanFeatureListItem[],
): PlanFeatureOptionRow[] {
  const catalogue = (
    features.find((item) => item.id === value?.featureId)?.options ?? []
  ).filter((option) => option.isActive);

  const selected = value?.optionIds ?? [];
  if (selected.length === 0) return catalogue;
  return catalogue.filter((option) => selected.includes(option.id));
}

/** Mirrors the API's chooseLabel: "(Choose 2)", "(All)" or null. */
export function formatChooseLabel(
  value: PlanFeatureValueFormValues | undefined,
  offeredCount: number,
): string | null {
  if (!value || offeredCount === 0) return null;
  if (value.isChooseAll) return "(All)";
  if (value.chooseCount != null && !Number.isNaN(value.chooseCount)) {
    return `(Choose ${value.chooseCount})`;
  }
  return null;
}

export function formatFeatureValueSummary(
  value: PlanFeatureValueFormValues,
  features: PlanFeatureListItem[] = [],
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

  const offered = resolveOfferedOptions(value, features);
  const chooseLabel = formatChooseLabel(value, offered.length);
  if (chooseLabel) {
    parts.push(`${chooseLabel} of ${offered.length}`);
  }

  if (value.note?.trim()) {
    parts.push(value.note.trim());
  }

  if (parts.length > 0) return parts.join(" · ");

  // Only a COUNT feature is missing something; the rest simply have no number.
  const valueType = features.find((item) => item.id === value.featureId)
    ?.featureKeyInfo?.valueType;
  return valueType === "COUNT" ? "No quota set" : "Included";
}
