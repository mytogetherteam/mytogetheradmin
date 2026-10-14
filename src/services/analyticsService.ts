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

import type { MenuItem } from './menuService';

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
  appUsage?: {
    avgSessionSeconds: number;
    sessions: number;
    users: number;
    districts: Array<{
      district: string;
      users: number;
      sessions: number;
      avgSessionSeconds: number;
    }>;
    busyHours?: Array<{
      hour: number;
      users: number;
      sessions: number;
    }>;
  };
  topSearches: Array<{ term: string; count: number }>;
  userRegistrationStats?: {
    total: number;
    phoneCount: number;
    googleCount: number;
  };
  mostViewedMenus?: MenuItem[];
  mostLikedMenus?: MenuItem[];
  mostOrderedMenus?: (MenuItem & { orderCount?: number })[];
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
    return apiClient.get<{ dbLatency: number; status: string }>('/api/admin/analytics/system-health');
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
      const response = await apiClient.get<ExtendedDashboardStats>('/api/admin/analytics/dashboard-extended');
      return response;
    } catch (error) {
      console.error('Failed to fetch extended dashboard stats:', error);
      return null;
    }
  }

  async getActiveUserLocations(params?: {
    timeframe?: string;
    date?: string;
    month?: string;
  }): Promise<ActiveUserLocationsResponse> {
    const query = new URLSearchParams();
    if (params?.timeframe) query.append('timeframe', params.timeframe);
    if (params?.date) query.append('date', params.date);
    if (params?.month) query.append('month', params.month);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<ActiveUserLocationsResponse>(
      `${config.endpoints.admin.analytics.locations}${qs}`
    );
  }

  async getUserRegistrationStats(params?: {
    timeframe?: 'today' | 'day' | 'month' | 'all';
    date?: string;
    month?: string;
  }): Promise<UserRegistrationStatsResponse> {
    const query = new URLSearchParams();
    if (params?.timeframe) query.append('timeframe', params.timeframe);
    if (params?.date) query.append('date', params.date);
    if (params?.month) query.append('month', params.month);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<UserRegistrationStatsResponse>(
      `${config.endpoints.admin.analytics.userRegistrationStats}${qs}`
    );
  }
}

export interface ActiveUserLocationRecord {
  id: string;
  userId: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  latitude: number;
  longitude: number;
  district: string;
  address?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  sessionDurationSeconds: number;
  hits: number;
  source: 'saved_location' | 'order_delivery' | 'district_cluster';
}

export interface ActiveUserLocationsResponse {
  timeframe: string;
  date?: string | null;
  month?: string | null;
  totalActiveUsers: number;
  usersWithLocations: number;
  locations: ActiveUserLocationRecord[];
  districts: Array<{
    district: string;
    users: number;
    sessions: number;
    avgSessionSeconds: number;
    percentOfMax: number;
    percentOfTotal: number;
    lat?: number;
    lng?: number;
  }>;
  highestDistrictName?: string | null;
}

export interface UserRegistrationStatsResponse {
  timeframe: 'today' | 'day' | 'month' | 'all';
  date?: string | null;
  month?: string | null;
  phoneUsers: number;
  googleUsers: number;
  totalUsers: number;
  phonePercent: number;
  googlePercent: number;
  allTimePhone: number;
  allTimeGoogle: number;
  allTimeTotal: number;
  timeBreakdown?: {
    morning: { phone: number; google: number; total: number };
    afternoon: { phone: number; google: number; total: number };
    evening: { phone: number; google: number; total: number };
    night: { phone: number; google: number; total: number };
  };
  series: Array<{
    label: string;
    time?: string;
    hour?: number;
    date?: string;
    day?: number;
    phoneUsers: number;
    googleUsers: number;
    total: number;
  }>;
  recentUsers?: Array<{
    id: number;
    name: string | null;
    phone: string | null;
    email: string | null;
    channel: 'phone' | 'google';
    createdAt: string;
  }>;
}

export const analyticsService = new AnalyticsService();

