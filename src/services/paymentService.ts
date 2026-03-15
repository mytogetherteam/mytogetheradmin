import { apiClient } from './apiClient';
import { config } from '@/config/config';
import { 
  CityDTO, 
  DistrictDTO, 
  CuisineTypeDTO, 
  PaymentMethodDTO, 
  ShopFormDataDTO 
} from './shopService';

export interface CreatePaymentMethodRequest {
  code: string;
  name: string;
  nameMm?: string;
  nameTh?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface UpdatePaymentMethodRequest {
  code?: string;
  name?: string;
  nameMm?: string;
  nameTh?: string;
  displayOrder?: number;
  active?: boolean;
}

export const PaymentService = {
  /**
   * Get all reference data for the shop form
   */
  getShopFormData: async (): Promise<ShopFormDataDTO> => {
    return apiClient.get<ShopFormDataDTO>(config.endpoints.admin.payment.shopFormData);
  },

  /**
   * Get all cities
   */
  getCities: async (): Promise<CityDTO[]> => {
    return apiClient.get<CityDTO[]>(config.endpoints.admin.cities.list);
  },

  /**
   * Get all districts
   */
  getDistricts: async (): Promise<DistrictDTO[]> => {
    return apiClient.get<DistrictDTO[]>(config.endpoints.admin.districts.list);
  },

  /**
   * Get all cuisine types
   */
  getCuisineTypes: async (): Promise<CuisineTypeDTO[]> => {
    return apiClient.get<CuisineTypeDTO[]>(config.endpoints.admin.payment.cuisineTypes);
  },

  /**
   * Get all payment methods
   */
  getPaymentMethods: async (params?: { page?: number; size?: number; search?: string }): Promise<{ content: PaymentMethodDTO[]; totalElements: number; totalPages: number }> => {
    let url = config.endpoints.admin.payment.paymentMethods;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.search !== undefined) queryParams.append('search', params.search);
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return apiClient.get(url);
  },

  /**
   * Get payment method by ID
   */
  getPaymentMethodById: async (id: number): Promise<PaymentMethodDTO> => {
    return apiClient.get<PaymentMethodDTO>(config.endpoints.admin.payment.paymentMethod(id));
  },

  /**
   * Create a new payment method
   * @param data FormData containing iconFile, qrFile and other fields
   */
  createPaymentMethod: async (data: FormData | CreatePaymentMethodRequest): Promise<PaymentMethodDTO> => {
    return apiClient.post<PaymentMethodDTO>(config.endpoints.admin.payment.paymentMethods, data);
  },

  /**
   * Update a payment method
   * @param id payment method ID
   * @param data FormData containing iconFile, qrFile and other fields
   */
  updatePaymentMethod: async (id: number, data: FormData | UpdatePaymentMethodRequest): Promise<PaymentMethodDTO> => {
    return apiClient.put<PaymentMethodDTO>(config.endpoints.admin.payment.paymentMethod(id), data);
  },

  /**
   * Delete a payment method
   */
  deletePaymentMethod: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.payment.paymentMethod(id));
  },
};
