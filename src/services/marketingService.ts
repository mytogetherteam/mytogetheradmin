import { apiClient } from './apiClient';
import { config } from '@/config/config';

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

export type NotificationData = Record<string, string | number | boolean | null | undefined>;

export interface BroadcastHistoryItem {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  recipientCount?: number;
  sentByName?: string;
  targetType?: string;
  [key: string]: unknown;
}

export interface BroadcastHistoryPage {
  content: BroadcastHistoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
}

class MarketingService {
  async getBanners(): Promise<Banner[]> {
    return apiClient.get<Banner[]>(config.endpoints.admin.marketing.banners.base);
  }

  async createBanner(data: CreateBannerRequest | FormData): Promise<Banner> {
    return apiClient.post<Banner>(config.endpoints.admin.marketing.banners.base, data);
  }

  async updateBanner(id: string, data: Partial<CreateBannerRequest> | FormData): Promise<Banner> {
    return apiClient.put<Banner>(config.endpoints.admin.marketing.banners.detail(id), data);
  }

  async deleteBanner(id: string): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.marketing.banners.detail(id));
  }



  async getFeaturedShops(): Promise<FeaturedShop[]> {
    return apiClient.get<FeaturedShop[]>(config.endpoints.admin.marketing.featuredShops);
  }

  async boostShop(shopId: string, boostScore: number): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.marketing.shopActions.boost(shopId) + `?score=${boostScore}`, {});
  }

  async setFeatured(shopId: string, featured: boolean): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.marketing.shopActions.featured(shopId) + `?featured=${featured}`, {});
  }

  async broadcastToUsers(title: string, message: string, data?: NotificationData): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.announcements.broadcastUsers, { title, body: message, data });
  }

  async broadcastToShops(title: string, message: string, data?: NotificationData): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.announcements.broadcastShops, { title, body: message, data });
  }

  async notifySingleUser(userId: string | number, title: string, message: string, data?: NotificationData): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.announcements.notifyUser(userId), { title, body: message, data });
  }

  async notifySingleShop(shopId: string | number, title: string, message: string, data?: NotificationData): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.announcements.notifyShop(shopId), { title, body: message, data });
  }

  async createAnnouncement(title: string, message: string, data?: NotificationData): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.announcements.create, { title, body: message, data });
  }

  async getBroadcastHistory(page = 0, size = 10): Promise<BroadcastHistoryPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<BroadcastHistoryPage>(`${config.endpoints.admin.announcements.history}?${params.toString()}`);
  }
}


export const marketingService = new MarketingService();
