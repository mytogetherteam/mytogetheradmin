import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface BackgroundThemeDTO {
  id: number;
  name: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function buildFormData(
  dto: {
    name?: string;
    displayOrder?: number;
    isActive?: boolean;
  },
  imageFile?: File,
) {
  const formData = new FormData();
  if (dto.name !== undefined) formData.append('name', dto.name);
  if (dto.displayOrder !== undefined) {
    formData.append('displayOrder', String(dto.displayOrder));
  }
  if (dto.isActive !== undefined) {
    formData.append('isActive', String(dto.isActive));
  }
  if (imageFile) formData.append('image', imageFile);
  return formData;
}

export const BackgroundThemeService = {
  getBackgroundThemes: async (params?: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<{
    content: BackgroundThemeDTO[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get<
      BackgroundThemeDTO[] | { content: BackgroundThemeDTO[]; totalElements: number; totalPages: number }
    >(config.endpoints.admin.marketing.backgroundThemes.base, {
      params: {
        page: params?.page ?? 1,
        size: params?.size ?? 100,
        search: params?.search?.trim() || undefined,
      },
    });

    if (Array.isArray(response)) {
      return {
        content: response,
        totalElements: response.length,
        totalPages: 1,
      };
    }

    if (response?.content) {
      return {
        content: response.content,
        totalElements: response.totalElements ?? response.content.length,
        totalPages: response.totalPages ?? 1,
      };
    }

    return { content: [], totalElements: 0, totalPages: 0 };
  },

  getBackgroundThemeById: async (id: number): Promise<BackgroundThemeDTO> => {
    return apiClient.get<BackgroundThemeDTO>(
      config.endpoints.admin.marketing.backgroundThemes.detail(id),
    );
  },

  createBackgroundTheme: async (
    dto: { name: string; displayOrder?: number; isActive?: boolean },
    imageFile: File,
  ): Promise<BackgroundThemeDTO> => {
    return apiClient.post<BackgroundThemeDTO>(
      config.endpoints.admin.marketing.backgroundThemes.base,
      buildFormData(dto, imageFile),
    );
  },

  updateBackgroundTheme: async (
    id: number,
    dto: { name?: string; displayOrder?: number; isActive?: boolean },
    imageFile?: File,
  ): Promise<BackgroundThemeDTO> => {
    return apiClient.put<BackgroundThemeDTO>(
      config.endpoints.admin.marketing.backgroundThemes.detail(id),
      buildFormData(dto, imageFile),
    );
  },

  deleteBackgroundTheme: async (id: number): Promise<void> => {
    await apiClient.delete<void>(
      config.endpoints.admin.marketing.backgroundThemes.detail(id),
    );
  },

  reorderBackgroundThemes: async (ids: number[]): Promise<void> => {
    await apiClient.post<void>(
      config.endpoints.admin.marketing.backgroundThemes.reorder,
      { ids },
    );
  },
};
