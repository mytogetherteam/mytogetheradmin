import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ConfigUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  avatarUrl?: string;
}

export interface SystemConfig {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  id: number;
  configKey: string;
  configValue: string;
  description: string;
  deleted: boolean;
  createdBy?: ConfigUser;
  createdById?: number;
  updatedBy?: ConfigUser;
  updatedById?: number;
}

class SystemConfigService {
  async getConfigs(): Promise<SystemConfig[]> {
    return apiClient.get<SystemConfig[]>(config.endpoints.admin.system.configs.base);
  }

  async updateConfig(key: string, value: string, description: string): Promise<SystemConfig> {
    const params = new URLSearchParams();
    params.append('value', value);
    if (description) params.append('description', description);
    
    const endpoint = `${config.endpoints.admin.system.configs.key(key)}?${params.toString()}`;
    return apiClient.put<SystemConfig>(endpoint);
  }

  async initConfigs(): Promise<void> {
    return apiClient.post(config.endpoints.admin.system.configs.init);
  }
}

export const systemConfigService = new SystemConfigService();
