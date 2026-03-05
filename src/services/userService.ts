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

// Redundant ProfileResponse removed

export const userService = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(
      config.endpoints.user.profile
    );
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    return apiClient.put<UserProfile>(
      config.endpoints.user.profile,
      data
    );
  },

  /**
   * Get all users (Admin)
   */
  getAllUsers: async (page = 0, size = 10, search = ""): Promise<any> => {
    const endpoint = `${config.endpoints.admin.users.list}?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
    return apiClient.get<any>(endpoint);
  },

  /**
   * Toggle User Status
   */
  toggleUserStatus: async (id: string, active: boolean): Promise<any> => {
    return apiClient.put<any>(`${config.endpoints.admin.users.status(id)}?active=${active}`, {});
  },

  /**
   * Update User Role
   */
  updateUserRole: async (id: string, role: string): Promise<any> => {
    return apiClient.put<any>(config.endpoints.admin.users.role(id), { role });
  },

  /**
   * Update admin profile
   */
  updateAdminProfile: async (data: { username: string; fullName: string }): Promise<any> => {
    return apiClient.put<any>(config.endpoints.user.profile, data);
  },
};
