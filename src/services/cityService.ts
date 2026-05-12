import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface CityDTO {
  id: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  active: boolean;
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
  active?: boolean;
}

class CityService {
  async getCities(params?: { page?: number; size?: number; search?: string }): Promise<CityPage> {
    return apiClient.get<CityPage>(config.endpoints.admin.cities.list, { params });
  }

  async getCityById(id: number): Promise<CityDTO> {
    return apiClient.get<CityDTO>(config.endpoints.admin.cities.detail(id));
  }

  async createCity(data: Partial<CityDTO>): Promise<CityDTO> {
    return apiClient.post<CityDTO>(config.endpoints.admin.cities.list, data);
  }

  async updateCity(id: number, data: Partial<CityDTO>): Promise<CityDTO> {
    return apiClient.put<CityDTO>(config.endpoints.admin.cities.detail(id), data);
  }

  async deleteCity(id: number): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.cities.detail(id));
  }
}

export const cityService = new CityService();
