import { apiClient } from './apiClient';
import { config } from '@/config/config';

export type VisaSection = 'VISA_TYPES' | 'IMMIGRATION_SERVICES';

export interface VisaCategorySummary {
  id: number;
  title: string;
  section: VisaSection;
  displayOrder: number;
  isActive: boolean;
}

export interface VisaDTO {
  id: number;
  visaCategoryId: number;
  visaCategory: VisaCategorySummary;
  titleEn: string;
  titleMm: string | null;
  titleTh: string | null;
  subtitleEn: string | null;
  subtitleMm: string | null;
  subtitleTh: string | null;
  descriptionEn: string | null;
  descriptionMm: string | null;
  descriptionTh: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export const VisaService = {
  getVisas: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    section?: VisaSection;
    visaCategoryId?: number;
  }): Promise<{ content: VisaDTO[]; totalElements: number; totalPages: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.section) queryParams.append('section', params.section);
    if (params?.visaCategoryId !== undefined) {
      queryParams.append('visaCategoryId', params.visaCategoryId.toString());
    }

    const qs = queryParams.toString();
    const url = qs
      ? `${config.endpoints.admin.visas.base}?${qs}`
      : config.endpoints.admin.visas.base;

    const response = await apiClient.get<
      VisaDTO[] | { content: VisaDTO[]; totalElements: number; totalPages: number }
    >(url);

    if (Array.isArray(response)) {
      return { content: response, totalElements: response.length, totalPages: 1 };
    }
    if (response && 'content' in response) {
      return response;
    }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  getVisaById: async (id: number): Promise<VisaDTO> => {
    return apiClient.get<VisaDTO>(config.endpoints.admin.visas.detail(id));
  },

  createVisa: async (data: FormData): Promise<VisaDTO> => {
    return apiClient.post<VisaDTO>(config.endpoints.admin.visas.base, data);
  },

  updateVisa: async (id: number, data: FormData): Promise<VisaDTO> => {
    return apiClient.put<VisaDTO>(config.endpoints.admin.visas.detail(id), data);
  },

  deleteVisa: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.visas.detail(id));
  },

  reorderVisas: async (ids: number[]): Promise<void> => {
    await apiClient.post<void>(config.endpoints.admin.visas.reorder, { ids });
  },
};
