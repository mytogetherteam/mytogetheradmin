import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface CuisineDTO {
  id: number;
  nameEn: string;
  nameMm: string;
  nameTh: string;
  isActive: boolean;
  imageUrl?: string;
  displayOrder?: number;
}

export interface CuisinePage {
  content: CuisineDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export const cuisineService = {
  /**
   * Get all cuisines with pagination and search
   */
  getCuisines: async (page = 0, size = 20, search = ''): Promise<CuisinePage> => {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    return apiClient.get<CuisinePage>(`${config.endpoints.admin.payment.cuisines.list}?${params.toString()}`);
  },

  /**
   * Get cuisine by ID
   */
  getCuisineById: async (id: number): Promise<CuisineDTO> => {
    return apiClient.get<CuisineDTO>(config.endpoints.admin.payment.cuisines.detail(id));
  },

  /**
   * Create a new cuisine
   */
  createCuisine: async (data: FormData): Promise<CuisineDTO> => {
    return apiClient.post<CuisineDTO>(config.endpoints.admin.payment.cuisines.list, data);
  },

  /**
   * Update an existing cuisine
   */
  updateCuisine: async (id: number, data: FormData): Promise<CuisineDTO> => {
    return apiClient.put<CuisineDTO>(config.endpoints.admin.payment.cuisines.detail(id), data);
  },

  /**
   * Delete a cuisine
   */
  deleteCuisine: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.payment.cuisines.detail(id));
  }
};
