import { apiClient } from './apiClient';
import { config } from '@/config/config';
import {
  manageUserRoleSchema,
  manageUserSchema,
  manageUsersPageSchema,
  type EditManageUserFormValues,
  type ManageUser,
  type ManageUserAccountType,
  type ManageUserRole,
  type ManageUsersPage,
} from '@/schemas/manage-user.schema';

export type { EditManageUserFormValues, ManageUser, ManageUserAccountType };

export interface ManageUsersListParams {
  page?: number;
  size?: number;
  search?: string;
  accountType?: ManageUserAccountType | '';
}

export const manageUsersService = {
  getManageUsers: async (
    params: ManageUsersListParams = {},
  ): Promise<ManageUsersPage> => {
    const response = await apiClient.get<ManageUsersPage>(
      config.endpoints.admin.manageUsers.list,
      {
        params: {
          page: params.page ?? 1,
          size: params.size ?? 20,
          search: params.search?.trim() || undefined,
          accountType: params.accountType || undefined,
        },
      },
    );
    return manageUsersPageSchema.parse(response);
  },

  getManageUserById: async (
    accountType: ManageUserAccountType,
    id: number,
  ): Promise<ManageUser> => {
    const response = await apiClient.get<ManageUser>(
      config.endpoints.admin.manageUsers.detail(accountType, id),
    );
    return manageUserSchema.parse(response);
  },

  getRoles: async (): Promise<ManageUserRole[]> => {
    const response = await apiClient.get<ManageUserRole[]>(
      config.endpoints.admin.manageUsers.roles,
      { params: { _ts: Date.now() } },
    );
    return manageUserRoleSchema.array().parse(response);
  },

  updateManageUser: async (
    accountType: ManageUserAccountType,
    id: number,
    data: EditManageUserFormValues,
  ): Promise<ManageUser> => {
    const payload = {
      ...data,
      username: data.username?.trim() || null,
      name: data.name?.trim() || null,
      phone: data.phone?.trim() || null,
      roleId: accountType === 'admin' ? data.roleId : undefined,
      roleName: accountType === 'admin' ? data.roleName : undefined,
    };
    const response = await apiClient.put<ManageUser>(
      config.endpoints.admin.manageUsers.detail(accountType, id),
      payload,
    );
    return manageUserSchema.parse(response);
  },

  deleteManageUser: async (
    accountType: ManageUserAccountType,
    id: number,
  ): Promise<void> => {
    await apiClient.delete<void>(
      config.endpoints.admin.manageUsers.detail(accountType, id),
    );
  },
};
