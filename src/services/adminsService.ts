import { config } from '@/config/config';
import { handleApiCall } from '@/lib/handleApiCall';
import { api } from '@/utils/axios';

export type PlatformAdminRole = 'SuperAdmin' | 'OperationAdmin';

export interface PlatformAdminDTO {
  id: number;
  email: string;
  username: string | null;
  name: string | null;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  role: { id: number; name: PlatformAdminRole };
}

export interface AdminsListPageDTO {
  content: PlatformAdminDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** An admin row that currently holds a live single-device session. */
export interface AdminSessionDTO {
  id: number;
  email: string;
  username: string | null;
  name: string | null;
  profileUrl: string | null;
  isActive: boolean;
  currentSessionId: string | null;
  sessionExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: { id: number; name: string };
  shops: { shop: { id: number; nameEn: string } }[];
}

export interface AdminSessionsPageDTO {
  content: AdminSessionDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
export type CreatePlatformAdminPayload = {
  email: string;
  username?: string;
  password: string;
  name?: string;
  roleName: PlatformAdminRole;
};

export type UpdatePlatformAdminPayload = {
  email?: string;
  username?: string | null;
  name?: string | null;
  password?: string;
};

/** Primary line for the trigger and list (name-focused). Always a non-empty string. */
export function adminSelectLabel(
  a: Pick<PlatformAdminDTO, 'name' | 'username' | 'email'>,
): string {
  const label = a.name?.trim() || a.username?.trim() || a.email;
  return a.username ? `${label} (${a.username})` : label;
}

export const AdminsService = {
  getAdminsPaginated: async (params: {
    page?: number;
    size?: number;
    search?: string;
    role?: PlatformAdminRole;
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
    if (params.role) {
      queryParams.set('role', params.role);
    }
    const qs = queryParams.toString();
    return handleApiCall(() => api.get(`${url}?${qs}`));
  },

  getActiveSessions: async (params: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<AdminSessionsPageDTO> => {
    const url = config.endpoints.admin.admins.sessions;
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

  forceLogout: async (id: number): Promise<AdminSessionDTO> => {
    return handleApiCall<AdminSessionDTO>(() =>
      api.post(config.endpoints.admin.admins.forceLogout(id)),
    );
  },

  getAdminById: async (id: number): Promise<PlatformAdminDTO | null> => {
    if (!Number.isFinite(id) || id < 1) return null;
    try {
      return await handleApiCall<PlatformAdminDTO>(() =>
        api.get(config.endpoints.admin.admins.detail(id)),
      );
    } catch {
      return null;
    }
  },

  createAdmin: (payload: CreatePlatformAdminPayload) =>
    handleApiCall<PlatformAdminDTO>(() =>
      api.post(config.endpoints.admin.admins.list, payload),
    ),

  updateAdmin: (id: number, payload: UpdatePlatformAdminPayload) =>
    handleApiCall<PlatformAdminDTO>(() =>
      api.put(config.endpoints.admin.admins.detail(id), payload),
    ),

  changeStatus: (id: number, isActive: boolean) =>
    handleApiCall<PlatformAdminDTO>(() =>
      api.patch(config.endpoints.admin.admins.changeStatus(id), { isActive }),
    ),

  deleteAdmin: (id: number) =>
    handleApiCall<{ message: string }>(() =>
      api.delete(config.endpoints.admin.admins.detail(id)),
    ),

  adminSelectLabel,
};
