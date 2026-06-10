import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShopService } from '@/services/shopService';
import { handleApiError } from '@/lib/error-utils';
import {
  adminShopProfilesQueryRoot,
  shopRestaurantEditQueryKey,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

export const updateShopAdminMutationKey = ['shops', 'update-admin'] as const;

export type UpdateShopAdminVariables = {
  adminId: number;
  email?: string;
  username?: string;
  password?: string;
  name?: string;
};

export function useUpdateShopAdminMutation(shopId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...updateShopAdminMutationKey, shopId],
    mutationFn: ({ adminId, ...body }: UpdateShopAdminVariables) =>
      ShopService.updateShopAdmin(shopId, adminId, body),
    onSuccess: (data) => {
      const msg = data?.message || 'Admin updated successfully';
      toast.success(msg);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: [...adminShopProfilesQueryRoot] }),
        queryClient.invalidateQueries({ queryKey: ['admin-shop-profile', shopId] }),
        queryClient.invalidateQueries({ queryKey: [...shopRestaurantEditQueryKey(shopId)] }),
      ]);
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update admin');
    },
    retry: false,
  });
}
