import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface OrderTimeoutRule {
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  id: number;
  status: string;
  timeoutMinutes: number;
  alertTarget: 'SHOP' | 'USER' | 'ADMIN' | 'ALL';
  enabled: boolean;
  deleted: boolean;
}

class OrderTimeoutService {
  async getOrderTimeouts(): Promise<OrderTimeoutRule[]> {
    return apiClient.get<OrderTimeoutRule[]>(config.endpoints.admin.system.orderTimeouts.base);
  }

  async updateOrderTimeout(status: string, data: FormData): Promise<OrderTimeoutRule> {
    return apiClient.put<OrderTimeoutRule>(config.endpoints.admin.system.orderTimeouts.status(status), data);
  }

  async initOrderTimeouts(): Promise<void> {
    return apiClient.post(config.endpoints.admin.system.orderTimeouts.init);
  }
}

export const orderTimeoutService = new OrderTimeoutService();
