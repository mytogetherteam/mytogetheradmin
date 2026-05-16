
import { config } from '@/config/config';
import { handleApiCall } from '@/lib/handleApiCall';
import { api } from '@/utils/axios';

export interface CityDTO {
  id: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  isActive: boolean;
}

export interface CityPage {
  content: CityDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  page?: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

export interface CreateCityRequest {
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  isActive?: boolean;
}

class CityService {
  async getCities(params?: { page?: number; size?: number; search?: string }): Promise<CityPage> {
    let url = config.endpoints.admin.cities.list;
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.search !== undefined) queryParams.append('search', params.search);
    }
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const currentPage = params?.page ?? 1;

    const response = await handleApiCall<
      | CityDTO[]
      | {
          data: CityDTO[];
          meta: { total: number; last_page: number; current_page: number; per_page?: number };
        }
      | {
          data: CityDTO[];
          total: number;
          last_page: number;
        }
      | {
          content: CityDTO[];
          totalElements: number;
          totalPages: number;
          number?: number;
          size?: number;
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
        data: CityDTO[];
        meta: { total: number; last_page: number; current_page: number; per_page?: number };
      };
      return {
        content: r.data,
        totalElements: r.meta.total,
        totalPages: r.meta.last_page,
        number: r.meta.current_page,
        size: r.meta.per_page ?? 20,
      };
    }
    if (Array.isArray(response)) {
      return {
        content: response,
        totalElements: response.length,
        totalPages: 1,
        number: currentPage,
        size: response.length || 20,
      };
    }
    if (
      response &&
      typeof response === 'object' &&
      'data' in response &&
      Array.isArray((response as { data?: unknown }).data) &&
      !('meta' in response)
    ) {
      const r = response as {
        data: CityDTO[];
        total: number;
        last_page: number;
      };
      return {
        content: r.data,
        totalElements: r.total,
        totalPages: r.last_page,
        number: currentPage,
        size: 20,
      };
    }
    if (response && typeof response === 'object' && 'content' in response) {
      const r = response as {
        content: CityDTO[];
        totalElements?: number;
        totalPages?: number;
        number?: number;
        size?: number;
      };
      return {
        content: r.content || [],
        totalElements: r.totalElements || 0,
        totalPages: r.totalPages || 0,
        number: r.number ?? currentPage,
        size: r.size ?? 20,
      };
    }
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: currentPage,
      size: 20,
    };
  }

  async getCityById(id: number): Promise<CityDTO> {
    return handleApiCall<CityDTO>(() => api.get(config.endpoints.admin.cities.detail(id)));
  }

  async createCity(data: Partial<CityDTO>): Promise<CityDTO> {
    return handleApiCall<CityDTO>(() => api.post(config.endpoints.admin.cities.list, data));
  }

  async updateCity(id: number, data: Partial<CityDTO>): Promise<CityDTO> {
    return handleApiCall<CityDTO>(() => api.put(config.endpoints.admin.cities.detail(id), data));
  }

  async deleteCity(id: number): Promise<void> {
    return handleApiCall<void>(() => api.delete(config.endpoints.admin.cities.detail(id)));
  }
}

export const cityService = new CityService();
