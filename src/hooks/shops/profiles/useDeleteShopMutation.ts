import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShopService } from '@/services/shopService';
import { handleApiError } from '@/lib/error-utils';
import { adminShopProfilesQueryRoot } from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

export const deleteShopMutationKey = ['shops', 'delete'] as const;

export type DeleteShopVariables = {
  id: number;
  name: string;
};

export function useDeleteShopMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...deleteShopMutationKey],
    mutationFn: ({ id }: DeleteShopVariables) => ShopService.deleteShop(id),
    onSuccess: () => {
      toast.success('Shop deleted');
      void queryClient.invalidateQueries({ queryKey: [...adminShopProfilesQueryRoot] });
    },
    onError: (error) => {
      handleApiError(error, 'Failed to delete shop');
    },
    retry: false,
  });
}
