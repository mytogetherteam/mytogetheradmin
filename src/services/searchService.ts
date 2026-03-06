import { apiClient } from "./apiClient";
import { config } from "@/config/config";

export interface GlobalSearchResult {
    users: SearchUserItem[];
    shops: SearchShopItem[];
    orders: SearchOrderItem[];
}

export interface SearchUserItem {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

export interface SearchShopItem {
    id: string;
    name: string;
    address?: string;
    status: string;
}

export interface SearchOrderItem {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
}

class SearchService {
    async globalSearch(query: string, limit: number = 5): Promise<GlobalSearchResult> {
        if (!query || query.trim().length === 0) {
            return { users: [], shops: [], orders: [] };
        }
        return apiClient.get<GlobalSearchResult>(`${config.endpoints.admin.search}?query=${encodeURIComponent(query)}&limit=${limit}`);
    }
}

export const searchService = new SearchService();
