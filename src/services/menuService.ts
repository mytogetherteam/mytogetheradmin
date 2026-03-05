import { apiClient } from "./apiClient";

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
    isPopular?: boolean;
    isAvailable?: boolean;
    isRecommended?: boolean;
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
        const endpoint = `/api/admin/categories?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
        const response = await apiClient.get<any>(endpoint);
        return response.data;
    },

    createMenuCategory: async (shopId: number, data: FormData): Promise<MenuCategory> => {
        const response = await apiClient.post<any>(`/api/admin/categories/shop/${shopId}`, data);
        return response.data;
    },

    updateMenuCategory: async (id: number, data: FormData): Promise<MenuCategory> => {
        const response = await apiClient.put<any>(`/api/admin/categories/${id}`, data);
        return response.data;
    },

    deleteMenuCategory: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/admin/categories/${id}`);
    },

    // --- Menu Items ---

    getAllMenuItems: async (page = 0, size = 20, search = "", shopId?: number): Promise<any> => {
        let endpoint = `/api/admin/items?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
        if (shopId) {
            endpoint += `&shopId=${shopId}`;
        }
        const response = await apiClient.get<any>(endpoint);
        return response.data;
    },

    getMenuItem: async (id: number): Promise<MenuItem> => {
        const response = await apiClient.get<any>(`/api/admin/items/${id}`);
        return response.data;
    },

    createMenuItem: async (categoryId: number, data: FormData): Promise<MenuItem> => {
        const response = await apiClient.post<any>(`/api/admin/items/categories/${categoryId}`, data);
        return response.data;
    },

    updateMenuItem: async (id: number, data: FormData): Promise<MenuItem> => {
        const response = await apiClient.put<any>(`/api/admin/items/${id}`, data);
        return response.data;
    },

    deleteMenuItem: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/admin/items/${id}`);
    },

    // --- Menu SubCategories ---

    getMenuSubCategories: async (categoryId: number): Promise<MenuSubCategory[]> => {
        const response = await apiClient.get<any>(`/api/admin/menu-sub-categories/category/${categoryId}`);
        return response.data;
    },

    getMenuSubCategory: async (id: number): Promise<MenuSubCategory> => {
        const response = await apiClient.get<any>(`/api/admin/menu-sub-categories/${id}`);
        return response.data;
    },

    createMenuSubCategory: async (categoryId: number, data: FormData): Promise<MenuSubCategory> => {
        const response = await apiClient.post<any>(`/api/admin/menu-sub-categories/category/${categoryId}`, data);
        return response.data;
    },

    updateMenuSubCategory: async (id: number, data: FormData): Promise<MenuSubCategory> => {
        const response = await apiClient.put<any>(`/api/admin/menu-sub-categories/${id}`, data);
        return response.data;
    },

    deleteMenuSubCategory: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/admin/menu-sub-categories/${id}`);
    },

    // --- Status Toggles ---
    toggleRecommended: async (id: number, enabled: boolean): Promise<any> => {
        const response = await apiClient.put<any>(`/api/admin/items/${id}/recommended?enabled=${enabled}`);
        return response.data;
    },
    togglePopular: async (id: number, isPopular: boolean): Promise<any> => {
        const response = await apiClient.put<any>(`/api/admin/items/${id}/popular?isPopular=${isPopular}`);
        return response.data;
    },
    toggleAvailable: async (id: number, available: boolean): Promise<any> => {
        const response = await apiClient.put<any>(`/api/admin/items/${id}/availability?available=${available}`);
        return response.data;
    },
    toggleHotDeal: async (id: number, enabled: boolean): Promise<any> => {
        const response = await apiClient.put<any>(`/api/admin/items/${id}/hot-deal?enabled=${enabled}`);
        return response.data;
    }
};
