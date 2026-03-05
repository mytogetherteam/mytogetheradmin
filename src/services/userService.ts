import { apiClient, ApiResponseData } from './apiClient';
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

// Redundant ProfileResponse removed

export const userService = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponseData<UserProfile>>(
      config.endpoints.user.profile
    );
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiClient.put<ApiResponseData<UserProfile>>(
      config.endpoints.user.profile,
      data
    );
    return response.data;
  },

  /**
   * Get all users (Admin)
   */
  getAllUsers: async (page = 0, size = 10, search = ""): Promise<any> => {
    const endpoint = `/api/admin/users?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
    const response = await apiClient.get<ApiResponseData<any>>(endpoint);
    return response.data;
  },

  /**
   * Update admin profile
   */
  updateAdminProfile: async (data: { username: string; fullName: string }): Promise<any> => {
    const response = await apiClient.put<ApiResponseData<any>>('/api/admin/profile', data);
    return response.data;
  },
};
