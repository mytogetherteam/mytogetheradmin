import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ShopCategoryDTO {
  id: number;
  name?: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  imageUrl?: string;
  active: boolean;
  displayOrder?: number;
}

export interface ShopSubCategoryDTO {
  id: number;
  name?: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  imageUrl?: string;
  active: boolean;
  categoryId: number;
  displayOrder?: number;
}

export interface ShopSubCategoryRequest {
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  active: boolean;
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
    const response = await apiClient.get<ShopCategoryDTO[] | { content: ShopCategoryDTO[]; totalElements: number; totalPages: number }>(url);
    
    // Handle both paginated and flat array responses
    if (Array.isArray(response)) {
      return {
        content: response,
        totalElements: response.length,
        totalPages: 1
      };
    }
    
    if (response && response.content) {
      return response;
    }
    
    return {
      content: [],
      totalElements: 0,
      totalPages: 0
    };
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
   * Get all shop sub-categories (paginated)
   */
  getShopSubCategoriesPaginated: async (params?: { page?: number; size?: number; search?: string }): Promise<{ content: ShopSubCategoryDTO[]; totalElements: number; totalPages: number }> => {
    let url = config.endpoints.admin.payment.shopSubCategories;
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
    const response = await apiClient.get<ShopSubCategoryDTO[] | { content: ShopSubCategoryDTO[]; totalElements: number; totalPages: number }>(url);
    
    if (Array.isArray(response)) {
      return {
        content: response,
        totalElements: response.length,
        totalPages: 1
      };
    }
    
    if (response && response.content) {
      return response;
    }
    
    return {
      content: [],
      totalElements: 0,
      totalPages: 0
    };
  },

  /**
   * Get shop sub-categories by category ID
   */
  getShopSubCategoriesByCategory: async (categoryId: number): Promise<ShopSubCategoryDTO[]> => {
    const url = config.endpoints.admin.payment.shopSubCategoriesByCategory(categoryId);
    const response = await apiClient.get<ShopSubCategoryDTO[]>(url);
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get shop sub-category by ID
   */
  getShopSubCategoryById: async (id: number): Promise<ShopSubCategoryDTO> => {
    return apiClient.get<ShopSubCategoryDTO>(config.endpoints.admin.payment.shopSubCategory(id));
  },

  /**
   * Create a new shop sub-category
   */
  createShopSubCategory: async (categoryId: number, data: ShopSubCategoryRequest): Promise<ShopSubCategoryDTO> => {
    const url = config.endpoints.admin.payment.shopSubCategoriesByCategory(categoryId);
    return apiClient.post<ShopSubCategoryDTO>(url, data);
  },

  /**
   * Update a shop sub-category
   */
  updateShopSubCategory: async (id: number, data: ShopSubCategoryRequest): Promise<ShopSubCategoryDTO> => {
    return apiClient.put<ShopSubCategoryDTO>(config.endpoints.admin.payment.shopSubCategory(id), data);
  },

  /**
   * Delete a shop sub-category
   */
  deleteShopSubCategory: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.payment.shopSubCategory(id));
  },

};
