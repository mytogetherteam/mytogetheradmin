import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export type BroadcastAudience =
  | "ALL"
  | "USERS"
  | "SHOP_ADMINS"
  | "OPERATION_ADMINS"
  | "SINGLE_USER"
  | "SINGLE_SHOP"
  | "USER_GROUP"
  | "SHOP_GROUP";

export interface BroadcastHistoryItem {
  id: number;
  audience: BroadcastAudience;
  targetUserId: number | null;
  targetShopId: number | null;
  targetUserGroupId: number | null;
  targetShopGroupId: number | null;
  title: string;
  message: string;
  /** Optional image shown with the announcement. */
  imageUrl?: string | null;
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
  /** Required only when audience is SINGLE_SHOP. */
  targetShopId?: number;
  /** Required only when audience is USER_GROUP. */
  targetUserGroupId?: number;
  /** Required only when audience is SHOP_GROUP. */
  targetShopGroupId?: number;
  /** Optional image file to attach to the announcement. */
  image?: File | null;
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
    const { image, targetUserId, targetShopId, targetUserGroupId, targetShopGroupId, data, ...rest } = payload;

    // Sent as multipart/form-data so an optional image can be attached; the
    // axios interceptor strips the JSON Content-Type when it sees a FormData body.
    const form = new FormData();
    form.append("audience", rest.audience);
    form.append("title", rest.title);
    form.append("message", rest.message);
    
    if (targetUserId != null) form.append("targetUserId", String(targetUserId));
    if (targetShopId != null) form.append("targetShopId", String(targetShopId));
    if (targetUserGroupId != null) form.append("targetUserGroupId", String(targetUserGroupId));
    if (targetShopGroupId != null) form.append("targetShopGroupId", String(targetShopGroupId));
    if (data != null) form.append("data", JSON.stringify(data));
    if (image) form.append("image", image);

    return handleApiCall(() =>
      api.post(config.endpoints.admin.broadcasts.base, form),
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

  /** Delete a sent broadcast from the history. */
  remove: async (id: number): Promise<void> => {
    await handleApiCall(() =>
      api.delete(config.endpoints.admin.broadcasts.detail(id)),
    );
  },
};
