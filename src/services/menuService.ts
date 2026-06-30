import { apiClient } from "./apiClient";
import { config } from "@/config/config";
import { PageableResponse } from "./shopService";
import type { AdminAuditUser } from "@/lib/audit-user";

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

export interface ComboComponent {
    id?: number;
    includedItemId: number;
    includedItemNameEn?: string;
    includedItemNameMm?: string;
    includedItemNameTh?: string;
    includedItemPrice?: number;
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
    /** Computed selling amount from API (not a DB column on menu_item). */
    price?: number;
    originalPrice?: number;
    discountAmount?: number;
    discountPercentage?: number;
    smallPrice?: number;
    mediumPrice?: number;
    largePrice?: number;
    currency: string;
    menuCategoryId?: number;
    shopId: number;
    imageUrl?: string;
    imageUrls?: string[];
    isVegetarian?: boolean;
    isHalal?: boolean;
    isSpicy?: boolean;
    isAvailable?: boolean;
    isRecommended?: boolean;
    isPopular?: boolean;
    isHotDeal?: boolean;
    isCombo?: boolean;
    displayOrder?: number;
    publishStatus?: string;
    optionGroups?: OptionGroup[];
    variants?: Variant[];
    shopName?: string;
    categoryName?: string;
    menuCategoryName?: string;
    mealTypes?: string[];
    tagIds?: number[];
    tags?: ItemTag[];
    masterCategoryId?: number;
    masterCategoryName?: string;
    components?: ComboComponent[];
    createdAt?: string;
    updatedAt?: string;
    createdBy?: AdminAuditUser | null;
    updatedBy?: AdminAuditUser | null;
    createdById?: number | null;
    updatedById?: number | null;
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


export const menuService = {
    // --- Menu Categories ---

    getAllMenuCategories: async (page = 0, size = 20, search = ""): Promise<PageableResponse<MenuCategory>> => {
        const endpoint = `${config.endpoints.admin.menu.categories}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
        return apiClient.get<PageableResponse<MenuCategory>>(endpoint);
    },

    createMenuCategory: async (data: FormData): Promise<MenuCategory> => {
        return apiClient.post<MenuCategory>(config.endpoints.admin.menu.categories, data);
    },

    updateMenuCategory: async (id: number, data: FormData): Promise<MenuCategory> => {
        return apiClient.put<MenuCategory>(config.endpoints.admin.menu.categoryDetail(id), data);
    },

    deleteMenuCategory: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.menu.categoryDetail(id));
    },

    // --- Menu Items ---

    getAllMenuItems: async (
        page = 0,
        size = 20,
        search = "",
        shopId?: number,
        categoryId?: number,
        masterCategoryId?: number,
        filters?: { isAvailable?: boolean; pendingStatus?: "PENDING" | "APPROVED" | "REJECTED"; publishStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "UNPUBLISHED" },
    ): Promise<PageableResponse<MenuItem>> => {
        let endpoint = `${config.endpoints.admin.menu.items}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
        if (shopId) endpoint += `&shopId=${shopId}&shop_id=${shopId}`;
        if (categoryId) endpoint += `&categoryId=${categoryId}&category_id=${categoryId}`;
        if (masterCategoryId) endpoint += `&masterCategoryId=${masterCategoryId}&master_category_id=${masterCategoryId}`;
        if (filters?.isAvailable !== undefined) endpoint += `&isAvailable=${filters.isAvailable}`;
        if (filters?.pendingStatus) endpoint += `&pendingStatus=${filters.pendingStatus}`;
        if (filters?.publishStatus) endpoint += `&publishStatus=${filters.publishStatus}`;
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
        const base = config.endpoints.admin.menu.itemTags.base;
        const params = new URLSearchParams({ onlyActive: 'true', page: '0', size: '500' });
        const response = await apiClient.get<ItemTag[] | { content: ItemTag[] }>(`${base}?${params.toString()}`);
        return Array.isArray(response) ? response : (response as { content?: ItemTag[] }).content || [];
    },

    getAllMasterMenuCategories: async (page = 0, size = 50): Promise<{ content: { id: number; nameEn?: string; name: string }[], last: boolean }> => {
        const url = `${config.endpoints.admin.menu.masterMenuCategories.base}?page=${page}&size=${size}`;
        const response = await apiClient.get<{ content?: { id: number; nameEn?: string; name: string }[], last?: boolean }>(url);
        return { content: response?.content || [], last: response?.last ?? true };
    },
};
