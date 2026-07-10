import { api } from "@/utils/axios";

export interface ShopGroup {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

export interface ShopGroupMember {
  id: number;
  shopGroupId: number;
  shopId: number;
  createdAt: string;
  shop?: {
    id: number;
    nameEn: string;
    nameMm: string | null;
    phone: string | null;
  };
}

export const shopGroupService = {
  getGroups: async (): Promise<ShopGroup[]> => {
    const { data } = await api.get<ShopGroup[]>("/admin/groups/shops");
    return data;
  },

  createGroup: async (name: string): Promise<ShopGroup> => {
    const { data } = await api.post<ShopGroup>("/admin/groups/shops", { name });
    return data;
  },

  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/admin/groups/shops/${id}`);
  },

  getGroupMembers: async (groupId: number): Promise<ShopGroupMember[]> => {
    const { data } = await api.get<ShopGroupMember[]>(`/admin/groups/shops/${groupId}/members`);
    return data;
  },

  addShopToGroup: async (groupId: number, shopId: number): Promise<ShopGroupMember> => {
    const { data } = await api.post<ShopGroupMember>(`/admin/groups/shops/${groupId}/members`, { shopId });
    return data;
  },

  removeShopFromGroup: async (groupId: number, shopId: number): Promise<void> => {
    await api.delete(`/admin/groups/shops/${groupId}/members/${shopId}`);
  },
};
