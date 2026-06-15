import { apiClient } from "./apiClient";
import { config } from "@/config/config";
import {
  bannerImageSchema,
  bannersPageSchema,
  type BannerFormValues,
  type BannerImage,
  type BannersPage,
} from "@/schemas/banner-image.schema";

export interface BannersListParams {
  page?: number;
  size?: number;
  search?: string;
  position?: "Ads" | "Promotions";
}

function buildBannerFormData(
  values: Partial<BannerFormValues>,
  imageFile?: File,
) {
  const formData = new FormData();
  if (values.nameEn !== undefined) formData.append("nameEn", values.nameEn);
  if (values.nameMm !== undefined) formData.append("nameMm", values.nameMm);
  if (values.nameTh !== undefined && values.nameTh !== "")
    formData.append("nameTh", values.nameTh);
  if (values.descriptionEn !== undefined)
    formData.append("descriptionEn", values.descriptionEn);
  if (values.descriptionMm !== undefined)
    formData.append("descriptionMm", values.descriptionMm);
  if (values.descriptionTh !== undefined)
    formData.append("descriptionTh", values.descriptionTh);
  if (values.linkUrl !== undefined) formData.append("link", values.linkUrl);
  if (values.position !== undefined) formData.append("position", values.position);
  if (values.isActive !== undefined) {
    formData.append("status", values.isActive ? "Active" : "Hide");
  }
  if (values.startDate !== undefined) formData.append("startDate", values.startDate);
  if (values.endDate !== undefined) formData.append("endDate", values.endDate);
  if (imageFile) formData.append("image", imageFile);
  return formData;
}

export const bannerImageService = {
  getBanners: async (params: BannersListParams = {}): Promise<BannersPage> => {
    const response = await apiClient.get<unknown>(
      config.endpoints.admin.marketing.banners.base,
      {
        params: {
          page: params.page ?? 1,
          size: params.size ?? 100,
          search: params.search?.trim() || undefined,
          position: params.position,
        },
      },
    );

    if (Array.isArray(response)) {
      const content = response.map((item) => bannerImageSchema.parse(item));
      return {
        content,
        totalElements: content.length,
        totalPages: 1,
        number: 0,
        size: content.length,
      };
    }

    const parsed = bannersPageSchema.safeParse(response);
    if (parsed.success) return parsed.data;

    if (
      response &&
      typeof response === "object" &&
      "content" in response &&
      Array.isArray((response as { content: unknown[] }).content)
    ) {
      const page = response as {
        content: unknown[];
        totalElements?: number;
        totalPages?: number;
        number?: number;
        size?: number;
      };
      const content = page.content.map((item) => bannerImageSchema.parse(item));
      return {
        content,
        totalElements: page.totalElements ?? content.length,
        totalPages: page.totalPages ?? 1,
        number: page.number,
        size: page.size,
      };
    }

    throw parsed.error;
  },

  getBannerById: async (id: number): Promise<BannerImage> => {
    const response = await apiClient.get<unknown>(
      config.endpoints.admin.marketing.banners.detail(id),
    );
    return bannerImageSchema.parse(response);
  },

  createBanner: async (
    values: BannerFormValues,
    imageFile: File,
  ): Promise<BannerImage> => {
    const response = await apiClient.post<unknown>(
      config.endpoints.admin.marketing.banners.base,
      buildBannerFormData(values, imageFile),
    );
    return bannerImageSchema.parse(response);
  },

  updateBanner: async (
    id: number,
    values: Partial<BannerFormValues>,
    imageFile?: File,
  ): Promise<BannerImage> => {
    const response = await apiClient.put<unknown>(
      config.endpoints.admin.marketing.banners.detail(id),
      buildBannerFormData(values, imageFile),
    );
    return bannerImageSchema.parse(response);
  },

  deleteBanner: async (id: number): Promise<void> => {
    await apiClient.delete<void>(config.endpoints.admin.marketing.banners.detail(id));
  },
};
