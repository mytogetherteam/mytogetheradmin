import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export type PlanBillingPeriod = "MONTHLY" | "YEARLY";

/** Stable key tying a feature to the capability it governs. Null = display-only. */
export type PlanFeatureKey =
  | "BOOSTING"
  | "REMINDER_ALERT"
  | "ANALYTIC_REPORT"
  | "FLASH_DROP"
  | "FLASH_DEAL"
  | "FLASH_MENU"
  | "EXCLUSIVE_EVENT"
  | "BANNER"
  | "WEBSITE_LOCAL_ADS"
  | "SOCIAL_MEDIA_PACKAGE"
  | "DEDICATED_ACCOUNT"
  | "MYDAY"
  | "JOB_POST"
  | "COUPON"
  | "ITEM_POST";

/** How a plan expresses its allowance for a capability. */
export type PlanFeatureValueType = "COUNT" | "LEVEL" | "SELECTION";

export interface PlanFeatureKeyInfo {
  key: PlanFeatureKey;
  label: string;
  description: string;
  valueType: PlanFeatureValueType;
}

/** A capability plus which feature (if any) already claims it. */
export interface PlanFeatureKeyOption extends PlanFeatureKeyInfo {
  usedByFeatureId: number | null;
  usedByFeatureName: string | null;
}

/** One selectable item of a "pick N of these" feature, e.g. "Facebook post x 2". */
export interface PlanFeatureOptionRow {
  id: number;
  code: string;
  textEn: string;
  textMm: string | null;
  textTh: string | null;
  /** How many of this deliverable are included, e.g. 2 Facebook posts. */
  quantity: number | null;
  displayOrder: number;
  isActive: boolean;
}

export interface PlanFeatureSummary {
  id: number;
  code: string;
  featureKey: PlanFeatureKey | null;
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  descriptionEn: string | null;
  descriptionMm: string | null;
  descriptionTh: string | null;
  displayOrder: number;
  isActive: boolean;
  options: PlanFeatureOptionRow[];
}

export interface PlanFeatureValueRow {
  id?: number;
  featureId: number;
  quantity: number | null;
  isUnlimited: boolean;
  period: string | null;
  valueLabel: string | null;
  note: string | null;
  /** How many options the shop may pick, e.g. 2 for "(Choose 2)". */
  chooseCount: number | null;
  /** True for "(All)" — every offered option is included. */
  isChooseAll: boolean;
  /** Options this plan explicitly offers; empty = the feature's whole catalogue. */
  optionIds: number[];
  /** Raw per-plan rows — quantity null means "use the option's own amount". */
  optionSelections: { optionId: number; quantity: number | null }[];
  /** Resolved menu the shop picks from. */
  offeredOptions: PlanFeatureOptionRow[];
  /** Pricing-page suffix: "(Choose 2)", "(All)" or null. */
  chooseLabel: string | null;
  displayOrder: number;
  isActive: boolean;
  feature?: PlanFeatureSummary;
}

export interface PlanHighlightRow {
  id?: number;
  textEn: string;
  textMm: string | null;
  textTh: string | null;
  displayOrder: number;
}

export interface PlanListItem {
  id: number;
  code: string;
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  descriptionEn: string | null;
  descriptionMm: string | null;
  descriptionTh: string | null;
  price: number | null;
  /** Total charged for one year; null when the plan has no annual option. */
  annualPrice: number | null;
  /** annualPrice / 12 — what the pricing page shows under "Annually". */
  annualMonthlyPrice: number | null;
  /** Savings vs. paying monthly, e.g. 20 for "Save 20%". */
  annualDiscountPercent: number | null;
  hasAnnualPricing: boolean;
  billingPeriod: PlanBillingPeriod;
  isCustomPricing: boolean;
  isPopular: boolean;
  ctaLabel: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  featureValues: PlanFeatureValueRow[];
  highlights: PlanHighlightRow[];
}

export interface PlanHighlightPayload {
  textEn: string;
  textMm?: string;
  textTh?: string;
  displayOrder?: number;
}

