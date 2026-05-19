import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShopService } from '@/services/shopService';
import { handleApiError } from '@/lib/error-utils';
import {
  adminShopProfilesQueryRoot,
  shopRestaurantEditQueryKey,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

export const unassignAdminMutationKey = ['shops', 'unassign-admin'] as const;

export function useUnassignAdminMutation(shopId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...unassignAdminMutationKey, shopId],
    mutationFn: (adminId: number) =>
      ShopService.unassignAdminFromShop(shopId, adminId),
    onSuccess: (data) => {
      const msg = data?.message || 'Admin unassigned successfully';
      toast.success(msg);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: [...adminShopProfilesQueryRoot] }),
        queryClient.invalidateQueries({ queryKey: ['admin-shop-profile', shopId] }),
        queryClient.invalidateQueries({ queryKey: [...shopRestaurantEditQueryKey(shopId)] }),
      ]);
    },
    onError: (error) => {
      handleApiError(error, 'Failed to unassign admin');
    },
    retry: false,
  });
}
