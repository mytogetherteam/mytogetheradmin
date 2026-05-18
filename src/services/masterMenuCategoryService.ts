import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface MasterMenuCategoryDTO {
  id: number;
  nameMm?: string;
  nameEn?: string;
  nameTh?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive: boolean;
  cuisineTypeId?: number;
  cuisineTypeNameEn?: string;
}

export interface MasterMenuCategoryRequest {
  nameMm?: string;
  nameEn?: string;
  nameTh?: string;
  displayOrder?: number;
  isActive: boolean;
  cuisineTypeId?: number;
  id?: number;
}

export const MasterMenuCategoryService = {
  /**
   * Get all master menu categories
   */
  getMasterMenuCategories: async (params?: { page?: number; size?: number; search?: string }): Promise<{ content: MasterMenuCategoryDTO[]; totalElements: number; totalPages: number }> => {
    let url = config.endpoints.admin.menu.masterMenuCategories.base;
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
    const response = await apiClient.get<MasterMenuCategoryDTO[] | { content: MasterMenuCategoryDTO[]; totalElements: number; totalPages: number }>(url);

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
   * Get master menu category by ID
   */
  getMasterMenuCategoryById: async (id: number): Promise<MasterMenuCategoryDTO> => {
    return apiClient.get<MasterMenuCategoryDTO>(config.endpoints.admin.menu.masterMenuCategories.detail(id));
  },

  /**
   * Create a new master menu category
   */
  createMasterMenuCategory: async (data: FormData): Promise<MasterMenuCategoryDTO> => {
    return apiClient.post<MasterMenuCategoryDTO>(config.endpoints.admin.menu.masterMenuCategories.base, data);
  },

  /**
   * Update a master menu category
   */
  updateMasterMenuCategory: async (id: number, data: FormData): Promise<MasterMenuCategoryDTO> => {
    return apiClient.put<MasterMenuCategoryDTO>(config.endpoints.admin.menu.masterMenuCategories.detail(id), data);
  },

  /**
   * Delete a master menu category
   */
  deleteMasterMenuCategory: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.menu.masterMenuCategories.detail(id));
  },

  /**
   * Reorder master menu categories (full ordered id list).
   */
  reorderMasterMenuCategories: async (ids: number[]): Promise<void> => {
    await apiClient.post<void>(config.endpoints.admin.menu.masterMenuCategories.reorder, { ids });
  },
};
