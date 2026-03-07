import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface CityDTO {
  id: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  slug: string;
  active: boolean;
}

export interface CityPage {
  content: CityDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateCityRequest {
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  slug: string;
  active?: boolean;
}

class CityService {
  async getCities(page = 0, size = 20, search = ''): Promise<CityPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    return apiClient.get<CityPage>(`${config.endpoints.admin.cities.list}?${params.toString()}`);
  }

  async getCityById(id: number): Promise<CityDTO> {
    return apiClient.get<CityDTO>(config.endpoints.admin.cities.detail(id));
  }

  async createCity(data: CreateCityRequest): Promise<CityDTO> {
    return apiClient.post<CityDTO>(config.endpoints.admin.cities.list, data);
  }

  async updateCity(id: number, data: Partial<CreateCityRequest>): Promise<CityDTO> {
    return apiClient.put<CityDTO>(config.endpoints.admin.cities.detail(id), data);
  }

  async deleteCity(id: number): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.cities.detail(id));
  }
}

export const cityService = new CityService();
