import { apiClient } from "./apiClient";
import { config } from "@/config/config";

export interface PlaceGalleryDTO {
  id: number;
  imageUrl: string;
}

export interface PlaceDTO {
  id: number;
  titleEn: string;
  titleMm: string | null;
  titleTh: string | null;
  locationName: string;
  descriptionEn: string | null;
  descriptionMm: string | null;
  descriptionTh: string | null;
  coverUrl: string | null;
  photoGallery: PlaceGalleryDTO[];
  openingTime: string;
  closingTime: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PlaceService = {
  getPlaces: async (params?: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<{ content: PlaceDTO[]; totalElements: number; totalPages: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append("page", params.page.toString());
    if (params?.size !== undefined) queryParams.append("size", params.size.toString());
    if (params?.search) queryParams.append("search", params.search);

    const qs = queryParams.toString();
    const url = qs
      ? `${config.endpoints.admin.places.base}?${qs}`
      : config.endpoints.admin.places.base;

    const response = await apiClient.get<
      PlaceDTO[] | { content: PlaceDTO[]; totalElements: number; totalPages: number }
    >(url);

    if (Array.isArray(response)) {
      return { content: response, totalElements: response.length, totalPages: 1 };
    }
    if (response && "content" in response) {
      return response;
    }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  getPlaceById: async (id: number): Promise<PlaceDTO> => {
    return apiClient.get<PlaceDTO>(config.endpoints.admin.places.detail(id));
  },

  createPlace: async (data: FormData): Promise<PlaceDTO> => {
    return apiClient.post<PlaceDTO>(config.endpoints.admin.places.base, data);
  },

  updatePlace: async (id: number, data: FormData): Promise<PlaceDTO> => {
    return apiClient.put<PlaceDTO>(config.endpoints.admin.places.detail(id), data);
  },

  deletePlace: async (id: number): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.places.detail(id));
  },

  reorderPlaces: async (ids: number[]): Promise<void> => {
    await apiClient.post<void>(config.endpoints.admin.places.reorder, { ids });
  },
};
