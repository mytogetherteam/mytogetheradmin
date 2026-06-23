import { apiClient } from "./apiClient";
import { config } from "@/config/config";
import {
  shopFeedbackPageSchema,
  shopFeedbackSchema,
  type ShopFeedback,
  type ShopFeedbackListParams,
  type ShopFeedbackPage,
} from "@/schemas/shop-feedback.schema";

function parseListResponse(raw: unknown): ShopFeedbackPage {
  if (
    raw &&
    typeof raw === "object" &&
    "content" in raw &&
    Array.isArray((raw as { content: unknown[] }).content)
  ) {
    return shopFeedbackPageSchema.parse(raw);
  }

  if (Array.isArray(raw)) {
    const content = raw.map((item) => shopFeedbackSchema.parse(item));
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      page: 1,
      size: content.length,
    };
  }

  return shopFeedbackPageSchema.parse(raw);
}

export const shopFeedbackService = {
  getList: async (
    params: ShopFeedbackListParams = { page: 1, size: 20 },
  ): Promise<ShopFeedbackPage> => {
    const response = await apiClient.get<unknown>(
      config.endpoints.admin.shopFeedback.list,
      {
        params: {
          page: params.page ?? 1,
          size: params.size ?? 20,
          search: params.search?.trim() || undefined,
          shopId: params.shopId,
          isRead: params.isRead,
        },
      },
    );
    return parseListResponse(response);
  },

  updateReadStatus: async (id: number, isRead: boolean): Promise<ShopFeedback> => {
    const response = await apiClient.patch<unknown>(
      config.endpoints.admin.shopFeedback.read(id),
      { isRead },
    );
    return shopFeedbackSchema.parse(response);
  },

  markManyAsRead: async (ids: number[]): Promise<void> => {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return;
    await Promise.all(
      uniqueIds.map((id) =>
        apiClient.patch(config.endpoints.admin.shopFeedback.read(id), {
          isRead: true,
        }),
      ),
    );
  },

  getById: async (id: number): Promise<ShopFeedback> => {
    const response = await apiClient.get<unknown>(
      config.endpoints.admin.shopFeedback.detail(id),
    );
    return shopFeedbackSchema.parse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(config.endpoints.admin.shopFeedback.detail(id));
  },
};
export { ShopFeedbackListParams };

