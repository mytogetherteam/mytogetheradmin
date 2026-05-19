import { apiClient } from './apiClient';
import { config } from '@/config/config';


export interface Banner {
  id: string;
  titleMm?: string;
  titleTh?: string;
  titleEn?: string;
  imageUrl: string;
  linkUrl?: string;
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
  titleMm?: string;
  titleTh?: string;
  titleEn?: string;
  imageUrl?: string;
  linkUrl?: string;
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
  async getBanners(page = 0, size = 100): Promise<Banner[]> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await apiClient.get<{ content: Banner[] } | Banner[]>(`${config.endpoints.admin.marketing.banners.base}?${params.toString()}`);
    return Array.isArray(response) ? response : response.content || [];
  }

  async createBanner(data: CreateBannerRequest, imageFile?: File): Promise<Banner> {
    const formData = new FormData();
    // Backend expects 'data' as a JSON Part
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return apiClient.post<Banner>(config.endpoints.admin.marketing.banners.base, formData);
  }

  async updateBanner(id: string, data: Partial<CreateBannerRequest>, imageFile?: File): Promise<Banner> {
    const formData = new FormData();
    // Backend expects 'data' as a JSON Part
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return apiClient.put<Banner>(config.endpoints.admin.marketing.banners.detail(id), formData);
  }

  async deleteBanner(id: string): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.marketing.banners.detail(id));
  }



  async getFeaturedShops(page = 0, size = 100): Promise<FeaturedShop[]> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await apiClient.get<{ content: FeaturedShop[] } | FeaturedShop[]>(`${config.endpoints.admin.marketing.featuredShops}?${params.toString()}`);
    return Array.isArray(response) ? response : response.content || [];
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
