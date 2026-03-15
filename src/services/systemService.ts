import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface AuditLog {
  id: string;
  adminName: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
  beforeData?: string; // JSON string
  afterData?: string;  // JSON string
}

export interface AuditLogPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface DbLatencyResponse {
  status: string;
  dbLatency: number;
  performance?: string;
}

export interface OrderTimeoutRule {
  status: string;
  timeoutMinutes: number;
  alertTarget: 'SHOP' | 'USER' | 'ADMIN' | 'ALL';
  enabled: boolean;
}

export interface SystemConfig {
  configKey: string;
  configValue: string;
  description?: string;
}

class SystemService {
  async getAuditLogs(page = 0, size = 20, search = '', adminId?: string): Promise<AuditLogPage> {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size), 
      search: search
    });
    if (adminId) params.append('adminId', adminId);
    return apiClient.get<AuditLogPage>(`${config.endpoints.admin.auditLogs}?${params.toString()}`);
  }

  async getDbLatency(): Promise<DbLatencyResponse> {
    return apiClient.get<DbLatencyResponse>(config.endpoints.admin.system.latency);
  }

  // --- Order Timeout Management ---

  async getOrderTimeouts(): Promise<OrderTimeoutRule[]> {
    return apiClient.get<OrderTimeoutRule[]>(config.endpoints.admin.system.orderTimeouts.base);
  }

  async updateOrderTimeout(status: string, data: Partial<OrderTimeoutRule>): Promise<OrderTimeoutRule> {
    return apiClient.put<OrderTimeoutRule>(config.endpoints.admin.system.orderTimeouts.status(status), data);
  }

  async initOrderTimeouts(): Promise<void> {
    return apiClient.post(config.endpoints.admin.system.orderTimeouts.init);
  }

  // --- System Configuration Management ---

  async getConfigs(): Promise<SystemConfig[]> {
    return apiClient.get<SystemConfig[]>(config.endpoints.admin.system.configs.base);
  }

  async updateConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
    return apiClient.put<SystemConfig>(config.endpoints.admin.system.configs.key(key), { configValue: value, description });
  }

  async initConfigs(): Promise<void> {
    return apiClient.post(config.endpoints.admin.system.configs.init);
  }
}

export const systemService = new SystemService();
