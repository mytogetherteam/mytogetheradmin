import { config } from '@/config/config';
import { handleApiCall } from '@/lib/handleApiCall';
import { api } from '@/utils/axios';

export interface PlatformAdminDTO {
  id: number;
  email: string;
  username: string | null;
  name: string | null;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  role: { id: number; name: string };
}

export interface AdminsListPageDTO {
  content: PlatformAdminDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** Primary line for the trigger and list (name-focused). Always a non-empty string. */
export function adminSelectLabel(a: PlatformAdminDTO): string {
  return `${a.name} (${a.username})`;
}

export const AdminsService = {
  getAdminsPaginated: async (params: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<AdminsListPageDTO> => {
    const url = config.endpoints.admin.admins.list;
    const queryParams = new URLSearchParams();
    const page = params.page ?? 1;
    const size = params.size ?? 20;
    queryParams.set('page', String(page));
    queryParams.set('size', String(size));
    if (params.search?.trim()) {
      queryParams.set('search', params.search.trim());
    }
    const qs = queryParams.toString();
    return handleApiCall(() => api.get(`${url}?${qs}`));
  },

  adminSelectLabel,
};
