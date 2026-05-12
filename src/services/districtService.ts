import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface DistrictDTO {
  id: number;
  cityId: number;
  cityNameEn?: string;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
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
  active?: boolean;
}

class DistrictService {
  async getDistricts(params?: { page?: number; size?: number; search?: string; cityId?: number }): Promise<DistrictPage> {
    return apiClient.get<DistrictPage>(config.endpoints.admin.districts.list, { params });
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
