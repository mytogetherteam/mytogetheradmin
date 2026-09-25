import { apiClient } from './apiClient';
import { config } from '../config/config';

export interface FreeDeliveryConfigDTO {
  id: number;
  isEnabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface UpdateFreeDeliveryConfigPayload {
  isEnabled?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

class FreeDeliveryService {
  async getConfig(): Promise<FreeDeliveryConfigDTO> {
    const res = await apiClient.get(config.api.admin.freeDelivery.config);
    return (res.data?.data ?? res.data) as FreeDeliveryConfigDTO;
  }

  async updateConfig(
    payload: UpdateFreeDeliveryConfigPayload,
  ): Promise<FreeDeliveryConfigDTO> {
    const res = await apiClient.put(
      config.api.admin.freeDelivery.config,
      payload,
    );
    return (res.data?.data ?? res.data) as FreeDeliveryConfigDTO;
  }
}

export const freeDeliveryService = new FreeDeliveryService();
