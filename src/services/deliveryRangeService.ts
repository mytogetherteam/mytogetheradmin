import { apiClient } from "./apiClient";
import { config } from "@/config/config";

export interface DeliveryRangeDTO {
  enabled: boolean;
  maxDeliveryKm: number;
  farWarningKm: number;
  updatedAt?: string | null;
}

export interface UpdateDeliveryRangePayload {
  enabled: boolean;
  maxDeliveryKm: number;
  farWarningKm: number;
}

class DeliveryRangeService {
  async get(): Promise<DeliveryRangeDTO> {
    return apiClient.get<DeliveryRangeDTO>(config.endpoints.admin.system.deliveryRange);
  }

  async update(payload: UpdateDeliveryRangePayload): Promise<DeliveryRangeDTO> {
    return apiClient.put<DeliveryRangeDTO>(config.endpoints.admin.system.deliveryRange, payload);
  }
}

export const deliveryRangeService = new DeliveryRangeService();
