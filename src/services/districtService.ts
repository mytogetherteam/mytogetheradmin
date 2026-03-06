import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface DistrictDTO {
  id: number;
  cityId: number;
  cityNameEn?: string;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  slug: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
}

export interface DistrictPage {
  content: DistrictDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateDistrictRequest {
  cityId: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  latitude?: number;
  longitude?: number;
  active?: boolean;
}

class DistrictService {
  async getDistricts(page = 0, size = 20, search = '', cityId?: number): Promise<DistrictPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    if (cityId !== undefined) params.append('cityId', String(cityId));
    return apiClient.get<DistrictPage>(`${config.endpoints.admin.districts.list}?${params.toString()}`);
  }

  async getDistrictById(id: number): Promise<DistrictDTO> {
    return apiClient.get<DistrictDTO>(config.endpoints.admin.districts.detail(id));
  }

  async createDistrict(data: CreateDistrictRequest): Promise<DistrictDTO> {
    return apiClient.post<DistrictDTO>(config.endpoints.admin.districts.list, data);
  }

  async updateDistrict(id: number, data: Partial<CreateDistrictRequest>): Promise<DistrictDTO> {
    return apiClient.put<DistrictDTO>(config.endpoints.admin.districts.detail(id), data);
  }

  async deleteDistrict(id: number): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.districts.detail(id));
  }
}

export const districtService = new DistrictService();
