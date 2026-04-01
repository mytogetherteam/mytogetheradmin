import { apiClient } from "./apiClient";
import { config } from "../config/config";
import { PageableResponse } from "./shopService";

export interface PromotionDTO {
    id: number;
    titleEn?: string;
    titleMm?: string;
    titleTh?: string;
    descriptionEn?: string;
    descriptionMm?: string;
    descriptionTh?: string;
    imageUrl?: string;
    badgeLabel?: string;
    targetType: string;
    targetId?: number;
    targetSlug?: string;
    promotionType: string;
    promotionValue?: number;
    maxDiscount?: number;
    minSpend?: number;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: string;
    displayOrder?: number;
    showInCarousel: boolean;
    isActive: boolean;
    isCurrentlyActive?: boolean;
}

export const PromotionService = {
    getPromotions: async (params: { page: number; size: number; search?: string }): Promise<PageableResponse<PromotionDTO>> => {
        const urlParams = new URLSearchParams({
            page: params.page.toString(),
            size: params.size.toString(),
            ...(params.search ? { search: params.search } : {})
        });
        const response = await apiClient.get<PageableResponse<PromotionDTO>>(`${config.endpoints.admin.marketing.promotions.base}?${urlParams.toString()}`);
        return response;
    },

    getPromotionById: async (id: number): Promise<PromotionDTO> => {
        const response = await apiClient.get<PromotionDTO>(config.endpoints.admin.marketing.promotions.detail(id));
        return response;
    },

    createPromotion: async (formData: FormData): Promise<PromotionDTO> => {
        const response = await apiClient.post<PromotionDTO>(config.endpoints.admin.marketing.promotions.base, formData);
        return response;
    },

    updatePromotion: async (id: number, formData: FormData): Promise<PromotionDTO> => {
        const response = await apiClient.put<PromotionDTO>(config.endpoints.admin.marketing.promotions.detail(id), formData);
        return response;
    },

    deletePromotion: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.marketing.promotions.detail(id));
    }
};
