import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface AppContent {
  id: number;
  pageKey: string;
  targetApp: string;
  titleEn: string;
  titleMm: string;
  titleTh: string;
  contentEn: string;
  contentMm: string;
  contentTh: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class AppContentService {
  async getAppContents(): Promise<AppContent[]> {
    return apiClient.get<AppContent[]>(config.endpoints.admin.system.appContent.base);
  }

  async getAppContent(id: number | string): Promise<AppContent> {
    return apiClient.get<AppContent>(config.endpoints.admin.system.appContent.detail(id));
  }

  async updateAppContent(key: string, data: Partial<AppContent>): Promise<AppContent> {
    return apiClient.put<AppContent>(config.endpoints.admin.system.appContent.key(key), data);
  }

  async publishAppContent(key: string, targetApp: string): Promise<void> {
    return apiClient.post(`${config.endpoints.admin.system.appContent.publish(key)}?targetApp=${targetApp}`);
  }

  async deleteAppContent(id: number | string): Promise<void> {
    return apiClient.delete(config.endpoints.admin.system.appContent.detail(id));
  }
}

export const appContentService = new AppContentService();
