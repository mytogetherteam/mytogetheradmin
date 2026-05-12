import { config } from '@/config/config';
import { ApiError } from '@/services/apiClient';
import { api } from '@/utils/axios';
import { getHumanMessageFromNestHttpBody } from '@/lib/nestHttpBody';
import axios from 'axios';

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
  displayOrder?: number;
  imageUrl?: string;
}

/**
 * Shared error handling and response unwrap wrapper — same pattern as authService.ts.
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

export const ShopCategoryService = {
  /**
   * Get all shop categories (paginated)
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
    if (queryString) url += `?${queryString}`;

    const response = await handleApiCall<ShopCategoryDTO[] | { content: ShopCategoryDTO[]; totalElements: number; totalPages: number }>(
      () => api.get(url)
    );

    if (Array.isArray(response)) {
      return { content: response, totalElements: response.length, totalPages: 1 };
    }
    if (response && (response as { content?: unknown }).content) {
      return response as { content: ShopCategoryDTO[]; totalElements: number; totalPages: number };
    }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  /**
   * Get shop category by ID
   */
  getShopCategoryById: async (id: number): Promise<ShopCategoryDTO> => {
    return handleApiCall(() => api.get(config.endpoints.admin.payment.shopCategory(id)));
  },

  /**
   * Create a new shop category
   */
  createShopCategory: async (data: FormData): Promise<ShopCategoryDTO> => {
    return handleApiCall(() =>
      api.post(config.endpoints.admin.payment.shopCategories, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  /**
   * Update a shop category
   */
  updateShopCategory: async (id: number, data: FormData): Promise<ShopCategoryDTO> => {
    return handleApiCall(() =>
      api.put(config.endpoints.admin.payment.shopCategory(id), data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  /**
   * Delete a shop category
   */
  deleteShopCategory: async (id: number): Promise<void> => {
    return handleApiCall(() => api.delete(config.endpoints.admin.payment.shopCategory(id)));
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
    if (queryString) url += `?${queryString}`;

    const response = await handleApiCall<ShopSubCategoryDTO[] | { content: ShopSubCategoryDTO[]; totalElements: number; totalPages: number }>(
      () => api.get(url)
    );

    if (Array.isArray(response)) {
      return { content: response, totalElements: response.length, totalPages: 1 };
    }
    if (response && (response as { content?: unknown }).content) {
      return response as { content: ShopSubCategoryDTO[]; totalElements: number; totalPages: number };
    }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  /**
   * Get shop sub-categories by category ID
   */
  getShopSubCategoriesByCategory: async (categoryId: number): Promise<ShopSubCategoryDTO[]> => {
    const response = await handleApiCall<ShopSubCategoryDTO[]>(
      () => api.get(config.endpoints.admin.payment.shopSubCategoriesByCategory(categoryId))
    );
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get shop sub-category by ID
   */
  getShopSubCategoryById: async (id: number): Promise<ShopSubCategoryDTO> => {
    return handleApiCall(() => api.get(config.endpoints.admin.payment.shopSubCategory(id)));
  },

  /**
   * Create a new shop sub-category
   */
  createShopSubCategory: async (categoryId: number, data: FormData): Promise<ShopSubCategoryDTO> => {
    return handleApiCall(() =>
      api.post(config.endpoints.admin.payment.shopSubCategoriesByCategory(categoryId), data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  /**
   * Update a shop sub-category
   */
  updateShopSubCategory: async (id: number, data: FormData): Promise<ShopSubCategoryDTO> => {
    return handleApiCall(() =>
      api.put(config.endpoints.admin.payment.shopSubCategory(id), data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  /**
   * Delete a shop sub-category
   */
  deleteShopSubCategory: async (id: number): Promise<void> => {
    return handleApiCall(() => api.delete(config.endpoints.admin.payment.shopSubCategory(id)));
  },
};
