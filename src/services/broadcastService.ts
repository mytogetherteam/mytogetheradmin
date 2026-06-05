import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export type BroadcastAudience =
  | "ALL"
  | "USERS"
  | "SHOP_ADMINS"
  | "OPERATION_ADMINS"
  | "SINGLE_USER";

export interface BroadcastHistoryItem {
  id: number;
  audience: BroadcastAudience;
  targetUserId: number | null;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  createdByAdminId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendBroadcastPayload {
  audience: BroadcastAudience;
  title: string;
  message: string;
  /** Required only when audience is SINGLE_USER. */
  targetUserId?: number;
  /** Optional structured payload (deep-link, image url, etc.). */
  data?: Record<string, unknown>;
}

export interface SendBroadcastResult {
  status: string;
  broadcastId: number;
}

export interface PaginatedBroadcasts {
  content: BroadcastHistoryItem[];
  totalElements: number;
  totalPages: number;
}

/** Raw `{ items, totalCount, totalPages }` shape returned by the list endpoint. */
interface BroadcastListResponse {
  items: BroadcastHistoryItem[];
  totalCount: number;
  totalPages: number;
}

export const BroadcastService = {
  /** Queue a broadcast for delivery. Returns immediately. */
  send: async (payload: SendBroadcastPayload): Promise<SendBroadcastResult> => {
    return handleApiCall(() =>
      api.post(config.endpoints.admin.broadcasts.base, payload),
    );
  },

  /** History of sent broadcasts (page is 0-based). */
  getHistory: async (
    page = 0,
    size = 10,
  ): Promise<PaginatedBroadcasts> => {
    const res = await handleApiCall<BroadcastListResponse>(() =>
      api.get(config.endpoints.admin.broadcasts.base, { params: { page, size } }),
    );
    return {
      content: res?.items ?? [],
      totalElements: res?.totalCount ?? 0,
      totalPages: res?.totalPages ?? 1,
    };
  },
};
