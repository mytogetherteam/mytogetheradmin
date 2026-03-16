import { apiClient } from './apiClient';
import { config } from '@/config/config';
import { MasterMenuSubCategoryDTO, PageableResponse } from './shopService';

export const masterMenuSubCategoryService = {
  /**
   * Get all master menu sub categories with pagination and search
   */
  getMasterMenuSubCategories: async (page = 0, size = 20, search = ''): Promise<PageableResponse<MasterMenuSubCategoryDTO>> => {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    return apiClient.get<PageableResponse<MasterMenuSubCategoryDTO>>(`${config.endpoints.admin.masterMenuSubCategories.list}?${params.toString()}`);
  },

  /**
   * Get master menu sub category by ID
   */
  getMasterMenuSubCategoryById: async (id: number): Promise<MasterMenuSubCategoryDTO> => {
    return apiClient.get<MasterMenuSubCategoryDTO>(config.endpoints.admin.masterMenuSubCategories.detail(id));
  },

  /**
   * Create a new master menu sub category
   */
  createMasterMenuSubCategory: async (data: Partial<MasterMenuSubCategoryDTO>): Promise<MasterMenuSubCategoryDTO> => {
    return apiClient.post<MasterMenuSubCategoryDTO>(config.endpoints.admin.masterMenuSubCategories.list, data);
  },

  /**
   * Update an existing master menu sub category
   */
  updateMasterMenuSubCategory: async (id: number, data: Partial<MasterMenuSubCategoryDTO>): Promise<MasterMenuSubCategoryDTO> => {
    return apiClient.put<MasterMenuSubCategoryDTO>(config.endpoints.admin.masterMenuSubCategories.detail(id), data);
  },

  /**
   * Delete a master menu sub category (Soft delete)
   */
  deleteMasterMenuSubCategory: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.masterMenuSubCategories.detail(id));
  }
};
