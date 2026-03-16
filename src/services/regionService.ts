import { apiClient } from './apiClient';
import { config } from '@/config/config';
import { RegionDTO, PageableResponse } from './shopService';

export const regionService = {
  /**
   * Get all regions with pagination and search
   */
  getRegions: async (page = 0, size = 20, search = ''): Promise<PageableResponse<RegionDTO>> => {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    return apiClient.get<PageableResponse<RegionDTO>>(`${config.endpoints.admin.regions.list}?${params.toString()}`);
  },

  /**
   * Get region by ID
   */
  getRegionById: async (id: number): Promise<RegionDTO> => {
    return apiClient.get<RegionDTO>(config.endpoints.admin.regions.detail(id));
  },

  /**
   * Create a new region
   */
  createRegion: async (data: FormData): Promise<RegionDTO> => {
    return apiClient.post<RegionDTO>(config.endpoints.admin.regions.list, data);
  },

  /**
   * Update an existing region
   */
  updateRegion: async (id: number, data: FormData): Promise<RegionDTO> => {
    return apiClient.put<RegionDTO>(config.endpoints.admin.regions.detail(id), data);
  },

  /**
   * Delete a region (Soft delete)
   */
  deleteRegion: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.regions.detail(id));
  }
};
