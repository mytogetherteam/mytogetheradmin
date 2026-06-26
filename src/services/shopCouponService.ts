import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export type PromotionType = "BUY_X_GET_DISCOUNT" | "BUY_X_GET_FREE";
export type DiscountRewardType = "PERCENTAGE" | "FIXED_AMOUNT";
export type CouponTarget = "ALL" | "EARLY_BIRD";
export type CouponLimitType = "ONE_TIME" | "PERMANENT";
export type CouponItemType = "BUY" | "GET";

export interface ShopCouponShopSummary {
  id: number;
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  slug: string | null;
}

export interface ShopCouponMenuItemSummary {
  id: number;
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  originalPrice: number | null;
  imageUrl: string | null;
}

export interface ShopCouponItemRow {
  id: number;
  menuItemId: number;
  type: CouponItemType;
  menuItem: ShopCouponMenuItemSummary;
}

export interface ShopCouponListItem {
  id: number;
  shopId: number;
  name: string;
  description: string | null;
  promotionType: PromotionType;
  discountType: DiscountRewardType | null;
  discountValue: number;
  target: CouponTarget;
  validFrom: string;
  validUntil: string;
  limitType: CouponLimitType;
  redeemedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shop: ShopCouponShopSummary;
  itemCount: number;
  redemptionCount: number;
  items: ShopCouponItemRow[];
}

export interface ShopCouponItemPayload {
  menuItemId: number;
  type: CouponItemType;
}

export interface ShopCouponPayload {
  shopId: number;
  name: string;
  description?: string;
  promotionType: PromotionType;
  discountType?: DiscountRewardType;
  discountValue?: number;
  target?: CouponTarget;
  validFrom: string;
  validUntil: string;
  limitType?: CouponLimitType;
  isActive?: boolean;
  items?: ShopCouponItemPayload[];
}

export type UpdateShopCouponPayload = Partial<ShopCouponPayload>;

function normalizeShopCoupon(
  coupon: ShopCouponListItem,
): ShopCouponListItem {
  return {
    ...coupon,
    promotionType:
      coupon.promotionType === "BUY_X_GET_FREE"
        ? "BUY_X_GET_FREE"
        : "BUY_X_GET_DISCOUNT",
    discountType:
      coupon.discountType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : coupon.discountType,
    target: coupon.target === "EARLY_BIRD" ? "EARLY_BIRD" : "ALL",
    limitType: coupon.limitType === "PERMANENT" ? "PERMANENT" : "ONE_TIME",
  };
}

export interface PaginatedShopCoupons {
  content: ShopCouponListItem[];
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

export const ShopCouponService = {
  getShopCoupons: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    shopId?: number;
    isActive?: boolean;
  }): Promise<PaginatedShopCoupons> => {
    const response = await handleApiCall<
      | ShopCouponListItem[]
      | PaginatedShopCoupons
      | NestPaginatedEnvelope<ShopCouponListItem>
    >(() => api.get(config.endpoints.admin.shopCoupons.base, { params }), {
      preservePaginatedMeta: true,
    });

    if (isPaginatedEnvelope<ShopCouponListItem>(response)) {
      return {
        content: response.data.map(normalizeShopCoupon),
        totalElements: response.meta.total,
        totalPages: response.meta.last_page,
      };
    }
    if (Array.isArray(response)) {
      return {
        content: response.map(normalizeShopCoupon),
        totalElements: response.length,
        totalPages: 1,
      };
    }
    const paginated = response as PaginatedShopCoupons;
    return {
      ...paginated,
      content: paginated.content?.map(normalizeShopCoupon) ?? [],
    };
  },

  createShopCoupon: async (
    payload: ShopCouponPayload,
  ): Promise<ShopCouponListItem> => {
    const created = await handleApiCall<ShopCouponListItem>(() =>
      api.post(config.endpoints.admin.shopCoupons.base, payload),
    );
    return normalizeShopCoupon(created);
  },

  getShopCouponById: async (id: number): Promise<ShopCouponListItem> => {
    const coupon = await handleApiCall<ShopCouponListItem>(() =>
      api.get(config.endpoints.admin.shopCoupons.detail(id)),
    );
    return normalizeShopCoupon(coupon);
  },

  updateShopCoupon: async (
    id: number,
    payload: UpdateShopCouponPayload,
  ): Promise<ShopCouponListItem> => {
    const updated = await handleApiCall<ShopCouponListItem>(() =>
      api.put(config.endpoints.admin.shopCoupons.detail(id), payload),
    );
    return normalizeShopCoupon(updated);
  },

  deleteShopCoupon: async (id: number): Promise<void> => {
    return handleApiCall(() =>
      api.delete(config.endpoints.admin.shopCoupons.detail(id)),
    );
  },
};
