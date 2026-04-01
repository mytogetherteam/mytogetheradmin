import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ItemTagDTO {
  id: number;
  nameMm?: string;
  nameEn?: string;
  nameTh?: string;
  iconUrl?: string;
  tagType?: string;
  colorCode?: string;
  displayOrder?: number;
  isActive: boolean;
}

export interface ItemTagRequest {
  nameMm?: string;
  nameEn?: string;
  nameTh?: string;
  tagType?: string;
  colorCode?: string;
  displayOrder?: number;
  isActive: boolean;
  id?: number;
}

export const ItemTagService = {
  /**
   * Get all item tags
   */
  getItemTags: async (params?: { page?: number; size?: number; search?: string }): Promise<{ content: ItemTagDTO[]; totalElements: number; totalPages: number }> => {
    let url = config.endpoints.admin.menu.itemTags.base;
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
    const response = await apiClient.get<ItemTagDTO[] | { content: ItemTagDTO[]; totalElements: number; totalPages: number }>(url);
    
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
   * Get item tag by ID
   */
  getItemTagById: async (id: number): Promise<ItemTagDTO> => {
    return apiClient.get<ItemTagDTO>(config.endpoints.admin.menu.itemTags.detail(id));
  },

  /**
   * Create a new item tag
   */
  createItemTag: async (data: FormData): Promise<ItemTagDTO> => {
    return apiClient.post<ItemTagDTO>(config.endpoints.admin.menu.itemTags.base, data);
  },

  /**
   * Update an item tag
   */
  updateItemTag: async (id: number, data: FormData): Promise<ItemTagDTO> => {
    return apiClient.put<ItemTagDTO>(config.endpoints.admin.menu.itemTags.detail(id), data);
  },

  /**
   * Delete an item tag
   */
  deleteItemTag: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.menu.itemTags.detail(id));
  },
};
