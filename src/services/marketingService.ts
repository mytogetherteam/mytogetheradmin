import { apiClient } from './apiClient';

export type BannerPlacement = 'HOME_TOP' | 'FEED_MIDDLE' | 'SHOP_DETAIL' | 'SEARCH_TOP';

export interface Banner {
  id: string;
  title: string;
  titleMm?: string;
  titleTh?: string;
  titleEn?: string;
  imageUrl: string;
  linkUrl?: string;
  placement: BannerPlacement;
  displayOrder?: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface FeaturedShop {
  id: string;
  shopId: string;
  shopName: string;
  trendingScore: number;
  isFeatured: boolean;
  boostExpiry?: string;
}

export interface CreateBannerRequest {
  title: string;
  titleMm?: string;
  titleTh?: string;
  titleEn?: string;
  imageUrl: string;
  linkUrl?: string;
  placement: BannerPlacement;
  displayOrder?: number;
  isActive?: boolean;
  startDate: string;
  endDate: string;
}

class MarketingService {
  async getBanners(): Promise<Banner[]> {
    return apiClient.get<Banner[]>('/api/admin/marketing/banners');
  }

  async createBanner(data: CreateBannerRequest): Promise<Banner> {
    return apiClient.post<Banner>('/api/admin/marketing/banners', data);
  }

  async updateBanner(id: string, data: Partial<CreateBannerRequest>): Promise<Banner> {
    return apiClient.put<Banner>(`/api/admin/marketing/banners/${id}`, data);
  }

  async deleteBanner(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/admin/marketing/banners/${id}`);
  }

  async toggleBanner(id: string, isActive: boolean): Promise<Banner> {
    return apiClient.put<Banner>(`/api/admin/marketing/banners/${id}/toggle`, { isActive });
  }

  async getFeaturedShops(): Promise<FeaturedShop[]> {
    return apiClient.get<FeaturedShop[]>('/api/admin/marketing/featured-shops');
  }

  async boostShop(shopId: string, boostScore: number): Promise<void> {
    return apiClient.post<void>(`/api/admin/marketing/shops/${shopId}/boost?score=${boostScore}`, {});
  }

  async setFeatured(shopId: string, featured: boolean): Promise<void> {
    return apiClient.post<void>(`/api/admin/marketing/shops/${shopId}/featured?featured=${featured}`, {});
  }

  async broadcastToUsers(title: string, message: string, data?: any): Promise<void> {
    return apiClient.post<void>('/api/admin/announcements/broadcast/users', { title, message, data });
  }

  async broadcastToShops(title: string, message: string, data?: any): Promise<void> {
    return apiClient.post<void>('/api/admin/announcements/broadcast/shops', { title, message, data });
  }

  async getBroadcastHistory(page = 0, size = 10): Promise<any> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<any>(`/api/admin/announcements/broadcast/history?${params.toString()}`);
  }
}


export const marketingService = new MarketingService();
