import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface UserProfile {
  fullName: string;
  email: string;
  isVegetarian: boolean;
  isHalal: boolean;
  pricePreference: 'LOW' | 'MEDIUM' | 'HIGH';
  pricePreferenceMm?: string;
  spicinessPreference: 'MILD' | 'MEDIUM' | 'HOT';
  spicinessPreferenceMm?: string;
}

export interface UserListItem {
  id: number | string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface UserDetail extends UserListItem, UserProfile {
  phone?: string;
  userPhone?: string; // Some APIs use this
  avatarUrl?: string;
  updatedAt?: string;
  hasCompletedOnboarding?: boolean;
  agreedToTermsAt?: string;
  privacyPolicyVersion?: string;
  hasGoogle?: boolean;
  hasFacebook?: boolean;
  hasLine?: boolean;
  hasTiktok?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UserLookup {
  id: number | string;
  username: string;
  fullName: string;
  role?: string;
}

export interface OrderHistoryItem {
  id: number | string;
  shopName?: string;
  status: string;
  statusLabel?: string;
  itemCount: number;
  totalAmount: number;
  displayTotalAmount?: string;
  createdAt: string;
}

export interface ActivityHistoryItem {
  id: number | string;
  activityType: string;
  targetId?: number | string;
  targetName?: string;
  searchQuery?: string;
  metadata?: string;
  osName?: string;
  deviceId?: string;
  createdAt: string;
}

// Redundant ProfileResponse removed

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(config.endpoints.user.profile);
  },

  updateProfile: async (data: FormData | Partial<UserProfile>): Promise<UserProfile> => {
    return apiClient.put<UserProfile>(config.endpoints.user.profile, data);
  },

  getAllUsers: async (page = 0, size = 10, search = ""): Promise<PageResponse<UserListItem>> => {
    const endpoint = `${config.endpoints.admin.users.list}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
    return apiClient.get<PageResponse<UserListItem>>(endpoint);
  },

  toggleUserStatus: async (id: string, active: boolean): Promise<UserListItem> => {
    return apiClient.put<UserListItem>(`${config.endpoints.admin.users.status(id)}?active=${active}`, {});
  },

  updateUserRole: async (id: string, role: string): Promise<UserListItem> => {
    return apiClient.put<UserListItem>(`${config.endpoints.admin.users.role(id)}?role=${role}`, {});
  },

  updateAdminProfile: async (data: { username: string; fullName: string }): Promise<UserProfile> => {
    return apiClient.put<UserProfile>(config.endpoints.user.profile, data);
  },

  getUserById: async (id: string | number): Promise<UserDetail> => {
    return apiClient.get<UserDetail>(config.endpoints.admin.users.detail(id));
  },

  getUserOrders: async (id: string | number, page = 0, size = 10, search = ""): Promise<PageResponse<OrderHistoryItem>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    return apiClient.get<PageResponse<OrderHistoryItem>>(`${config.endpoints.admin.users.orders(id)}?${params.toString()}`);
  },

  getUserActivity: async (id: string | number, page = 0, size = 10): Promise<PageResponse<ActivityHistoryItem>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<PageResponse<ActivityHistoryItem>>(`${config.endpoints.admin.users.activity(id)}?${params.toString()}`);
  },

  lookupUsers: async (search = ''): Promise<UserLookup[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<UserLookup[]>(`${config.endpoints.admin.users.lookup}${query}`);
  },

  getShopOwners: async (page = 0, size = 10, search = ""): Promise<PageResponse<UserListItem>> => {
    const endpoint = `${config.endpoints.admin.users.shopOwners}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
    return apiClient.get<PageResponse<UserListItem>>(endpoint);
  },
};