export interface PlanFeatureValuePayload {
  featureId: number;
  quantity?: number;
  isUnlimited?: boolean;
  period?: string;
  valueLabel?: string;
  note?: string;
  chooseCount?: number;
  isChooseAll?: boolean;
  /** Omit or send [] to offer every active option at the catalogue's amounts. */
  options?: { optionId: number; quantity?: number }[];
  displayOrder?: number;
  isActive?: boolean;
}

export interface PlanPayload {
  nameEn: string;
  nameMm?: string;
  nameTh?: string;
  descriptionEn?: string;
  descriptionMm?: string;
  descriptionTh?: string;
  price?: number;
  /** Pass null to remove the annual option from an existing plan. */
  annualPrice?: number | null;
  billingPeriod?: PlanBillingPeriod;
  isCustomPricing?: boolean;
  isPopular?: boolean;
  ctaLabel?: string;
  isActive?: boolean;
  featureValues?: PlanFeatureValuePayload[];
  highlights?: PlanHighlightPayload[];
}

export type UpdatePlanPayload = Partial<PlanPayload>;

export interface PlanFeatureListItem {
  id: number;
  code: string;
  featureKey: PlanFeatureKey | null;
  featureKeyInfo: PlanFeatureKeyInfo | null;
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  /** Tooltip text on the pricing page. */
  descriptionEn: string | null;
  descriptionMm: string | null;
  descriptionTh: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  options: PlanFeatureOptionRow[];
}

