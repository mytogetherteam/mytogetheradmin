import { apiClient } from './apiClient';
import { config } from '@/config/config';

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
    return apiClient.get<FreeDeliveryConfigDTO>(
      config.endpoints.admin.system.freeDelivery.config,
    );
  }

  async updateConfig(
    payload: UpdateFreeDeliveryConfigPayload,
  ): Promise<FreeDeliveryConfigDTO> {
    return apiClient.put<FreeDeliveryConfigDTO>(
      config.endpoints.admin.system.freeDelivery.config,
      payload,
    );
  }
}

export const freeDeliveryService = new FreeDeliveryService();
