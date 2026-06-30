import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export type FlashType = "DROP" | "DEAL";
export type FlashStatus = "ACTIVE" | "INACTIVE";

/** Row shape returned by the paginated admin list endpoint. */
export interface FlashEventListItem {
  id: number;
  name: string;
  description: string | null;
  type: FlashType;
  startTime: string;
  endTime: string;
  status: FlashStatus;
  shopId: number | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A menu item as it appears inside a flash event detail response. */
export interface FlashEventMenuItem {
  flashEventItemId: number;
  displayOrder: number | null;
  id: number;
  nameEn?: string;
  nameMm?: string;
  nameTh?: string;
  imageUrl?: string | null;
  price?: number;
  shopName?: string;
  isAvailable?: boolean;
  publishStatus?: string;
  /** The menu item's own discount (editable from the flash screen). */
  originalPrice?: number | null;
  discountAmount?: number | null;
  discountPercentage?: number | null;
}

/** One menu item in a flash-event write payload; discount edits the menu item. */
export interface FlashEventItemInput {
  menuItemId: number;
  discountAmount?: number;
  discountPercentage?: number;
}

export interface FlashEventDetail {
  id: number;
  name: string;
  description: string | null;
  type: FlashType;
  startTime: string;
  endTime: string;
  status: FlashStatus;
  shopId: number | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: FlashEventMenuItem[];
}

export interface FlashEventPayload {
  name: string;
  description?: string;
  type: FlashType;
  /** ISO 8601 strings. */
  startTime: string;
  endTime: string;
  status?: FlashStatus;
  shopId?: number;
  /** Full desired set of menu items, in display order; discount edits the item. */
  items?: FlashEventItemInput[];
}

export interface PaginatedFlashEvents {
  content: FlashEventListItem[];
  totalElements: number;
  totalPages: number;
}

interface NestPaginatedEnvelope<T> {
  data: T[];
  meta: { total: number; last_page: number };
}

function isPaginatedEnvelope<T>(
  value: unknown,
): value is NestPaginatedEnvelope<T> {
  return (
    !!value &&
    typeof value === "object" &&
    "meta" in value &&
    "data" in value &&
    Array.isArray((value as { data: unknown }).data)
  );
}

export const FlashEventService = {
  getFlashEvents: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    type?: FlashType;
    status?: FlashStatus;
  }): Promise<PaginatedFlashEvents> => {
    const response = await handleApiCall<
      | FlashEventListItem[]
      | PaginatedFlashEvents
      | NestPaginatedEnvelope<FlashEventListItem>
    >(() => api.get(config.endpoints.admin.flashEvents.base, { params }), {
      preservePaginatedMeta: true,
    });

    if (isPaginatedEnvelope<FlashEventListItem>(response)) {
      return {
        content: response.data,
        totalElements: response.meta.total,
        totalPages: response.meta.last_page,
      };
    }
    if (Array.isArray(response)) {
      return {
        content: response,
        totalElements: response.length,
        totalPages: 1,
      };
    }
    return response as PaginatedFlashEvents;
  },

  getFlashEventById: async (id: number): Promise<FlashEventDetail> => {
    return handleApiCall(() =>
      api.get(config.endpoints.admin.flashEvents.detail(id)),
    );
  },

  createFlashEvent: async (
    payload: FlashEventPayload,
  ): Promise<FlashEventDetail> => {
    return handleApiCall(() =>
      api.post(config.endpoints.admin.flashEvents.base, payload),
    );
  },

  updateFlashEvent: async (
    id: number,
    payload: FlashEventPayload,
  ): Promise<FlashEventDetail> => {
    return handleApiCall(() =>
      api.put(config.endpoints.admin.flashEvents.detail(id), payload),
    );
  },

  deleteFlashEvent: async (id: number): Promise<void> => {
    return handleApiCall(() =>
      api.delete(config.endpoints.admin.flashEvents.detail(id)),
    );
  },
};
