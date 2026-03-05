import { apiClient, ApiResponseData } from './apiClient';
import { config } from '@/config/config';

// API Response Interfaces
export type ApiResponse<T> = ApiResponseData<T>;

export interface Pageable {
  paged: boolean;
  pageSize: number;
  pageNumber: number;
  unpaged: boolean;
  offset: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}

export interface PageableResponse<T> {
  pageable: Pageable;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  size: number;
  content: T[];
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  empty: boolean;
}

// Shop Interfaces
export interface Shop {
  id: number;
  name: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  slug: string;
  category: string;
  categoryMm?: string;
  categoryTh?: string;
  categoryEn?: string;
  subCategory?: string;
  subCategoryMm?: string;
  subCategoryTh?: string;
  subCategoryEn?: string;
  address: string;
  addressMm?: string;
  addressTh?: string;
  addressEn?: string;
  district?: string;
  districtMm?: string;
  districtId?: number;
  city: string;
  cityMm?: string;
  latitude?: number;
  longitude?: number;
  ratingAvg?: number;
  ratingCount?: number;
  logoUrl?: string;
  coverUrl?: string;
  primaryPhotoUrl?: string;
  phone?: string;
  email?: string;
  description?: string;
  descriptionMm?: string;
  descriptionTh?: string;
  descriptionEn?: string;
  hasDelivery?: boolean;
  deliveryEnabled?: boolean;
  hasParking?: boolean;
  hasWifi?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  isHalal?: boolean;
  isVegetarian?: boolean;
  enableStockCheck?: boolean;
  maxItemQuantityPerOrder?: number;
  minOrderAmount?: number;
  baseDeliveryFee?: number;
  pricePreference?: 'LOW' | 'MEDIUM' | 'HIGH';
  pricePreferenceMm?: string;
  pricePreferenceTh?: string;
  pricePreferenceEn?: string;
  distance?: number;
  minEta?: number;
  maxEta?: number;
  estimatedTime?: string;
  viewCount?: number;
  paymentMethodIds?: number[];
}

export interface Photo {
  id: number;
  url: string;
  thumbnailUrl?: string;
  photoType?: string;
  caption?: string;
  captionMm?: string;
  captionEn?: string;
  isPrimary?: boolean;
  displayOrder?: number;
  uploadedAt?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  nameMm?: string;
  nameEn?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  isPopular?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  displayOrder?: number;
}

export interface MenuCategory {
  id: number;
  name: string;
  nameMm?: string;
  nameEn?: string;
  displayOrder?: number;
  isActive?: boolean;
  items?: MenuItem[];
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  commentMm?: string;
  reviewerName?: string;
  helpfulCount?: number;
  ownerResponse?: string;
  ownerResponseMm?: string;
  createdAt?: string;
}

export interface OperatingHour {
  id?: number;
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  openingTime?: {
    hour: number;
    minute: number;
    second: number;
    nano: number;
  };
  closingTime?: {
    hour: number;
    minute: number;
    second: number;
    nano: number;
  };
  isClosed?: boolean;
}

export interface OperatingHourRequest {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
}

export interface ShopDetail extends Shop {
  photos?: Photo[];
  menuCategories?: MenuCategory[];
  recentReviews?: Review[];
  operatingHours?: OperatingHour[];
  createdAt?: string;
  updatedAt?: string;
  paymentQrUrl?: string;
  cuisineTypes?: any[];
  cuisineTypeIds?: number[];
  mealTypes?: string[];
  supportedDeliveryTypes?: string[];
  paymentMethodIds?: number[];
  paymentMethods?: any[];
  ratingDistribution?: {
    fiveStarCount: number;
    fourStarCount: number;
    threeStarCount: number;
    twoStarCount: number;
    oneStarCount: number;
  };
  recommendations?: any[];
  popularDishes?: any[];
  hotDeals?: any[];
}

// Redundant interface removed

