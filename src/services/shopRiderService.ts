import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ShopRider {
    id: number;
    shopId: number;
    shopName?: string;
    name: string;
    phoneNo: string;
    isActive: boolean;
    motorcycleNo?: string;
    vehicleType?: string;
    createdAt?: string;
}

export interface ShopRiderPage {
    content: ShopRider[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export const shopRiderService = {
    getAllRiders: async (page = 0, size = 20, keyword = ''): Promise<ShopRiderPage> => {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (keyword) params.append('keyword', keyword);
        return apiClient.get<ShopRiderPage>(`${config.endpoints.shops.riders.list}?${params.toString()}`);
    },

    getRiderById: async (id: number): Promise<ShopRider> => {
        return apiClient.get<ShopRider>(config.endpoints.shops.riders.detail(id));
    },

    createRider: async (riderData: Partial<ShopRider>): Promise<ShopRider> => {
        return apiClient.post<ShopRider>(config.endpoints.shops.riders.list, riderData);
    },

    updateRider: async (id: number, riderData: Partial<ShopRider>): Promise<ShopRider> => {
        return apiClient.put<ShopRider>(config.endpoints.shops.riders.detail(id), riderData);
    },

    deleteRider: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.shops.riders.detail(id));
    }
};
