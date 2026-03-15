import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface AppVersion {
  id: number;
  appType: string;
  platform: string;
  minimumVersion: string;
  latestVersion: string;
  updateUrl: string;
  updateMessageEn: string;
  updateMessageMm: string;
  updateMessageTh: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class AppVersionService {
  async getAppVersions(): Promise<AppVersion[]> {
    return apiClient.get<AppVersion[]>(config.endpoints.admin.system.appVersions.base);
  }

  async updateAppVersion(data: Partial<AppVersion>): Promise<AppVersion[]> {
    return apiClient.put<AppVersion[]>(config.endpoints.admin.system.appVersions.base, data);
  }

  async updateAppVersionByPlatform(platform: string, data: Partial<AppVersion>): Promise<AppVersion> {
    return apiClient.put<AppVersion>(config.endpoints.admin.system.appVersions.platform(platform), data);
  }
}

export const appVersionService = new AppVersionService();
