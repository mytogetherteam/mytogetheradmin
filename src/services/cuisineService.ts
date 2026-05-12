import { config } from '@/config/config';
import { api } from '@/utils/axios';
import { ApiError } from '@/services/apiClient';
import { getHumanMessageFromNestHttpBody } from '@/lib/nestHttpBody';
import axios from 'axios';

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

/**
 * Shared error handling and response unwrap wrapper — same pattern as shopCategoryService.ts.
 */
async function handleApiCall<T>(requestFn: () => Promise<{ data: unknown }>): Promise<T> {
  let json: unknown;
  try {
    const { data } = await requestFn();
    json = data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const rawBody = error.response?.data;
      const httpStatus = error.response?.status;
      const nestedCode =
        rawBody &&
          typeof rawBody === 'object' &&
          'statusCode' in rawBody &&
          typeof (rawBody as { statusCode?: unknown }).statusCode === 'number'
          ? (rawBody as { statusCode: number }).statusCode
          : undefined;
      const status = httpStatus ?? nestedCode;

      const message =
        getHumanMessageFromNestHttpBody(rawBody) ||
        (error.response?.statusText
          ? `${error.response.status} ${error.response.statusText}`
          : '') ||
        error.message ||
        'Request failed';

      throw new ApiError(message.trim(), status, rawBody);
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Request failed',
    );
  }

  // Unwrap standard { success, data } backend wrapper
  if (json && typeof json === 'object') {
    const body = json as Record<string, unknown>;
    if ('success' in body && body.success === false) {
      throw new ApiError(
        (typeof body.message === 'string' ? body.message.trim() : '') || 'Request failed',
        undefined,
        json,
      );
    }
    if ('data' in body && 'success' in body) {
      return body.data as T;
    }
  }

  return json as T;
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
