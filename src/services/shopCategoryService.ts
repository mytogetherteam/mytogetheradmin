import { config } from '@/config/config';
import { handleApiCall } from '@/lib/handleApiCall';
import { api } from '@/utils/axios';

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

export const ShopCategoryService = {
  /**
   * Get all shop categories (paginated)
   */
  getShopCategories: async (params?: { page?: number; size?: number; search?: string }): Promise<{ content: ShopCategoryDTO[]; totalElements: number; totalPages: number }> => {
    let url = config.endpoints.admin.shopCategories;
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.search !== undefined) queryParams.append('search', params.search);
    }
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const response = await handleApiCall<
      | ShopCategoryDTO[]
      | { content: ShopCategoryDTO[]; totalElements: number; totalPages: number }
      | {
        data: ShopCategoryDTO[];
        meta: {
          current_page: number;
          from: number | null;
          last_page: number;
          per_page: number;
          to: number | null;
          total: number;
        };
      }
      | {
        data: ShopCategoryDTO[];
        total: number;
        last_page: number;
        current_page: number;
        per_page: number;
        from: number | null;
        to: number | null;
      }
    >(() => api.get(url), { preservePaginatedMeta: true });

    if (
      response &&
      typeof response === 'object' &&
      'meta' in response &&
      'data' in response &&
      Array.isArray((response as { data: unknown }).data)
    ) {
      const r = response as {
        data: ShopCategoryDTO[];
        meta: { total: number; last_page: number };
      };
      return {
        content: r.data,
        totalElements: r.meta.total,
        totalPages: r.meta.last_page,
      };
    }
    if (Array.isArray(response)) {
      return { content: response, totalElements: response.length, totalPages: 1 };
    }
    if (
      response &&
      typeof response === 'object' &&
      'data' in response &&
      Array.isArray((response as { data?: unknown }).data) &&
      !('meta' in response)
    ) {
      const r = response as {
        data: ShopCategoryDTO[];
        total: number;
        last_page: number;
      };
      return {
        content: r.data,
        totalElements: r.total,
        totalPages: r.last_page,
      };
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
    return handleApiCall(() => api.get(config.endpoints.admin.shopCategory(id)));
  },

  /**
   * Create a new shop category
   */
  createShopCategory: async (data: FormData): Promise<ShopCategoryDTO> => {
    return handleApiCall(() => api.post(config.endpoints.admin.shopCategories, data));
  },

  /**
   * Update a shop category
   */
  updateShopCategory: async (id: number, data: FormData): Promise<ShopCategoryDTO> => {
    return handleApiCall(() => api.put(config.endpoints.admin.shopCategory(id), data));
  },

  /**
   * Delete a shop category
   */
  deleteShopCategory: async (id: number): Promise<void> => {
    return handleApiCall(() => api.delete(config.endpoints.admin.shopCategory(id)));
  },

  /**
   * Get all shop sub-categories (paginated)
   */
  getShopSubCategoriesPaginated: async (params?: { page?: number; size?: number; search?: string }): Promise<{ content: ShopSubCategoryDTO[]; totalElements: number; totalPages: number }> => {
    let url = config.endpoints.admin.shopSubCategories;
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.search !== undefined) queryParams.append('search', params.search);
    }
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const response = await handleApiCall<
      | ShopSubCategoryDTO[]
      | { content: ShopSubCategoryDTO[]; totalElements: number; totalPages: number }
      | {
          data: ShopSubCategoryDTO[];
          meta: {
            current_page: number;
            from: number | null;
            last_page: number;
            per_page: number;
            to: number | null;
            total: number;
          };
        }
    >(() => api.get(url), { preservePaginatedMeta: true });

    if (
      response &&
      typeof response === 'object' &&
      'meta' in response &&
      'data' in response &&
      Array.isArray((response as { data: unknown }).data)
    ) {
      const r = response as {
        data: ShopSubCategoryDTO[];
        meta: { total: number; last_page: number };
      };
      return {
        content: r.data,
        totalElements: r.meta.total,
        totalPages: r.meta.last_page,
      };
    }
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
      () => api.get(config.endpoints.admin.shopSubCategoriesByCategory(categoryId))
    );
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get shop sub-category by ID
   */
  getShopSubCategoryById: async (id: number): Promise<ShopSubCategoryDTO> => {
    return handleApiCall(() => api.get(config.endpoints.admin.shopSubCategory(id)));
  },

  /**
   * Create a new shop sub-category
   */
  createShopSubCategory: async (categoryId: number, data: FormData): Promise<ShopSubCategoryDTO> => {
    return handleApiCall(() =>
      api.post(config.endpoints.admin.shopSubCategoriesByCategory(categoryId), data)
    );
  },

  /**
   * Update a shop sub-category
   */
  updateShopSubCategory: async (id: number, data: FormData): Promise<ShopSubCategoryDTO> => {
    return handleApiCall(() => api.put(config.endpoints.admin.shopSubCategory(id), data));
  },

  /**
   * Delete a shop sub-category
   */
  deleteShopSubCategory: async (id: number): Promise<void> => {
    return handleApiCall(() => api.delete(config.endpoints.admin.shopSubCategory(id)));
  },
};
