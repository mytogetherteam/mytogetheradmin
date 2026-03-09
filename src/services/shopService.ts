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
  totalElements: number;
  totalPages: number;
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
  city?: string;
  cityMm?: string;
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
  logoUrl?: string;
  coverUrl?: string;
  primaryPhotoUrl?: string;
  ratingAvg?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  shopCategory?: ShopCategoryDTO;
  shopSubCategory?: ShopSubCategoryDTO;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DistrictDTO {
  id: number;
  cityId: number;
  cityNameEn?: string;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  slug: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
}

export interface CityDTO {
  id: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  active: boolean;
  districts?: DistrictDTO[];
}

export interface CuisineTypeDTO {
  id: number;
  name?: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  slug: string;
  imageUrl?: string;
}

export interface EnumOptionDTO {
  value: string;
  label: string;
  labelMm?: string;
  labelTh?: string;
}

export interface PaymentMethodDTO {
  id: number;
  code: string;
  name: string;
  nameMm?: string;
  nameTh?: string;
  iconUrl?: string;
  active: boolean;
  displayOrder: number;
}

export interface ShopCategoryDTO {
  id: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  slug: string;
  iconUrl?: string;
  active: boolean;
}

export interface ShopSubCategoryDTO {
  id: number;
  categoryId: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  slug: string;
  active: boolean;
}

export interface ShopFormDataDTO {
  cities: CityDTO[];
  cuisineTypes: CuisineTypeDTO[];
  paymentMethods: PaymentMethodDTO[];
  pricePreferences: EnumOptionDTO[];
  mealTypes: EnumOptionDTO[];
  deliveryTypes: EnumOptionDTO[];
  shopCategories?: ShopCategoryDTO[];
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
  slug?: string;
  description?: string;
  descriptionMm?: string;
  descriptionTh?: string;
  descriptionEn?: string;
  price?: number;
  originalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  currency?: string;
  shopId?: number;
  categoryId?: number;
  subCategoryId?: number;
  imageUrl?: string;
  imageUrls?: string[];
  isAvailable?: boolean;
  isPopular?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isCombo?: boolean;
  displayOrder?: number;
  optionGroups?: unknown[];
  variants?: unknown[];
}

