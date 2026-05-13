import { config } from '@/config/config';
import { handleApiCall } from '@/lib/handleApiCall';
import { api } from '@/utils/axios';

export interface CuisineDTO {
  id: number;
  name?: string;
  nameEn: string;
  nameMm?: string;
  nameTh?: string;
  isActive?: boolean;
  imageUrl?: string;
  displayOrder?: number;
  regionId?: number;
  regionName?: string;
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
  getCuisines: async (params?: { page?: number; size?: number; search?: string }): Promise<CuisinePage> => {
    let url = config.endpoints.admin.payment.cuisines.list;
    const { page = 1, size = 100, search = '' } = params || {};
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    if (search) queryParams.append('search', search);

    url += `?${queryParams.toString()}`;

    const response = await handleApiCall<any>(
      () => api.get(url)
    );

    if (Array.isArray(response)) {
      return {
        content: response,
        totalElements: response.length,
        totalPages: 1,
        number: page
      };
    }

    if (response && typeof response === 'object' && 'content' in response) {
      return {
        content: response.content || [],
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        number: response.number || page
      };
    }

    return {
      content: (response as CuisineDTO[]) || [],
      totalElements: Array.isArray(response) ? response.length : 0,
      totalPages: 1,
      number: page
    };
  },

  /**
   * Get cuisine by ID
   */
  getCuisineById: async (id: number): Promise<CuisineDTO> => {
    return handleApiCall(() => api.get(config.endpoints.admin.payment.cuisines.detail(id)));
  },

  /**
   * Create a new cuisine
   */
  createCuisine: async (data: any): Promise<CuisineDTO> => {
    return handleApiCall(() => api.post(config.endpoints.admin.payment.cuisines.list, data));
  },

  /**
   * Update an existing cuisine
   */
  updateCuisine: async (id: number, data: any): Promise<CuisineDTO> => {
    return handleApiCall(() => api.put(config.endpoints.admin.payment.cuisines.detail(id), data));
  },

  /**
   * Delete a cuisine
   */
  deleteCuisine: async (id: number): Promise<void> => {
    return handleApiCall(() => api.delete(config.endpoints.admin.payment.cuisines.detail(id)));
  }
};
