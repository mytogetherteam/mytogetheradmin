import { apiClient } from "./apiClient";
import { config } from "@/config/config";

export interface MenuCategory {
    id?: number;
    name: string;
    description?: string;
    shopId?: number; // If categories are shop-specific
    slug?: string;
    mediaUrl?: string; // If category has an image
}

export interface MenuItem {
    id?: number;
    name: string;
    nameMm?: string;
    nameTh?: string;
    nameEn?: string;
    slug?: string;
    description?: string;
    descriptionMm?: string;
    descriptionTh?: string;
    descriptionEn?: string;
    price: number;
    originalPrice?: number;
    discountAmount?: number;
    discountPercentage?: number;
    smallPrice?: number;
    mediumPrice?: number;
    largePrice?: number;
    currency: string;
    categoryId?: number;
    subCategoryId?: number;
    shopId: number;
    imageUrl?: string;
    imageUrls?: string[]; // Multiple images support
    isVegetarian?: boolean;
    isSpicy?: boolean;
    isAvailable?: boolean;
    isRecommended?: boolean;
    isPopular?: boolean;
    isHotDeal?: boolean;
    isCombo?: boolean;
    displayOrder?: number;
}

export interface MenuSubCategory {
    id: number;
    name: string;
    nameMm?: string;
    nameTh?: string;
    nameEn?: string;
    displayOrder?: number;
    isActive?: boolean;
    imageUrl?: string; 
    icon?: string;
}

export const menuService = {
    // --- Menu Categories ---

    getAllMenuCategories: async (page = 0, size = 20, search = ""): Promise<any> => {
        const endpoint = `${config.endpoints.admin.menu.categories}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
        return apiClient.get<any>(endpoint);
    },

    createMenuCategory: async (shopId: number, data: FormData): Promise<MenuCategory> => {
        return apiClient.post<any>(config.endpoints.admin.menu.shopCategories(shopId), data);
    },

    updateMenuCategory: async (id: number, data: FormData): Promise<MenuCategory> => {
        return apiClient.put<any>(config.endpoints.admin.menu.categoryDetail(id), data);
    },

    deleteMenuCategory: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.menu.categoryDetail(id));
    },

    // --- Menu Items ---

    getAllMenuItems: async (page = 0, size = 20, search = "", shopId?: number): Promise<any> => {
        let endpoint = `${config.endpoints.admin.menu.items}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
        if (shopId) {
            endpoint += `&shopId=${shopId}`;
        }
        return apiClient.get<any>(endpoint);
    },

    getMenuItem: async (id: number): Promise<MenuItem> => {
        return apiClient.get<any>(config.endpoints.admin.menu.itemDetail(id));
    },

    createMenuItem: async (categoryId: number, data: FormData): Promise<MenuItem> => {
        return apiClient.post<any>(config.endpoints.admin.menu.categoryItems(categoryId), data);
    },

    updateMenuItem: async (id: number, data: FormData): Promise<MenuItem> => {
        return apiClient.put<any>(config.endpoints.admin.menu.itemDetail(id), data);
    },

    deleteMenuItem: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.menu.itemDetail(id));
    },

    // --- Menu SubCategories ---

    getMenuSubCategories: async (categoryId: number): Promise<MenuSubCategory[]> => {
        return apiClient.get<any>(config.endpoints.admin.menu.subCategoryByCategory(categoryId));
    },

    getMenuSubCategory: async (id: number): Promise<MenuSubCategory> => {
        return apiClient.get<any>(config.endpoints.admin.menu.subCategoryDetail(id));
    },

    createMenuSubCategory: async (categoryId: number, data: FormData): Promise<MenuSubCategory> => {
        return apiClient.post<any>(config.endpoints.admin.menu.subCategoryByCategory(categoryId), data);
    },

    updateMenuSubCategory: async (id: number, data: FormData): Promise<MenuSubCategory> => {
        return apiClient.put<any>(config.endpoints.admin.menu.subCategoryDetail(id), data);
    },

    deleteMenuSubCategory: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.menu.subCategoryDetail(id));
    },

    // --- Status Toggles ---
    toggleRecommended: async (id: number, enabled: boolean): Promise<any> => {
        return apiClient.put<any>(`${config.endpoints.admin.menu.itemActions.recommended(id)}?enabled=${enabled}`);
    },
    toggleAvailable: async (id: number, available: boolean): Promise<any> => {
        return apiClient.put<any>(`${config.endpoints.admin.menu.itemActions.availability(id)}?available=${available}`);
    },
    toggleHotDeal: async (id: number, enabled: boolean): Promise<any> => {
        return apiClient.put<any>(`${config.endpoints.admin.menu.itemActions.hotDeal(id)}?enabled=${enabled}`);
    }
};