export const ShopService = {
  /**
   * Get all shops with pagination support
   */
  getAllShops: async (
    page: number = 0,
    size: number = 20,
    search: string = "",
    active?: boolean
  ): Promise<PageableResponse<Shop>> => {
    let endpoint = `${config.endpoints.shops.list}?page=${page}&size=${size}`;
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    if (active !== undefined) {
      endpoint += `&active=${active}`;
    }
    const response = await apiClient.get<ApiResponseData<PageableResponse<Shop>>>(endpoint);
    return response.data;
  },

  /**
   * Get shop by ID with full details
   */
  getShopById: async (id: number): Promise<ShopDetail> => {
    const endpoint = config.endpoints.shops.detail(id);
    const response = await apiClient.get<ApiResponseData<ShopDetail>>(endpoint);
    return response.data;
  },

  /**
   * Get all shop categories
   */
  getCategories: async (): Promise<string[]> => {
    // Note: Admin spec setup/shop-form-data returns many types of data.
    // For now, we'll keep returning a list of strings if the UI expects it,
    // but the actual categories might need a different source or be hardcoded if missing from setup.
    try {
      const response = await apiClient.get<ApiResponseData<any>>(
        config.endpoints.shops.categories
      );
      // If setup data, we might need to extract something. 
      // For now, let's assume it still works or fallback to common categories.
      return response.data.categories || ["Restaurant", "Retail", "Service", "Other"];
    } catch (e) {
      return ["Restaurant", "Retail", "Service", "Other"];
    }
  },

  /**
   * Create a new shop
   */
  createShop: async (shopData: FormData): Promise<ShopDetail> => {
    const endpoint = '/api/admin/shops'; 
    const response = await apiClient.post<ApiResponseData<ShopDetail>>(endpoint, shopData);
    return response.data;
  },

  /**
   * Update an existing shop
   */
  updateShop: async (id: number, updates: FormData): Promise<ShopDetail> => {
    const endpoint = `/api/admin/shops/${id}`;
    const response = await apiClient.put<ApiResponseData<ShopDetail>>(endpoint, updates);
    return response.data;
  },

  /**
   * Delete a shop
   */
  deleteShop: async (id: number): Promise<void> => {
    const endpoint = `/api/admin/shops/${id}`;
    await apiClient.delete(endpoint);
  },

  /**
   * Create a category
   */
  createCategory: async (shopId: number, categoryData: FormData): Promise<any> => {
    const endpoint = `/api/admin/categories/shop/${shopId}`;
    const response = await apiClient.post<ApiResponse<any>>(endpoint, categoryData);
    return response.data;
  },

  /**
   * Update a category
   */
  updateCategory: async (id: number, categoryData: FormData): Promise<any> => {
    const endpoint = `/api/admin/categories/${id}`;
    const response = await apiClient.put<ApiResponse<any>>(endpoint, categoryData);
    return response.data;
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (id: number): Promise<any> => {
    const endpoint = `/api/admin/categories/${id}`;
    const response = await apiClient.get<ApiResponse<any>>(endpoint);
    return response.data;
  },
  
  /**
   * Delete a category
   */
  deleteCategory: async (id: number): Promise<void> => {
      const endpoint = `/api/admin/categories/${id}`;
      await apiClient.delete(endpoint);
  },

  /**
   * Get all categories (Admin) - optionally filter by shopId
   */
  getAdminCategories: async (page = 0, size = 100, search = "", shopId?: number): Promise<any> => {
    let endpoint = `/api/admin/categories?page=${page}&size=${size}`;
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    if (shopId !== undefined) endpoint += `&shopId=${shopId}`;
    const response = await apiClient.get<any>(endpoint);
    return response.data;
  },

  /**
   * Toggle shop active/inactive status
   */
  toggleShopStatus: async (id: number, active: boolean): Promise<void> => {
    await apiClient.put(`/api/admin/shops/${id}/status?active=${active}`);
  },

  /**
   * Verify a shop
   */
  verifyShop: async (id: number): Promise<void> => {
    await apiClient.post(`/api/admin/shops/${id}/verify`);
  },

  /**
   * Reject a shop with optional reason
   */
  rejectShop: async (id: number, reason?: string): Promise<void> => {
    let endpoint = `/api/admin/shops/${id}/reject`;
    if (reason) endpoint += `?reason=${encodeURIComponent(reason)}`;
    await apiClient.post(endpoint);
  },

  /**
   * Get shops pending vetting (unverified shops)
   */
  getPendingVettingShops: async (page = 0, size = 20): Promise<any> => {
    const response = await apiClient.get<any>(`/api/admin/shops/pending-vetting?page=${page}&size=${size}`);
    return response.data;
  },
};
