import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface MasterItemDTO {
  id: number;
  nameMm?: string;
  nameEn?: string;
  nameTh?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive: boolean;
  masterCategoryId?: number;
  masterCategoryNameEn?: string;
}

export interface MasterItemRequest {
  nameMm?: string;
  nameEn?: string;
  nameTh?: string;
  displayOrder?: number;
  isActive: boolean;
  masterCategoryId?: number;
}

export const MasterItemService = {
  /**
   * Get all master items
   */
  getMasterItems: async (params?: { page?: number; size?: number; search?: string }): Promise<{ content: MasterItemDTO[]; totalElements: number; totalPages: number }> => {
    let url = config.endpoints.admin.menu.masterItems.base;
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
    const response = await apiClient.get<MasterItemDTO[] | { content: MasterItemDTO[]; totalElements: number; totalPages: number }>(url);
    
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
   * Search master items (autocomplete)
   */
  searchMasterItems: async (search: string): Promise<MasterItemDTO[]> => {
    let url = config.endpoints.admin.menu.masterItems.search;
    const queryParams = new URLSearchParams();
    if (search) {
      queryParams.append('q', search);
      queryParams.append('query', search); // Safe fallback
    } else {
      // The swagger says 'q' is required, so we might need to send at least empty string
      queryParams.append('q', '');
      queryParams.append('query', '');
    }
    url += `?${queryParams.toString()}`;
    
    const response = await apiClient.get<MasterItemDTO[] | { content: MasterItemDTO[] }>(url);
    if (Array.isArray(response)) return response;
    if (response && response.content) return response.content;
    return [];
  },

  /**
   * Get master item by ID
   */
  getMasterItemById: async (id: number): Promise<MasterItemDTO> => {
    return apiClient.get<MasterItemDTO>(config.endpoints.admin.menu.masterItems.detail(id));
  },

  /**
   * Create a new master item
   */
  createMasterItem: async (data: FormData): Promise<MasterItemDTO> => {
    return apiClient.post<MasterItemDTO>(config.endpoints.admin.menu.masterItems.base, data);
  },

  /**
   * Update a master item
   */
  updateMasterItem: async (id: number, data: FormData): Promise<MasterItemDTO> => {
    return apiClient.put<MasterItemDTO>(config.endpoints.admin.menu.masterItems.detail(id), data);
  },

  /**
   * Delete a master item
   */
  deleteMasterItem: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.menu.masterItems.detail(id));
  },
};