export interface MenuCategory {
  id: number;
  name: string;
  nameMm?: string;
  nameTh?: string;
  nameEn?: string;
  displayOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
  image?: string;
  icon?: string;
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
  latitude: number;
  longitude: number;
  shopCategory?: ShopCategoryDTO;
  shopSubCategory?: ShopSubCategoryDTO;
  photos?: Photo[];
  menuCategories?: MenuCategory[];
  recentReviews?: Review[];
  operatingHours?: OperatingHour[];
  createdAt?: string;
  updatedAt?: string;
  paymentQrUrl?: string;
  cuisineTypes?: CuisineTypeDTO[];
  cuisineTypeIds?: number[];
  mealTypes?: string[];
  supportedDeliveryTypes?: string[];
  paymentMethodIds?: number[];
  paymentMethods?: PaymentMethodDTO[];
  ratingDistribution?: {
    fiveStarCount: number;
    fourStarCount: number;
    threeStarCount: number;
    twoStarCount: number;
    oneStarCount: number;
  };
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
    return apiClient.get<PageableResponse<Shop>>(endpoint);
  },

  /**
   * Get shop by ID with full details
   */
  getShopById: async (id: number): Promise<ShopDetail> => {
    const endpoint = config.endpoints.shops.detail(id);
    return apiClient.get<ShopDetail>(endpoint);
  },

  /**
   * Get all shop categories
   */
  getCategories: async (): Promise<ShopCategoryDTO[]> => {
    try {
      const response = await apiClient.get<ShopCategoryDTO[]>(
        config.endpoints.admin.payment.shopCategories
      );
      // We assume it returns an array of categories directly
      // If it returns a paginated response, handle `.content`, though setup endpoints usually return raw arrays
      return Array.isArray(response) ? response : (response as { content?: ShopCategoryDTO[] }).content || [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Get all sub-categories for a shop category
   */
  getSubCategories: async (categoryId: number): Promise<ShopSubCategoryDTO[]> => {
    try {
      if (!categoryId) return [];
      const response = await apiClient.get<ShopSubCategoryDTO[]>(
        config.endpoints.admin.payment.shopSubCategories(categoryId)
      );
      return Array.isArray(response) ? response : (response as { content?: ShopSubCategoryDTO[] }).content || [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Create a new shop
   */
  createShop: async (shopData: FormData): Promise<ShopDetail> => {
    const endpoint = config.endpoints.shops.list; 
    return apiClient.post<ShopDetail>(endpoint, shopData);
  },

  /**
   * Update an existing shop
   */
  updateShop: async (id: number, updates: FormData): Promise<ShopDetail> => {
    const endpoint = config.endpoints.shops.detail(id);
    return apiClient.put<ShopDetail>(endpoint, updates);
  },

  /**
   * Delete a shop
   */
  deleteShop: async (id: number): Promise<void> => {
    const endpoint = config.endpoints.shops.detail(id);
    await apiClient.delete(endpoint);
  },

  /**
   * Create a category
   */
  createCategory: async (shopId: number, categoryData: FormData): Promise<MenuCategory> => {
    const endpoint = config.endpoints.shops.categories.shopCategories(shopId);
    return apiClient.post<MenuCategory>(endpoint, categoryData);
  },

  /**
   * Update a category
   */
  updateCategory: async (id: number, categoryData: FormData): Promise<MenuCategory> => {
    const endpoint = config.endpoints.shops.categories.detail(id);
    return apiClient.put<MenuCategory>(endpoint, categoryData);
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (id: number): Promise<MenuCategory> => {
    const endpoint = config.endpoints.shops.categories.detail(id);
    return apiClient.get<MenuCategory>(endpoint);
  },
  
  /**
   * Delete a category
   */
  deleteCategory: async (id: number): Promise<void> => {
      const endpoint = config.endpoints.shops.categories.detail(id);
      await apiClient.delete(endpoint);
  },

  /**
   * Get all categories (Admin) - optionally filter by shopId
   */
  getAdminCategories: async (page = 0, size = 100, search = "", shopId?: number): Promise<PageableResponse<MenuCategory>> => {
    let endpoint = `/api/admin/categories?page=${page}&size=${size}`;
    if (search) endpoint += `&search=${encodeURIComponent(search)}`;
    if (shopId !== undefined) endpoint += `&shopId=${shopId}`;
    return apiClient.get<PageableResponse<MenuCategory>>(endpoint);
  },

  /**
   * Toggle shop active/inactive status
   * PUT /api/admin/shops/{id}/status
   */
  toggleShopStatus: async (id: number, active: boolean): Promise<void> => {
    // The endpoint expects ?active=true/false as a query parameter
    await apiClient.put(`${config.endpoints.shops.status(id)}?active=${active}`);
  },

  /**
   * Verify a shop
   * POST /api/admin/shops/{id}/verify
   */
  verifyShop: async (id: number): Promise<void> => {
    await apiClient.post(config.endpoints.shops.verify(id));
  },

  /**
   * Reject a shop with optional reason
   * POST /api/admin/shops/{id}/reject
   */
  rejectShop: async (id: number, reason?: string): Promise<void> => {
    const endpoint = config.endpoints.shops.reject(id);
    await apiClient.post(endpoint, { rejectionReason: reason });
  },

  /**
   * Get shops pending vetting (unverified shops)
   * GET /api/admin/shops/pending-vetting
   */
  getPendingVettingShops: async (page = 0, size = 20): Promise<PageableResponse<Shop>> => {
    return apiClient.get<PageableResponse<Shop>>(`${config.endpoints.shops.pending}?page=${page}&size=${size}`);
  },

  /**
   * Get Shop Profile
   */
  getShopProfile: async (): Promise<ShopDetail> => {
    return apiClient.get<ShopDetail>(config.endpoints.shops.profile.base);
  },

  /**
   * Update Shop Profile
   */
  updateShopProfile: async (profileData: FormData | Record<string, unknown>): Promise<ShopDetail> => {
    return apiClient.put<ShopDetail>(config.endpoints.shops.profile.base, profileData);
  },

  /**
   * Toggle Shop Open/Closed Status
   */
  toggleShopOpenStatus: async (isOpen: boolean, shopId?: number): Promise<ApiResponse<unknown>> => {
    const baseUrl = shopId 
        ? `/api/admin/shops/${shopId}/open-status` 
        : config.endpoints.shops.profile.status;
    return apiClient.put<ApiResponse<unknown>>(`${baseUrl}?isOpen=${isOpen}`);
  },

  /**
   * Update Operating Hours
   */
  updateOperatingHours: async (hours: OperatingHourRequest[]): Promise<ApiResponse<unknown>> => {
    return apiClient.put<ApiResponse<unknown>>(config.endpoints.shops.profile.operatingHours, hours);
  },

  /**
   * Lookup shops (lightweight search for dropdowns)
   */
  lookupShops: async (search = ''): Promise<Shop[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Shop[]>(`${config.endpoints.shops.lookup}${query}`);
  },

  /**
   * Get shop photos
   */
  getShopPhotos: async (shopId: number): Promise<Photo[]> => {
    return apiClient.get<Photo[]>(config.endpoints.shops.photos(shopId));
  },

  /**
   * Upload a photo for a shop
   */
  uploadShopPhoto: async (shopId: number, formData: FormData): Promise<Photo> => {
    return apiClient.post<Photo>(config.endpoints.shops.photos(shopId), formData);
  },

  /**
   * Delete a shop photo
   */
  deleteShopPhoto: async (shopId: number, photoId: number): Promise<void> => {
    await apiClient.delete(config.endpoints.shops.photoDetail(shopId, photoId));
  },

  /**
   * Get operating hours for a specific shop (admin)
   * GET /api/admin/shops/{id}/operating-hours
   */
  getShopOperatingHours: async (shopId: number): Promise<OperatingHour[]> => {
    return apiClient.get<OperatingHour[]>(config.endpoints.shops.operatingHours(shopId));
  },
};
