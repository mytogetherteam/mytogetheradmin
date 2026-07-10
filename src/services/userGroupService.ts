import { api } from "@/utils/axios";

export interface UserGroup {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

export interface UserGroupMember {
  id: number;
  userGroupId: number;
  userId: number;
  createdAt: string;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export const userGroupService = {
  getGroups: async (): Promise<UserGroup[]> => {
    const { data } = await api.get<UserGroup[]>("/api/admin/groups/users");
    return data;
  },

  createGroup: async (name: string): Promise<UserGroup> => {
    const { data } = await api.post<UserGroup>("/api/admin/groups/users", { name });
    return data;
  },

  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/groups/users/${id}`);
  },

  getGroupMembers: async (groupId: number): Promise<UserGroupMember[]> => {
    const { data } = await api.get<UserGroupMember[]>(`/api/admin/groups/users/${groupId}/members`);
    return data;
  },

  addUserToGroup: async (groupId: number, userId: number): Promise<UserGroupMember> => {
    const { data } = await api.post<UserGroupMember>(`/api/admin/groups/users/${groupId}/members`, { userId });
    return data;
  },

  removeUserFromGroup: async (groupId: number, userId: number): Promise<void> => {
    await api.delete(`/api/admin/groups/users/${groupId}/members/${userId}`);
  },
};
