import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ShopCategoryDTO {
  id: number;
  name: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  subCategories?: ShopSubCategoryDTO[];
}

export interface ShopSubCategoryDTO {
  id: number;
  name: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  categoryId?: number;
}

export interface CreateShopCategoryRequest {
  name: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateShopSubCategoryRequest {
  name: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  displayOrder: number;
  isActive: boolean;
}

export const ShopCategoryService = {
  /**
   * Get all shop categories
   */
  getShopCategories: async (params?: { page?: number; size?: number; search?: string }): Promise<{ content: ShopCategoryDTO[]; totalElements: number; totalPages: number }> => {
    let url = config.endpoints.admin.payment.shopCategories;
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.search !== undefined) queryParams.append('search', params.search);
    }
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return apiClient.get(url);
  },

  /**
   * Get shop category by ID
   */
  getShopCategoryById: async (id: number): Promise<ShopCategoryDTO> => {
    return apiClient.get<ShopCategoryDTO>(config.endpoints.admin.payment.shopCategory(id));
  },

  /**
   * Create a new shop category
   */
  createShopCategory: async (data: FormData): Promise<ShopCategoryDTO> => {
    return apiClient.post<ShopCategoryDTO>(config.endpoints.admin.payment.shopCategories, data);
  },

  /**
   * Update a shop category
   */
  updateShopCategory: async (id: number, data: FormData): Promise<ShopCategoryDTO> => {
    return apiClient.put<ShopCategoryDTO>(config.endpoints.admin.payment.shopCategory(id), data);
  },

  /**
   * Delete a shop category
   */
  deleteShopCategory: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.payment.shopCategory(id));
  },

  /**
   * Get sub-categories by category ID
   */
  getShopSubCategories: async (categoryId: number): Promise<ShopSubCategoryDTO[]> => {
    return apiClient.get<ShopSubCategoryDTO[]>(config.endpoints.admin.payment.shopSubCategories(categoryId));
  },

  /**
   * Create a new shop sub-category
   */
  createShopSubCategory: async (categoryId: number, data: FormData): Promise<ShopSubCategoryDTO> => {
    return apiClient.post<ShopSubCategoryDTO>(config.endpoints.admin.payment.shopSubCategories(categoryId), data);
  },

  /**
   * Update a shop sub-category
   */
  updateShopSubCategory: async (id: number, data: FormData): Promise<ShopSubCategoryDTO> => {
    return apiClient.put<ShopSubCategoryDTO>(config.endpoints.admin.payment.shopSubCategory(id), data);
  },

  /**
   * Get shop sub-category by ID
   */
  getShopSubCategoryById: async (id: number): Promise<ShopSubCategoryDTO> => {
    return apiClient.get<ShopSubCategoryDTO>(config.endpoints.admin.payment.shopSubCategory(id));
  },

  /**
   * Delete a shop sub-category
   */
  deleteShopSubCategory: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.payment.shopSubCategory(id));
  },
};
