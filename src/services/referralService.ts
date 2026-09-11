import { apiClient } from './apiClient';
import { config } from '../config/config';

export type ReferralRewardTarget = 'NONE' | 'REFERRER_ONLY' | 'REFERRED_ONLY' | 'BOTH';

export interface ShopCouponSummary {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  promotionType: string;
  discountType?: string | null;
  discountValue?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  isCurrentlyValid?: boolean;
  shop?: {
    id: number;
    nameEn: string;
  };
}

export interface ReferralConfigDTO {
  id: number;
  isActive: boolean;
  rewardTarget: ReferralRewardTarget;
  referrerCouponId?: number | null;
  referrerCustomText?: string | null;
  referredCouponId?: number | null;
  referredCustomText?: string | null;
  referrerCoupon?: ShopCouponSummary | null;
  referredCoupon?: ShopCouponSummary | null;
  updatedAt?: string;
}

export interface ReferralCodeDTO {
  id: number;
  code: string;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    phone: string;
    username: string | null;
    profileUrl: string | null;
  };
}

export interface ReferralRedemptionDTO {
  id: number;
  code: string;
  rewardTarget: ReferralRewardTarget;
  referrerCouponId?: number | null;
  referredCouponId?: number | null;
  referrerCustomText?: string | null;
  referredCustomText?: string | null;
  createdAt: string;
  referrer: {
    id: number;
    name: string | null;
    phone: string;
    username: string | null;
  };
  referredUser: {
    id: number;
    name: string | null;
    phone: string;
    username: string | null;
  };
}

export interface UpdateReferralConfigPayload {
  isActive?: boolean;
  rewardTarget?: ReferralRewardTarget;
  referrerCouponId?: number | null;
  referrerCustomText?: string | null;
  referredCouponId?: number | null;
  referredCustomText?: string | null;
}

export const referralService = {
  getConfig: async (): Promise<ReferralConfigDTO> => {
    return apiClient.get<ReferralConfigDTO>(config.endpoints.admin.marketing.referrals.config);
  },

  updateConfig: async (payload: UpdateReferralConfigPayload): Promise<ReferralConfigDTO> => {
    return apiClient.put<ReferralConfigDTO>(config.endpoints.admin.marketing.referrals.config, payload);
  },

  getCodes: async (params: { page: number; size: number; search?: string }): Promise<ReferralCodeDTO[]> => {
    const urlParams = new URLSearchParams({
      page: params.page.toString(),
      size: params.size.toString(),
      ...(params.search ? { search: params.search } : {}),
    });
    const result = await apiClient.get<any>(`${config.endpoints.admin.marketing.referrals.codes}?${urlParams.toString()}`);
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.items)) return result.items;
    return [];
  },

  getRedemptions: async (params: { page: number; size: number; search?: string }): Promise<ReferralRedemptionDTO[]> => {
    const urlParams = new URLSearchParams({
      page: params.page.toString(),
      size: params.size.toString(),
      ...(params.search ? { search: params.search } : {}),
    });
    const result = await apiClient.get<any>(`${config.endpoints.admin.marketing.referrals.redemptions}?${urlParams.toString()}`);
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.items)) return result.items;
    return [];
  },

  applyCouponToAllUsers: async (couponId: number): Promise<{ couponId: number; distributedCount: number }> => {
    return apiClient.post<{ couponId: number; distributedCount: number }>(
      config.endpoints.admin.marketing.referrals.applyToAll(couponId),
      {}
    );
  },

  getShopCoupons: async (params?: { search?: string; isActive?: boolean }): Promise<ShopCouponSummary[]> => {
    const urlParams = new URLSearchParams({
      page: '1',
      size: '100',
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.isActive !== undefined ? { isActive: String(params.isActive) } : {}),
    });
    const result = await apiClient.get<any>(`${config.endpoints.admin.marketing.coupons.base}?${urlParams.toString()}`);
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.items)) return result.items;
    return [];
  },
};
