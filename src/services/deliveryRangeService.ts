import { apiClient } from "./apiClient";
import { config } from "@/config/config";

export interface DeliveryRangeDTO {
  enabled: boolean;
  maxDeliveryKm: number;
  farWarningKm: number;
  feeBufferThb?: number;
  effectiveFeeBufferThb?: number;
  lalamoveEnv?: 'SANDBOX' | 'PRODUCTION';
  updatedAt?: string | null;
}

export interface UpdateDeliveryRangePayload {
  enabled: boolean;
  maxDeliveryKm: number;
  farWarningKm: number;
  feeBufferThb?: number;
}

export interface DeliveryPolicyConfigDTO {
  riderWaitWarnMinutes: number;
  riderWaitFineMinutes: number;
  riderWaitFineThb: number;
  maxUnpaidPenaltyStrikes: number;
  autoRedispatchOnEnRouteCancel: boolean;
  requireHandoverChecklist: boolean;
  defaultPrepTimeMinutes: number;
  busyModeExtraMinutes: number;
  policyTitleMm: string;
  policyTitleEn: string;
  policyNotesMm: string;
  policyNotesEn: string;
  updatedAt?: string;
}

export type ShopPenaltyStatus = 'UNPAID' | 'PAID' | 'WAIVED';

export interface ShopDeliveryPenaltyDTO {
  id: number;
  shopId: number;
  shopName: string;
  orderId: number;
  orderRef: string;
  lalamoveOrderId: string | null;
  driverName: string | null;
  waitingMinutes: number;
  fineAmountThb: number;
  status: ShopPenaltyStatus;
  reason: string;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface DeliveryPolicyBundleDTO {
  policy: DeliveryPolicyConfigDTO;
  penalties: ShopDeliveryPenaltyDTO[];
}

class DeliveryRangeService {
  async get(): Promise<DeliveryRangeDTO> {
    return apiClient.get<DeliveryRangeDTO>(config.endpoints.admin.system.deliveryRange);
  }

  async update(payload: UpdateDeliveryRangePayload): Promise<DeliveryRangeDTO> {
    return apiClient.put<DeliveryRangeDTO>(config.endpoints.admin.system.deliveryRange, payload);
  }

  async getPolicy(): Promise<DeliveryPolicyBundleDTO> {
    return apiClient.get<DeliveryPolicyBundleDTO>(`${config.endpoints.admin.system.deliveryRange}/policy`);
  }

  async updatePolicy(payload: Partial<DeliveryPolicyConfigDTO>): Promise<DeliveryPolicyConfigDTO> {
    return apiClient.put<DeliveryPolicyConfigDTO>(`${config.endpoints.admin.system.deliveryRange}/policy`, payload);
  }

  async resolvePenalty(
    penaltyId: number,
    payload: { status: ShopPenaltyStatus; adminNote?: string },
  ): Promise<ShopDeliveryPenaltyDTO> {
    return apiClient.put<ShopDeliveryPenaltyDTO>(
      `${config.endpoints.admin.system.deliveryRange}/penalties/${penaltyId}/resolve`,
      payload,
    );
  }
}

export const deliveryRangeService = new DeliveryRangeService();
