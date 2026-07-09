import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface DashboardStats {
  totalUsers: number;
  totalShops: number;
  totalReviews: number;
  totalOrdersToday: number;
  totalRevenueToday: number;
}

export interface RevenueData {
  date: string;
  count: number;
  amount: number;
}

export interface SessionData {
  date: string;
  dau: number;
  avgSessionLength: number;
}

export interface SessionSummary {
  totalSessions: number;
  averageDurationSeconds: number;
  averageActivitiesPerSession: number;
  averageShopsViewed: number;
  averageSearches: number;
  activeSessions: number;
  topEntryPoints: Record<string, number>;
  topExitPoints: Record<string, number>;
}

export interface LocationData {
  district: string;
  activityCount: number;
}

export interface PopularShop {
  shopId: number;
  shopName: string;
  viewCount: number;
  uniqueViewers: number;
  revenue?: number;
}

export interface CategoryStats {
  category: string;
  viewCount: number;
  percentage: number;
}

export interface FeedSectionStats {
  sectionType?: string;
  type?: string;
  totalViews?: number;
  impressions?: number;
  totalClicks?: number;
  clicks?: number;
  clickThroughRate?: number;
  ctr?: number;
}

export interface DeviceStats {
  type: string;
  count: number;
  percentage: number;
}

export interface ExtendedDashboardStats {
  dau: number;
  mau: number;
  couponUsage: {
    count: number;
    totalDiscount: number;
  };
  peakHours: Array<{ hour: number; count: number }>;
  geoHotspots: Array<{ district: string; count: number }>;
  categorySales: Array<{ category: string; count: number; total: number }>;
  fleetStatus: {
    active: number;
    busy: number;
    total: number;
  };
  avgDeliveryTime: number;
  topSearches: Array<{ term: string; count: number }>;
}

export interface FeatureUsageData {
  totalOrders: number;
  cancelledOrders: number;
  cancellationRatePercent: number;
}

export interface CancellationRateData {
  totalOrders: number;
  cancelledOrders: number;
  cancellationRatePercent: number;
}

export interface UserGrowthData {
  date: string;
  newUsers: number;
  cumulativeTotal: number;
}

export interface FeatureUsageData {
  feature: string;
  usageCount: number;
  percentage: number;
}

class AnalyticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>(config.endpoints.admin.analytics.dashboard);
  }

  async getRevenueAnalytics(start?: string, end?: string): Promise<RevenueData[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<RevenueData[]>(`${config.endpoints.admin.analytics.revenue}${query}`);
  }

  async getSessionAnalytics(): Promise<SessionSummary | SessionData[]> {
    return apiClient.get<SessionSummary | SessionData[]>(config.endpoints.admin.analytics.sessions);
  }

  async getLocationAnalytics(): Promise<LocationData[]> {
    return apiClient.get<LocationData[]>(config.endpoints.admin.analytics.locations);
  }

  async getPopularShops(): Promise<PopularShop[]> {
    return apiClient.get<PopularShop[]>(config.endpoints.admin.analytics.popularShops);
  }

  async getCategoryStats(): Promise<CategoryStats[]> {
    return apiClient.get<CategoryStats[]>(config.endpoints.admin.analytics.categories);
  }

  async getSystemHealth(): Promise<{ dbLatency: number; status: string }> {
    return apiClient.get<{ dbLatency: number; status: string }>('/admin/analytics/system-health');
  }

  async getFeedPerformance(): Promise<{ overallCtr: number }> {
    return apiClient.get<{ overallCtr: number }>(config.endpoints.admin.analytics.feed);
  }

  async getFeedSectionStats(type: string): Promise<FeedSectionStats> {
    return apiClient.get<FeedSectionStats>(config.endpoints.admin.analytics.feedSections(type));
  }

  async getDeviceStats(): Promise<DeviceStats[]> {
    return apiClient.get<DeviceStats[]>(config.endpoints.admin.analytics.deviceStats);
  }

  async getOrderVolumeChart(start?: string, end?: string): Promise<RevenueData[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<RevenueData[]>(`${config.endpoints.admin.analytics.orders}${query}`);
  }

  async getCancellationRate(start?: string, end?: string): Promise<CancellationRateData> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<CancellationRateData>(`${config.endpoints.admin.analytics.ordersCancellationRate}${query}`);
  }

  async getUserGrowth(start?: string, end?: string): Promise<UserGrowthData[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<UserGrowthData[]>(`${config.endpoints.admin.analytics.usersGrowth}${query}`);
  }

  async getShopRevenue(shopId: number, start?: string, end?: string): Promise<RevenueData[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<RevenueData[]>(`${config.endpoints.admin.analytics.shopRevenue(shopId)}${query}`);
  }

  async getShopOrders(shopId: number, start?: string, end?: string): Promise<RevenueData[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<RevenueData[]>(`${config.endpoints.admin.analytics.shopOrders(shopId)}${query}`);
  }

  async getFeatureUsage(): Promise<FeatureUsageData[]> {
    return apiClient.get<FeatureUsageData[]>(config.endpoints.admin.analytics.features);
  }

  async getDeviceDetail(deviceId: string): Promise<Record<string, unknown>> {
    return apiClient.get<Record<string, unknown>>(config.endpoints.admin.analytics.deviceDetail(deviceId));
  }

  async getExtendedDashboardStats(): Promise<ExtendedDashboardStats | null> {
    try {
      const response = await apiClient.get<ExtendedDashboardStats>('/admin/analytics/dashboard-extended');
      return response;
    } catch (error) {
      console.error('Failed to fetch extended dashboard stats:', error);
      return null;
    }
  }
}

export const analyticsService = new AnalyticsService();
