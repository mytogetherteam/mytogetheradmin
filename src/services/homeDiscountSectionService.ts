import { apiClient } from './apiClient';
import { config } from '@/config/config';
import { PageableResponse } from './shopService';

export type HomeDiscountSectionStatus = 'active' | 'scheduled' | 'expired';

export interface HomeDiscountSectionDTO {
  id: number;
  title: string | null;
  discountPercent: number;
  startTime: string | null;
  endTime: string | null;
  status?: HomeDiscountSectionStatus;
  isCurrentlyActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeDiscountSectionPayload {
  title?: string | null;
  discountPercent: number;
  startTime?: string | null;
  endTime?: string | null;
}

export const HomeDiscountSectionService = {
  getSections: async (params?: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<PageableResponse<HomeDiscountSectionDTO>> => {
    const response = await apiClient.get<PageableResponse<HomeDiscountSectionDTO>>(
      config.endpoints.admin.marketing.homeDiscountSections.base,
      {
        params: {
          page: params?.page ?? 1,
          size: params?.size ?? 20,
          search: params?.search?.trim() || undefined,
        },
      },
    );
    return response;
  },

  getSectionById: async (id: number): Promise<HomeDiscountSectionDTO> => {
    return apiClient.get<HomeDiscountSectionDTO>(
      config.endpoints.admin.marketing.homeDiscountSections.detail(id),
    );
  },

  createSection: async (
    payload: HomeDiscountSectionPayload,
  ): Promise<HomeDiscountSectionDTO> => {
    return apiClient.post<HomeDiscountSectionDTO>(
      config.endpoints.admin.marketing.homeDiscountSections.base,
      payload,
    );
  },

  updateSection: async (
    id: number,
    payload: Partial<HomeDiscountSectionPayload>,
  ): Promise<HomeDiscountSectionDTO> => {
    return apiClient.put<HomeDiscountSectionDTO>(
      config.endpoints.admin.marketing.homeDiscountSections.detail(id),
      payload,
    );
  },

  deleteSection: async (id: number): Promise<void> => {
    await apiClient.delete<void>(
      config.endpoints.admin.marketing.homeDiscountSections.detail(id),
    );
  },
};

export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
