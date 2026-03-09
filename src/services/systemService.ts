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
    return apiClient.get<DbLatencyResponse>(config.endpoints.admin.system.dbLatency);
  }
}

export const systemService = new SystemService();
