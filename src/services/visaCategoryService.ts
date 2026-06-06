import { apiClient } from "./apiClient";
import { config } from "@/config/config";
import type { VisaSection } from "@/services/visaService";

export interface VisaCategoryDTO {
  id: number;
  title: string;
  section: VisaSection;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const VisaCategoryService = {
  getCategories: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    section?: VisaSection;
  }): Promise<{ content: VisaCategoryDTO[]; totalElements: number; totalPages: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append("page", params.page.toString());
    if (params?.size !== undefined) queryParams.append("size", params.size.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.section) queryParams.append("section", params.section);

    const qs = queryParams.toString();
    const url = qs
      ? `${config.endpoints.admin.visaCategories.base}?${qs}`
      : config.endpoints.admin.visaCategories.base;

    const response = await apiClient.get<
      VisaCategoryDTO[] | { content: VisaCategoryDTO[]; totalElements: number; totalPages: number }
    >(url);

    if (Array.isArray(response)) {
      return { content: response, totalElements: response.length, totalPages: 1 };
    }
    if (response && "content" in response) {
      return response;
    }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  getCategoryById: async (id: number): Promise<VisaCategoryDTO> => {
    return apiClient.get<VisaCategoryDTO>(config.endpoints.admin.visaCategories.detail(id));
  },

  createCategory: async (data: Record<string, unknown>): Promise<VisaCategoryDTO> => {
    return apiClient.post<VisaCategoryDTO>(config.endpoints.admin.visaCategories.base, data);
  },

  updateCategory: async (id: number, data: Record<string, unknown>): Promise<VisaCategoryDTO> => {
    return apiClient.put<VisaCategoryDTO>(config.endpoints.admin.visaCategories.detail(id), data);
  },

  deleteCategory: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.visaCategories.detail(id));
  },
};
