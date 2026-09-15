import { apiClient } from "./apiClient";
import { config } from "@/config/config";

export interface PlaceGalleryItem {
  id: number;
  imageUrl: string;
}

export interface PricingPlanItem {
  title: string;
  price?: string | number;
  unit?: string;
  timeSlot?: string;
  note?: string;
  isPopular?: boolean;
}

export interface Place {
  id: number;
  titleEn: string;
  titleMm?: string | null;
  titleTh?: string | null;
  locationName: string;
  descriptionEn?: string | null;
  descriptionMm?: string | null;
  descriptionTh?: string | null;
  coverUrl?: string | null;
  photoGallery: PlaceGalleryItem[];
  openingTime: string;
  closingTime: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  displayOrder: number;
  isActive: boolean;
  phoneNumber?: string | null;
  websiteUrl?: string | null;
  googleMapsUrl?: string | null;
  activities: string[];
  amenities: string[];
  pricingPlans?: PricingPlanItem[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlacesResponse {
  items: Place[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

export interface PlaceFormData {
  titleEn: string;
  titleMm?: string;
  titleTh?: string;
  locationName: string;
  descriptionEn?: string;
  descriptionMm?: string;
  descriptionTh?: string;
  latitude?: number;
  longitude?: number;
  openTimeHour?: number;
  openTimeMin?: number;
  closeTimeHour?: number;
  closeTimeMin?: number;
  displayOrder?: number;
  isActive?: boolean;
  phoneNumber?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  activities?: string[];
  amenities?: string[];
  pricingPlans?: PricingPlanItem[];
  removeGalleryIds?: number[];
}

export const placesService = {
  getPlaces: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    activity?: string;
  }): Promise<PlacesResponse> => {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      size: String(params?.size ?? 20),
      ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params?.activity?.trim() ? { activity: params.activity.trim() } : {}),
    });

    const res = await apiClient.get<any>(`${config.endpoints.admin.places.base}?${query.toString()}`);
    if (Array.isArray(res)) {
      return { items: res, total: res.length, page: 1, perPage: res.length, lastPage: 1 };
    }
    return {
      items: res?.items ?? res?.content ?? res?.data ?? [],
      total: res?.pagination?.total ?? res?.totalElements ?? res?.total ?? 0,
      page: res?.pagination?.current_page ?? res?.number ?? params?.page ?? 1,
      perPage: res?.pagination?.per_page ?? res?.size ?? params?.size ?? 20,
      lastPage: res?.pagination?.last_page ?? res?.totalPages ?? 1,
    };
  },

  getPlace: async (id: number | string): Promise<Place> => {
    return apiClient.get<Place>(config.endpoints.admin.places.detail(id));
  },

  createPlace: async (data: PlaceFormData, cover?: File, galleryFiles?: File[]): Promise<Place> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (cover) {
      formData.append("cover", cover);
    }
    if (galleryFiles && galleryFiles.length > 0) {
      galleryFiles.forEach((file) => formData.append("galleryPhotos", file));
    }
    return apiClient.post<Place>(config.endpoints.admin.places.base, formData);
  },

  updatePlace: async (
    id: number | string,
    data: PlaceFormData,
    cover?: File,
    galleryFiles?: File[],
  ): Promise<Place> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (cover) {
      formData.append("cover", cover);
    }
    if (galleryFiles && galleryFiles.length > 0) {
      galleryFiles.forEach((file) => formData.append("galleryPhotos", file));
    }
    return apiClient.put<Place>(config.endpoints.admin.places.detail(id), formData);
  },

  deletePlace: async (id: number | string): Promise<void> => {
    return apiClient.delete<void>(config.endpoints.admin.places.detail(id));
  },

  reorderPlaces: async (ids: number[]): Promise<void> => {
    return apiClient.post<void>(config.endpoints.admin.places.reorder, { ids });
  },
};
