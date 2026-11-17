import { apiClient } from "./apiClient";
import { config } from "@/config/config";

export interface MerchantOperationsFilters {
  startDate?: string;
  endDate?: string;
  tab?: 'cancels' | 'top' | 'normal' | 'dormant' | 'all';
  search?: string;
  urgency?: 'all' | 'critical' | 'warning' | 'dormant' | 'normal';
  followUpStatus?: string;
  page?: number;
  limit?: number;
}

export interface ShopPerformanceItem {
  id: number;
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  phone: string | null;
  logoUrl: string | null;
  addressEn: string | null;
  isVerified: boolean;
  isOpen: boolean;
  group: 'top' | 'normal' | 'dormant' | 'high_cancel';
  urgency: 'critical' | 'warning' | 'dormant' | 'normal';
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  cancelRate: number; // 0 to 100
  totalGmv: number;
  lostGmv: number;
  topCancelReason: string | null;
  cancelReasonsBreakdown: Array<{ reason: string; count: number; percentage: number }>;
  canceledByBreakdown: {
    shop: number;
    user: number;
    system: number;
    admin: number;
  };
  peakCancelHours: Array<{ hour: number; timeWindow: string; count: number }>;
  lastOrderAt: string | null;
  daysSinceLastOrder: number | null;
  followUpStatus: 'PENDING' | 'CALLED' | 'RESOLVED' | 'NO_ANSWER';
  followUpNotes: string | null;
  lastContactedAt: string | null;
  contactedByName: string | null;
}

export interface MerchantOperationsResponse {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalShops: number;
    highCancelShopsCount: number;
    topPerformersCount: number;
    normalVolumeCount: number;
    dormantShopsCount: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    platformCancelRate: number;
    totalGmv: number;
    totalLostGmv: number;
  };
  platformCancelReasons: Array<{ reason: string; count: number; percentage: number }>;
  shops: ShopPerformanceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AiFollowUpStrategy {
  rootCauseAnalysis: string;
  callScript: string;
  whatsappMessage: string;
  actionRecommendations: string[];
  urgency: 'Critical' | 'High' | 'Medium';
  keyFocus: string;
}

export interface AiStrategyResponse {
  shopId: number;
  shopName: string;
  strategy: AiFollowUpStrategy;
}

export const merchantOperationsService = {
  getMerchantPerformance: async (
    filters: MerchantOperationsFilters = {},
  ): Promise<MerchantOperationsResponse> => {
    const res = await apiClient.get<any>(
      config.endpoints.admin.operations.merchantPerformance,
      { params: filters },
    );
    return res?.data ?? res;
  },

  updateFollowUp: async (
    shopId: number,
    data: { status: string; note?: string },
  ): Promise<any> => {
    const res = await apiClient.post<any>(
      config.endpoints.admin.operations.updateFollowUp(shopId),
      data,
    );
    return res?.data ?? res;
  },

  getAiStrategy: async (
    shopId: number,
    dateRange?: { startDate?: string; endDate?: string },
  ): Promise<AiStrategyResponse> => {
    const res = await apiClient.post<any>(
      config.endpoints.admin.operations.aiStrategy(shopId),
      dateRange || {},
    );
    return res?.data ?? res;
  },
};
