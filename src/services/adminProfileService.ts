import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface AdminProfile {
  id: number;
  email: string;
  username: string | null;
  name: string | null;
  fullName: string;
  role: string;
  profileUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateAdminProfilePayload {
  fullName?: string;
  username?: string;
}

export const adminProfileService = {
  getProfile: async (): Promise<AdminProfile> => {
    return apiClient.get<AdminProfile>(config.endpoints.admin.user.profile);
  },

  updateProfile: async (
    data: UpdateAdminProfilePayload | FormData,
  ): Promise<AdminProfile> => {
    return apiClient.put<AdminProfile>(
      config.endpoints.admin.user.profile,
      data,
    );
  },
};
