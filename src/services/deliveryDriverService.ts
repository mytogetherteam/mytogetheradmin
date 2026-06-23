import { apiClient } from "./apiClient";
import { config } from "@/config/config";
import {
  deliveryDriverSchema,
  deliveryDriversPageSchema,
  type DeliveryDriver,
  type DeliveryDriverListParams,
  type DeliveryDriversPage,
} from "@/schemas/delivery-driver.schema";

export const deliveryDriverService = {
  getList: async (
    params: DeliveryDriverListParams = { page: 1, size: 20 },
  ): Promise<DeliveryDriversPage> => {
    const response = await apiClient.get<DeliveryDriversPage>(
      config.endpoints.admin.deliveryDrivers.list,
      {
        params: {
          page: params.page ?? 1,
          size: params.size ?? 20,
          search: params.search?.trim() || undefined,
          shopId: params.shopId,
          isActive: params.isActive,
          includeDeleted: params.includeDeleted,
        },
      },
    );
    return deliveryDriversPageSchema.parse(response);
  },

  getById: async (id: number): Promise<DeliveryDriver> => {
    const response = await apiClient.get<DeliveryDriver>(
      config.endpoints.admin.deliveryDrivers.detail(id),
    );
    return deliveryDriverSchema.parse(response);
  },

  hardDelete: async (id: number): Promise<void> => {
    await apiClient.delete(config.endpoints.admin.deliveryDrivers.detail(id));
  },
};

export type { DeliveryDriverListParams };
