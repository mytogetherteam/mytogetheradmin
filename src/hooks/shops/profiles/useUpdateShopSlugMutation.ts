import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShopService } from '@/services/shopService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import {
  adminShopProfilesQueryRoot,
  shopRestaurantEditQueryKey,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

export const updateShopSlugMutationKey = ['shops', 'update-slug'] as const;

export type UpdateShopSlugVariables = {
  id: number;
  slug: string;
  shopName: string;
};

export function useUpdateShopSlugMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...updateShopSlugMutationKey],
    mutationFn: async ({ id, slug }: UpdateShopSlugVariables) => {
      const formData = new FormData();
      formData.append('slug', slug);
      return ShopService.updateShop(id, formData);
    },
    onSuccess: (_data, variables) => {
      const saved = variables.slug.trim();
      toast.success(
        saved
          ? `Slug saved for ${variables.shopName}`
          : `Slug cleared for ${variables.shopName}`,
      );

      void queryClient.invalidateQueries({
        queryKey: [...adminShopProfilesQueryRoot],
      });
      void queryClient.invalidateQueries({
        queryKey: shopRestaurantEditQueryKey(variables.id),
      });
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update shop slug');
    },
    retry: false,
  });
}