export interface PlanFeatureOptionPayload {
  /** Send the existing id back so plans referencing this option keep working. */
  id?: number;
  textEn: string;
  quantity?: number;
  textMm?: string;
  textTh?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface PlanFeaturePayload {
  nameEn: string;
  /** Pass null to unlink the capability and make the feature display-only. */
  featureKey?: PlanFeatureKey | null;
  nameMm?: string;
  nameTh?: string;
  descriptionEn?: string;
  descriptionMm?: string;
  descriptionTh?: string;
  /** Passing this replaces the full option list. */
  options?: PlanFeatureOptionPayload[];
  isActive?: boolean;
}

export type UpdatePlanFeaturePayload = Partial<PlanFeaturePayload>;

export interface PaginatedPlans {
  content: PlanListItem[];
  totalElements: number;
  totalPages: number;
}

export interface PaginatedPlanFeatures {
  content: PlanFeatureListItem[];
  totalElements: number;
  totalPages: number;
}

interface NestPaginatedEnvelope<T> {
  data: T[];
  meta: { total: number; last_page: number };
}

function isPaginatedEnvelope<T>(
  value: unknown,
): value is NestPaginatedEnvelope<T> {
  return (
    !!value &&
    typeof value === "object" &&
    "meta" in value &&
    "data" in value &&
    Array.isArray((value as { data: unknown }).data)
  );
}

interface PaginatedContent<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

function normalizePaginated<T>(
  response: T[] | PaginatedContent<T> | NestPaginatedEnvelope<T>,
  mapper: (item: T) => T,
): PaginatedContent<T> {
  if (isPaginatedEnvelope<T>(response)) {
    return {
      content: response.data.map(mapper),
      totalElements: response.meta.total,
      totalPages: response.meta.last_page,
    };
  }
  if (Array.isArray(response)) {
    return {
      content: response.map(mapper),
      totalElements: response.length,
      totalPages: 1,
    };
  }
  const paginated = response;
  return {
    content: paginated.content?.map(mapper) ?? [],
    totalElements: paginated.totalElements ?? 0,
    totalPages: paginated.totalPages ?? 1,
  };
}

function toNumberOrNull(value: number | null | undefined): number | null {
  return value != null ? Number(value) : null;
}

function normalizePlan(plan: PlanListItem): PlanListItem {
  const annualPrice = toNumberOrNull(plan.annualPrice);
  const price = toNumberOrNull(plan.price);
  const annualMonthlyPrice =
    toNumberOrNull(plan.annualMonthlyPrice) ??
    (annualPrice != null ? Math.round((annualPrice / 12) * 100) / 100 : null);

  return {
    ...plan,
    featureValues: (plan.featureValues ?? []).map((value) => ({
      ...value,
      optionIds: value.optionIds ?? [],
      optionSelections: value.optionSelections ?? [],
      offeredOptions: value.offeredOptions ?? [],
    })),
    billingPeriod: plan.billingPeriod === "YEARLY" ? "YEARLY" : "MONTHLY",
    price,
    annualPrice,
    annualMonthlyPrice,
    annualDiscountPercent:
      toNumberOrNull(plan.annualDiscountPercent) ??
      (price != null && price > 0 && annualMonthlyPrice != null
        ? Math.round((1 - annualMonthlyPrice / price) * 100)
        : null),
    hasAnnualPricing: plan.hasAnnualPricing ?? annualPrice != null,
  };
}

function normalizePlanFeature(feature: PlanFeatureListItem): PlanFeatureListItem {
  return { ...feature, options: feature.options ?? [] };
}

export const PlanService = {
  getPlans: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedPlans> => {
    const response = await handleApiCall<
      PlanListItem[] | PaginatedPlans | NestPaginatedEnvelope<PlanListItem>
    >(() => api.get(config.endpoints.admin.plans.base, { params }), {
      preservePaginatedMeta: true,
    });
    return normalizePaginated(response, normalizePlan);
  },

  getPlanById: async (id: number): Promise<PlanListItem> => {
    const plan = await handleApiCall<PlanListItem>(() =>
      api.get(config.endpoints.admin.plans.detail(id)),
    );
    return normalizePlan(plan);
  },

  createPlan: async (payload: PlanPayload): Promise<PlanListItem> => {
    const created = await handleApiCall<PlanListItem>(() =>
      api.post(config.endpoints.admin.plans.base, payload),
    );
    return normalizePlan(created);
  },

  updatePlan: async (
    id: number,
    payload: UpdatePlanPayload,
  ): Promise<PlanListItem> => {
    const updated = await handleApiCall<PlanListItem>(() =>
      api.put(config.endpoints.admin.plans.detail(id), payload),
    );
    return normalizePlan(updated);
  },

  deletePlan: async (id: number): Promise<void> => {
    return handleApiCall(() =>
      api.delete(config.endpoints.admin.plans.detail(id)),
    );
  },

  reorderPlans: async (ids: number[]): Promise<void> => {
    await handleApiCall(() =>
      api.post(config.endpoints.admin.plans.reorder, { ids }),
    );
  },

  getPlanFeatures: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedPlanFeatures> => {
    const response = await handleApiCall<
      | PlanFeatureListItem[]
      | PaginatedPlanFeatures
      | NestPaginatedEnvelope<PlanFeatureListItem>
    >(() => api.get(config.endpoints.admin.planFeatures.base, { params }), {
      preservePaginatedMeta: true,
    });
    return normalizePaginated(response, normalizePlanFeature);
  },

  getPlanFeatureKeys: async (): Promise<PlanFeatureKeyOption[]> => {
    const keys = await handleApiCall<PlanFeatureKeyOption[]>(() =>
      api.get(config.endpoints.admin.planFeatures.keys),
    );
    return keys ?? [];
  },

  getPlanFeatureById: async (id: number): Promise<PlanFeatureListItem> => {
    const feature = await handleApiCall<PlanFeatureListItem>(() =>
      api.get(config.endpoints.admin.planFeatures.detail(id)),
    );
    return normalizePlanFeature(feature);
  },

  createPlanFeature: async (
    payload: PlanFeaturePayload,
  ): Promise<PlanFeatureListItem> => {
    const created = await handleApiCall<PlanFeatureListItem>(() =>
      api.post(config.endpoints.admin.planFeatures.base, payload),
    );
    return normalizePlanFeature(created);
  },

  updatePlanFeature: async (
    id: number,
    payload: UpdatePlanFeaturePayload,
  ): Promise<PlanFeatureListItem> => {
    const updated = await handleApiCall<PlanFeatureListItem>(() =>
      api.put(config.endpoints.admin.planFeatures.detail(id), payload),
    );
    return normalizePlanFeature(updated);
  },

  deletePlanFeature: async (id: number): Promise<void> => {
    return handleApiCall(() =>
      api.delete(config.endpoints.admin.planFeatures.detail(id)),
    );
  },

  reorderPlanFeatures: async (ids: number[]): Promise<void> => {
    await handleApiCall(() =>
      api.post(config.endpoints.admin.planFeatures.reorder, { ids }),
    );
  },
};
