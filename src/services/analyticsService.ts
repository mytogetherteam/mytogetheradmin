import { apiClient, ApiResponseData } from './apiClient';

export interface DashboardStats {
  totalUsers: number;
  totalShops: number;
  totalReviews: number;
  totalOrdersToday: number;
  totalRevenueToday: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface SessionData {
  date: string;
  dau: number;
  avgSessionLength: number;
}

export interface LocationData {
  district: string;
  count: number;
}

export interface PopularShop {
  id: string;
  name: string;
  revenue: number;
  orderCount: number;
}

export interface CategoryStats {
  name: string;
  viewCount: number;
}

class AnalyticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponseData<DashboardStats>>('/api/admin/dashboard/stats');
    return response.data;
  }

  async getRevenueAnalytics(start?: string, end?: string): Promise<RevenueData[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<ApiResponseData<RevenueData[]>>(`/api/admin/analytics/revenue${query}`);
    return response.data;
  }

  async getSessionAnalytics(): Promise<SessionData[]> {
    const response = await apiClient.get<ApiResponseData<SessionData[]>>('/api/admin/analytics/sessions');
    return response.data;
  }

  async getLocationAnalytics(): Promise<LocationData[]> {
    const response = await apiClient.get<ApiResponseData<LocationData[]>>('/api/admin/analytics/locations');
    return response.data;
  }

  async getPopularShops(): Promise<PopularShop[]> {
    const response = await apiClient.get<ApiResponseData<PopularShop[]>>('/api/admin/analytics/shops/popular');
    return response.data;
  }

  async getCategoryStats(): Promise<CategoryStats[]> {
    const response = await apiClient.get<ApiResponseData<CategoryStats[]>>('/api/admin/analytics/categories');
    return response.data;
  }

  async getSystemHealth(): Promise<{ dbLatency: number; status: string }> {
    const response = await apiClient.get<ApiResponseData<{ dbLatency: number; status: string }>>('/api/admin/system/db-latency');
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
