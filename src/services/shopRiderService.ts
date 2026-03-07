import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ShopRider {
    id: number;
    shopId: number;
    name: string;
    phone: string;
    isActive: boolean;
    vehicleNumber?: string;
    vehicleType?: string;
    createdAt?: string;
}

export const shopRiderService = {
    getAllRiders: async (): Promise<ShopRider[]> => {
        return apiClient.get<ShopRider[]>(config.endpoints.shops.riders.list);
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
