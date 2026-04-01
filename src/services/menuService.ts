import { apiClient } from "./apiClient";
import { config } from "@/config/config";
import { PageableResponse } from "./shopService";

export interface MenuCategory {
    id?: number;
    name: string;
    nameMm?: string;
    nameTh?: string;
    nameEn?: string;
    description?: string;
    shopId?: number;
    mediaUrl?: string;
    displayOrder?: number;
    isActive?: boolean;
    imageUrl?: string;
}

export interface ItemTag {
    id: number;
    name: string;
    nameEn?: string;
    nameMm?: string;
    nameTh?: string;
    colorHex?: string;
    icon?: string;
}

export interface MasterItem {
    id: number;
    name: string;
    nameEn?: string;
    nameMm?: string;
    nameTh?: string;
    masterCategoryId?: number;
    masterCategoryName?: string;
}

export interface ComboComponent {
    includedItemId: number;
    quantity: number;
    displayOrder: number;
    itemName?: string; // for display purposes
}

export interface MenuItem {
    id?: number;
    name: string;
    nameMm?: string;
    nameTh?: string;
    nameEn?: string;
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
    menuCategoryId?: number;
    menuSubCategoryId?: number;
    shopId: number;
    imageUrl?: string;
    imageUrls?: string[];
    isVegetarian?: boolean;
    isSpicy?: boolean;
    isAvailable?: boolean;
    isRecommended?: boolean;
    isPopular?: boolean;
    isHotDeal?: boolean;
    isCombo?: boolean;
    displayOrder?: number;
    optionGroups?: OptionGroup[];
    variants?: Variant[];
    shopName?: string;
    categoryName?: string;
    mealTypes?: string[];
    tagIds?: number[];
    tags?: ItemTag[];
    masterItemId?: number;
    masterCategoryId?: number;
    components?: ComboComponent[];
}

export interface Option {
    id?: number;
    name?: string;
    nameEn: string;
    nameMm?: string;
    nameTh?: string;
    price: number;
    displayPrice?: string;
    isAvailable: boolean;
    displayOrder?: number;
    linkedMenuItemId?: number;
}

export interface OptionGroup {
    id?: number;
    name?: string;
    nameEn: string;
    nameMm?: string;
    nameTh?: string;
    isRequired: boolean;
    minSelection: number;
    maxSelection: number;
    displayOrder?: number;
    groupType?: "SINGLE_SELECT" | "MULTI_SELECT";
    options: Option[];
}

export interface Variant {
    id?: number;
    name?: string;
    nameEn: string;
    nameMm?: string;
    nameTh?: string;
    price: number;
    isAvailable: boolean;
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
    menuCategoryId?: number;
    categoryName?: string;
    masterMenuSubCategoryId?: number;
    masterMenuSubCategoryName?: string;
}

export const menuService = {
    // --- Menu Categories ---

    getAllMenuCategories: async (page = 0, size = 20, search = ""): Promise<PageableResponse<MenuCategory>> => {
        const endpoint = `${config.endpoints.admin.menu.categories}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
        return apiClient.get<PageableResponse<MenuCategory>>(endpoint);
    },

    createMenuCategory: async (shopId: number, data: FormData): Promise<MenuCategory> => {
        return apiClient.post<MenuCategory>(config.endpoints.admin.menu.shopCategories(shopId), data);
    },

    updateMenuCategory: async (id: number, data: FormData): Promise<MenuCategory> => {
        return apiClient.put<MenuCategory>(config.endpoints.admin.menu.categoryDetail(id), data);
    },

    deleteMenuCategory: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.menu.categoryDetail(id));
    },

    // --- Menu Items ---

    getAllMenuItems: async (page = 0, size = 20, search = "", shopId?: number): Promise<PageableResponse<MenuItem>> => {
        let endpoint = `${config.endpoints.admin.menu.items}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
        if (shopId) {
            endpoint += `&shopId=${shopId}`;
        }
        return apiClient.get<PageableResponse<MenuItem>>(endpoint);
    },

    getMenuItem: async (id: number): Promise<MenuItem> => {
        return apiClient.get<MenuItem>(config.endpoints.admin.menu.itemDetail(id));
    },

    createMenuItem: async (data: FormData): Promise<MenuItem> => {
        return apiClient.post<MenuItem>(config.endpoints.admin.menu.items, data);
    },

    updateMenuItem: async (id: number, data: FormData): Promise<MenuItem> => {
        return apiClient.put<MenuItem>(config.endpoints.admin.menu.itemDetail(id), data);
    },

    deleteMenuItem: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.menu.itemDetail(id));
    },

    // --- Menu SubCategories ---

    getMenuSubCategories: async (categoryId: number): Promise<MenuSubCategory[]> => {
        return apiClient.get<MenuSubCategory[]>(config.endpoints.admin.menu.subCategoryByCategory(categoryId));
    },

    getMenuSubCategory: async (id: number): Promise<MenuSubCategory> => {
        return apiClient.get<MenuSubCategory>(config.endpoints.admin.menu.subCategoryDetail(id));
    },

    createMenuSubCategory: async (data: FormData): Promise<MenuSubCategory> => {
        return apiClient.post<MenuSubCategory>(config.endpoints.admin.menu.subCategories, data);
    },

    updateMenuSubCategory: async (id: number, data: FormData): Promise<MenuSubCategory> => {
        return apiClient.put<MenuSubCategory>(config.endpoints.admin.menu.subCategoryDetail(id), data);
    },

    deleteMenuSubCategory: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.menu.subCategoryDetail(id));
    },

    // --- Status Toggles ---
    toggleRecommended: async (id: number, enabled: boolean): Promise<MenuItem> => {
        return apiClient.put<MenuItem>(`${config.endpoints.admin.menu.itemActions.recommended(id)}?enabled=${enabled}`);
    },
    toggleAvailable: async (id: number, available: boolean): Promise<MenuItem> => {
        return apiClient.put<MenuItem>(`${config.endpoints.admin.menu.itemActions.availability(id)}?available=${available}`);
    },
    toggleHotDeal: async (id: number, enabled: boolean): Promise<MenuItem> => {
        return apiClient.put<MenuItem>(`${config.endpoints.admin.menu.itemActions.hotDeal(id)}?enabled=${enabled}`);
    },

    getAllItemTags: async (): Promise<ItemTag[]> => {
        const response = await apiClient.get<ItemTag[] | { content: ItemTag[] }>(config.endpoints.admin.menu.itemTags.base);
        return Array.isArray(response) ? response : (response as { content?: ItemTag[] }).content || [];
    },

    searchMasterItems: async (search = '', page = 0, size = 20): Promise<{ content: MasterItem[], last: boolean }> => {
        const url = `${config.endpoints.admin.menu.masterItems.search}?search=${encodeURIComponent(search)}&page=${page}&size=${size}`;
        const response = await apiClient.get<MasterItem[] | { content: MasterItem[], last: boolean }>(url);
        if (Array.isArray(response)) {
            return { content: response, last: true };
        }
        return { content: (response as { content?: MasterItem[] }).content || [], last: (response as { last?: boolean }).last ?? true };
    },

    getAllMasterMenuCategories: async (page = 0, size = 50): Promise<{ content: { id: number; nameEn?: string; name: string }[], last: boolean }> => {
        const url = `${config.endpoints.admin.menu.masterMenuCategories.base}?page=${page}&size=${size}`;
        const response = await apiClient.get<{ content?: { id: number; nameEn?: string; name: string }[], last?: boolean }>(url);
        return { content: response?.content || [], last: response?.last ?? true };
    },
};
