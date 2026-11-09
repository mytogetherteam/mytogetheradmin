import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export type CollectionStatus = "ACTIVE" | "INACTIVE";

/** Row shape returned by the paginated admin list endpoint. */
export interface CollectionListItem {
  id: number;
  name: string;
  description: string | null;
  status: CollectionStatus;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A menu item as it appears inside a collection detail response. */
export interface CollectionMenuItem {
  collectionItemId: number;
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
}

export interface CollectionDetail {
  id: number;
  name: string;
  description: string | null;
  status: CollectionStatus;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: CollectionMenuItem[];
}

export interface AiGenerateCollectionPayload {
  mode: string;
  customTopic?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  limit?: number;
}

export interface AiGeneratedCollectionItem {
  id: number;
  nameEn: string;
  nameMm: string | null;
  nameTh?: string | null;
  price: number | null;
  imageUrl: string | null;
  shopName: string;
  distanceKm?: number;
}

export interface AiGeneratedCollectionResponse {
  title: string;
  titleMm?: string;
  titleEn?: string;
  titleTh?: string;
  description: string;
  descriptionMm?: string;
  descriptionEn?: string;
  descriptionTh?: string;
  mode: string;
  items: AiGeneratedCollectionItem[];
}

export interface CollectionPayload {
  name: string;
  nameEn?: string;
  nameMm?: string;
  nameTh?: string;
  description?: string;
  descriptionEn?: string;
  descriptionMm?: string;
  descriptionTh?: string;
  status?: CollectionStatus;
  /** Full desired set of menu items, in display order. */
  menuItemIds?: number[];
}

export interface PaginatedCollections {
  content: CollectionListItem[];
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

export const CollectionService = {
  getCollections: async (params?: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<PaginatedCollections> => {
    const response = await handleApiCall<
      | CollectionListItem[]
      | PaginatedCollections
      | NestPaginatedEnvelope<CollectionListItem>
    >(() => api.get(config.endpoints.admin.collections.base, { params }), {
      preservePaginatedMeta: true,
    });

    if (isPaginatedEnvelope<CollectionListItem>(response)) {
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
    return response as PaginatedCollections;
  },

  getCollectionById: async (id: number): Promise<CollectionDetail> => {
    return handleApiCall(() =>
      api.get(config.endpoints.admin.collections.detail(id)),
    );
  },

  createCollection: async (
    payload: CollectionPayload,
  ): Promise<CollectionDetail> => {
    return handleApiCall(() =>
      api.post(config.endpoints.admin.collections.base, payload),
    );
  },

  updateCollection: async (
    id: number,
    payload: CollectionPayload,
  ): Promise<CollectionDetail> => {
    return handleApiCall(() =>
      api.put(config.endpoints.admin.collections.detail(id), payload),
    );
  },

  deleteCollection: async (id: number): Promise<void> => {
    return handleApiCall(() =>
      api.delete(config.endpoints.admin.collections.detail(id)),
    );
  },

  aiGenerate: async (
    payload: AiGenerateCollectionPayload,
  ): Promise<AiGeneratedCollectionResponse> => {
    return handleApiCall(() =>
      api.post(`${config.endpoints.admin.collections.base}/ai-generate`, payload),
    );
  },
};
