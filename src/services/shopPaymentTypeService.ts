import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ShopPaymentTypeDTO {
  id: number;
  shopId: number;
  paymentMethodId: number;
  paymentMethodCode: string;
  paymentMethodName: string;
  qrImageUrl?: string;
  accountNumber?: string;
  accountName?: string;
  isActive: boolean;
  displayOrder: number;
}

export const ShopPaymentTypeService = {
  /**
   * Get all payment types for a specific shop
   */
  getShopPaymentTypes: async (shopId: number): Promise<ShopPaymentTypeDTO[]> => {
    const endpoint = config.endpoints.admin.payment.shopPaymentTypes(shopId);
    return apiClient.get<ShopPaymentTypeDTO[]>(endpoint);
  },

  /**
   * Get a specific shop payment type by ID
   */
  getShopPaymentTypeById: async (shopId: number, id: number): Promise<ShopPaymentTypeDTO> => {
    const endpoint = config.endpoints.admin.payment.shopPaymentType(shopId, id);
    return apiClient.get<ShopPaymentTypeDTO>(endpoint);
  },

  /**
   * Create a new payment type for a shop
   * Uses multipart/form-data with a 'request' JSON blob
   */
  createShopPaymentType: async (shopId: number, formData: FormData): Promise<ShopPaymentTypeDTO> => {
    const endpoint = config.endpoints.admin.payment.shopPaymentTypes(shopId);
    return apiClient.post<ShopPaymentTypeDTO>(endpoint, formData);
  },

  /**
   * Update an existing shop payment type
   * Uses multipart/form-data with a 'request' JSON blob
   */
  updateShopPaymentType: async (shopId: number, id: number, formData: FormData): Promise<ShopPaymentTypeDTO> => {
    const endpoint = config.endpoints.admin.payment.shopPaymentType(shopId, id);
    return apiClient.put<ShopPaymentTypeDTO>(endpoint, formData);
  },

  /**
   * Delete a shop payment type
   */
  deleteShopPaymentType: async (shopId: number, id: number): Promise<void> => {
    const endpoint = config.endpoints.admin.payment.shopPaymentType(shopId, id);
    await apiClient.delete(endpoint);
  },
};
