import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export type PlanBillingPeriod = "MONTHLY" | "YEARLY";

export interface PlanFeatureSummary {
  id: number;
  code: string;
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface PlanFeatureValueRow {
  id?: number;
  featureId: number;
  quantity: number | null;
  isUnlimited: boolean;
  period: string | null;
  valueLabel: string | null;
  note: string | null;
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
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeaturePayload {
  nameEn: string;
  nameMm?: string;
  nameTh?: string;
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

function normalizePaginated<T>(
  response: T[] | PaginatedPlans | NestPaginatedEnvelope<T>,
  mapper: (item: T) => T,
): { content: T[]; totalElements: number; totalPages: number } {
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
  const paginated = response as PaginatedPlans;
  return {
    content: paginated.content?.map(mapper) ?? [],
    totalElements: paginated.totalElements ?? 0,
    totalPages: paginated.totalPages ?? 1,
  };
}

function normalizePlan(plan: PlanListItem): PlanListItem {
  return {
    ...plan,
    billingPeriod: plan.billingPeriod === "YEARLY" ? "YEARLY" : "MONTHLY",
    price: plan.price != null ? Number(plan.price) : null,
  };
}

function normalizePlanFeature(feature: PlanFeatureListItem): PlanFeatureListItem {
  return { ...feature };
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
