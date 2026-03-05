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
  revenue?: number; // Keep for backward compatibility if used elsewhere
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
  count: number;
}

export interface PopularShop {
  id?: string;
  shopId?: number;
  name?: string;
  shopName?: string;
  revenue?: number;
  totalRevenue?: number;
  orderCount?: number;
}

export interface CategoryStats {
  name: string;
  viewCount: number;
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
  platform: string;
  count: number;
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
    return apiClient.get<{ dbLatency: number; status: string }>(config.endpoints.admin.system.dbLatency);
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
}

export const analyticsService = new AnalyticsService();
