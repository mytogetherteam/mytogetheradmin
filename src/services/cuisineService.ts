import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

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

const cuisineListUrl = () => config.endpoints.admin.cuisines.list;
const cuisineDetailUrl = (id: number) =>
  config.endpoints.admin.cuisines.detail(id);

export const cuisineService = {
  /**
   * Get all cuisines with pagination and search
   */
  getCuisines: async (params?: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<CuisinePage> => {
    let url = cuisineListUrl();
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined)
        queryParams.append("page", params.page.toString());
      if (params.size !== undefined)
        queryParams.append("size", params.size.toString());
      if (params.search !== undefined)
        queryParams.append("search", params.search);
    }
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const currentPage = params?.page ?? 1;

    const response = await handleApiCall<
      | CuisineDTO[]
      | {
          data: CuisineDTO[];
          meta: { total: number; last_page: number; current_page: number };
        }
      | {
          data: CuisineDTO[];
          total: number;
          last_page: number;
        }
      | {
          content: CuisineDTO[];
          totalElements: number;
          totalPages: number;
          number?: number;
        }
    >(() => api.get(url), { preservePaginatedMeta: true });

    if (
      response &&
      typeof response === "object" &&
      "meta" in response &&
      "data" in response &&
      Array.isArray((response as { data: unknown }).data)
    ) {
      const r = response as {
        data: CuisineDTO[];
        meta: { total: number; last_page: number; current_page: number };
      };
      return {
        content: r.data,
        totalElements: r.meta.total,
        totalPages: r.meta.last_page,
        number: r.meta.current_page,
      };
    }
    if (Array.isArray(response)) {
      return {
        content: response,
        totalElements: response.length,
        totalPages: 1,
        number: currentPage,
      };
    }
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray((response as { data?: unknown }).data) &&
      !("meta" in response)
    ) {
      const r = response as {
        data: CuisineDTO[];
        total: number;
        last_page: number;
      };
      return {
        content: r.data,
        totalElements: r.total,
        totalPages: r.last_page,
        number: currentPage,
      };
    }
    if (response && typeof response === "object" && "content" in response) {
      const r = response as {
        content: CuisineDTO[];
        totalElements?: number;
        totalPages?: number;
        number?: number;
      };
      return {
        content: r.content || [],
        totalElements: r.totalElements || 0,
        totalPages: r.totalPages || 0,
        number: r.number ?? currentPage,
      };
    }
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: currentPage,
    };
  },

  /**
   * Get cuisine by ID
   */
  getCuisineById: async (id: number): Promise<CuisineDTO> => {
    return handleApiCall<CuisineDTO>(() => api.get(cuisineDetailUrl(id)));
  },

  /**
   * Create a new cuisine
   */
  createCuisine: async (data: FormData): Promise<CuisineDTO> => {
    return handleApiCall<CuisineDTO>(() => api.post(cuisineListUrl(), data));
  },

  /**
   * Update an existing cuisine
   */
  updateCuisine: async (id: number, data: FormData): Promise<CuisineDTO> => {
    return handleApiCall<CuisineDTO>(() => api.put(cuisineDetailUrl(id), data));
  },

  /**
   * Delete a cuisine
   */
  deleteCuisine: async (id: number): Promise<void> => {
    await handleApiCall(() => api.delete(cuisineDetailUrl(id)));
  },
};
