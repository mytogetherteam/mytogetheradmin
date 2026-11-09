import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface OrderFlowTimes {
  pendingWarnMinutes: number;
  pendingCancelMinutes: number;
  paymentWarnMinutes: number;
  paymentCancelMinutes: number;
  approvalWarnMinutes: number;
  updatedAt?: string | null;
}

class OrderTimeoutService {
  async get(): Promise<OrderFlowTimes> {
    return apiClient.get<OrderFlowTimes>(config.endpoints.admin.system.orderTimeouts.base);
  }

  async update(payload: OrderFlowTimes): Promise<OrderFlowTimes> {
    return apiClient.put<OrderFlowTimes>(
      config.endpoints.admin.system.orderTimeouts.base,
      payload,
    );
  }
}

export const orderTimeoutService = new OrderTimeoutService();
