import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";
import type { PlanBillingPeriod } from "./planService";

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELED";

/** SHOP_REQUEST came with a transfer slip; ADMIN_GRANT was handed over directly. */
export type SubscriptionSource = "SHOP_REQUEST" | "ADMIN_GRANT";

export type SubscriptionPaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SubscriptionPaymentRow {
  id: number;
  amount: number | null;
  screenshotUrl: string;
  status: SubscriptionPaymentStatus;
  paidAt: string | null;
  transferRef: string | null;
  rejectReason: string | null;
  platformAccount: {
    id: number;
    accountName: string;
    accountNumber: string;
    paymentMethod: { id: number; name: string; iconUrl: string | null };
  } | null;
  reviewedAt?: string | null;
  createdAt: string;
}

/** A quota frozen onto the subscription when it was activated. */
export interface SubscriptionQuotaRow {
  featureKey: string;
  featureName: string | null;
  limit: number | null;
  isUnlimited: boolean;
  period: string | null;
  valueLabel: string | null;
  chooseCount: number | null;
  isChooseAll: boolean;
}

export interface SubscriptionDeliveryRow {
  id: number;
  deliveredAt: string;
  linkUrl: string | null;
  note: string | null;
  deliveredBy: { id: number; name: string | null; email: string } | null;
}

export interface SubscriptionOptionRow {
  /** The row id — what a delivery is recorded against. */
  id: number;
  featureKey: string;
  optionId: number;
  optionText: string | null;
  /** How many are owed. Null = not countable, nothing to tick off. */
  quantity: number | null;
  deliveredCount: number;
  remainingCount: number | null;
  isFullyDelivered: boolean;
  deliveries: SubscriptionDeliveryRow[];
}

export interface RecordDeliveryPayload {
  subscriptionOptionId: number;
  deliveredAt?: string;
  linkUrl?: string;
  note?: string;
}

export interface SubscriptionListItem {
  id: number;
  shopId: number;
  shop: { id: number; nameEn: string; logoUrl: string | null } | null;
  planId: number;
  plan: {
    id: number;
    code: string;
    nameEn: string;
    price: number | null;
    annualPrice: number | null;
    isCustomPricing: boolean;
  } | null;
  billingPeriod: PlanBillingPeriod;
  amount: number | null;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  startDate: string | null;
  endDate: string | null;
  /** True only while now sits inside the period — not just "status is ACTIVE". */
  isCurrent: boolean;
  daysRemaining: number | null;
  rejectReason: string | null;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  latestPayment: SubscriptionPaymentRow | null;
  payments: SubscriptionPaymentRow[];
  quotas: SubscriptionQuotaRow[];
  options: SubscriptionOptionRow[];
}

/**
 * What approving a pending purchase would do. Returned on the detail endpoint so
 * the reviewer sees the consequence before clicking.
 */
export interface ActivationPreview {
  startDate: string;
  endDate: string;
  /** True when it queues behind a period the shop already paid for. */
  isRenewal: boolean;
  stackedOnSubscriptionId: number | null;
  supersedes: { id: number; endDate: string | null; daysCutShort: number }[];
}

export interface SubscriptionDetail extends SubscriptionListItem {
  activationPreview: ActivationPreview | null;
}

export type SubscriptionSummary = Record<SubscriptionStatus, number>;

export interface SubscriptionListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: SubscriptionStatus;
  shopId?: number;
  planId?: number;
}

export interface PaginatedSubscriptions {
  content: SubscriptionListItem[];
  totalElements: number;
  totalPages: number;
}

export interface GrantSubscriptionPayload {
  shopId: number;
  planId: number;
  billingPeriod?: PlanBillingPeriod;
  /** Overrides the plan price; required for custom-priced plans. */
  amount?: number;
  startDate?: string;
  adminNote?: string;
  selectedOptionIds?: number[];
}

interface NestEnvelope<T> {
  data: T[];
  meta: { total: number; last_page: number };
}

function isEnvelope<T>(value: unknown): value is NestEnvelope<T> {
  return (
    !!value &&
    typeof value === "object" &&
    "meta" in value &&
    "data" in value &&
    Array.isArray((value as { data: unknown }).data)
  );
}

export const SubscriptionService = {
  getSubscriptions: async (
    params?: SubscriptionListParams,
  ): Promise<PaginatedSubscriptions> => {
    const response = await handleApiCall<
      SubscriptionListItem[] | NestEnvelope<SubscriptionListItem>
    >(
      () =>
        api.get(config.endpoints.admin.subscriptions.base, {
          params: {
            page: params?.page ?? 1,
            size: params?.size ?? 20,
            ...(params?.search ? { search: params.search } : {}),
            ...(params?.status ? { status: params.status } : {}),
            ...(params?.shopId ? { shopId: params.shopId } : {}),
            ...(params?.planId ? { planId: params.planId } : {}),
          },
        }),
      { preservePaginatedMeta: true },
    );

    if (isEnvelope<SubscriptionListItem>(response)) {
      return {
        content: response.data,
        totalElements: response.meta.total,
        totalPages: response.meta.last_page,
      };
    }
    const list = Array.isArray(response) ? response : [];
    return { content: list, totalElements: list.length, totalPages: 1 };
  },

  getSummary: async (): Promise<SubscriptionSummary> => {
    return handleApiCall<SubscriptionSummary>(() =>
      api.get(config.endpoints.admin.subscriptions.summary),
    );
  },

  getSubscriptionById: async (id: number): Promise<SubscriptionDetail> => {
    return handleApiCall<SubscriptionDetail>(() =>
      api.get(config.endpoints.admin.subscriptions.detail(id)),
    );
  },

  approve: async (
    id: number,
    body: { startDate?: string; adminNote?: string } = {},
  ): Promise<SubscriptionListItem> => {
    return handleApiCall<SubscriptionListItem>(() =>
      api.post(config.endpoints.admin.subscriptions.approve(id), body),
    );
  },

  reject: async (id: number, reason: string): Promise<SubscriptionListItem> => {
    return handleApiCall<SubscriptionListItem>(() =>
      api.post(config.endpoints.admin.subscriptions.reject(id), { reason }),
    );
  },

  cancel: async (id: number, reason: string): Promise<SubscriptionListItem> => {
    return handleApiCall<SubscriptionListItem>(() =>
      api.post(config.endpoints.admin.subscriptions.cancel(id), { reason }),
    );
  },

  updateOptions: async (
    id: number,
    selectedOptionIds: number[],
  ): Promise<SubscriptionDetail> => {
    return handleApiCall<SubscriptionDetail>(() =>
      api.put(`${config.endpoints.admin.subscriptions.detail(id)}/options`, {
        selectedOptionIds,
      }),
    );
  },

  recordDelivery: async (
    id: number,
    payload: RecordDeliveryPayload,
  ): Promise<SubscriptionDetail> => {
    return handleApiCall<SubscriptionDetail>(() =>
      api.post(`${config.endpoints.admin.subscriptions.detail(id)}/deliveries`, payload),
    );
  },

  removeDelivery: async (
    id: number,
    deliveryId: number,
  ): Promise<SubscriptionDetail> => {
    return handleApiCall<SubscriptionDetail>(() =>
      api.delete(
        `${config.endpoints.admin.subscriptions.detail(id)}/deliveries/${deliveryId}`,
      ),
    );
  },

  grant: async (
    payload: GrantSubscriptionPayload,
  ): Promise<SubscriptionListItem> => {
    return handleApiCall<SubscriptionListItem>(() =>
      api.post(config.endpoints.admin.subscriptions.grant, payload),
    );
  },
};
