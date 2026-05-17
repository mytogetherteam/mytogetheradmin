
import { config } from '@/config/config';
import { handleApiCall } from '@/lib/handleApiCall';
import { api } from '@/utils/axios';

export interface DistrictDTO {
  id: number;
  cityId: number;
  cityNameEn?: string;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface DistrictPage {
  content: DistrictDTO[];
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

export interface CreateDistrictRequest {
  cityId: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

class DistrictService {
  async getDistricts(params?: { page?: number; size?: number; search?: string; cityId?: number }): Promise<DistrictPage> {
    let url = config.endpoints.admin.districts.list;
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.search !== undefined) queryParams.append('search', params.search);
      if (params.cityId !== undefined) queryParams.append('cityId', params.cityId.toString());
    }
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const currentPage = params?.page ?? 1;

    const response = await handleApiCall<
      | DistrictDTO[]
      | {
          data: DistrictDTO[];
          meta: { total: number; last_page: number; current_page: number; per_page?: number };
        }
      | {
          data: DistrictDTO[];
          total: number;
          last_page: number;
        }
      | {
          content: DistrictDTO[];
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
        data: DistrictDTO[];
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
        data: DistrictDTO[];
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
        content: DistrictDTO[];
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

  async getDistrictById(id: number): Promise<DistrictDTO> {
    return handleApiCall<DistrictDTO>(() => api.get(config.endpoints.admin.districts.detail(id)));
  }

  async createDistrict(data: CreateDistrictRequest): Promise<DistrictDTO> {
    return handleApiCall<DistrictDTO>(() => api.post(config.endpoints.admin.districts.list, data));
  }

  async updateDistrict(id: number, data: Partial<CreateDistrictRequest>): Promise<DistrictDTO> {
    return handleApiCall<DistrictDTO>(() => api.put(config.endpoints.admin.districts.detail(id), data));
  }

  async deleteDistrict(id: number): Promise<void> {
    return handleApiCall<void>(() => api.delete(config.endpoints.admin.districts.detail(id)));
  }
}

export const districtService = new DistrictService();
