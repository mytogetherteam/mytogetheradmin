import { apiClient, ApiResponseData } from './apiClient';

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

class SystemService {
  async getAuditLogs(page = 0, size = 20, search = '', adminId?: string): Promise<AuditLogPage> {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    if (adminId) params.append('adminId', adminId);
    const response = await apiClient.get<ApiResponseData<AuditLogPage>>(`/api/admin/admin/audit-logs?${params.toString()}`);
    return response.data;
  }

  async getDbLatency(): Promise<any> {
    return apiClient.get<any>('/api/admin/system/db-latency');
  }
}

export const systemService = new SystemService();
