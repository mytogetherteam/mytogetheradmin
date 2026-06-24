import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShopService,
  type AdminShopProfileListResponse,
} from '@/services/shopService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import {
  adminShopProfilesQueryRoot,
  shopRestaurantEditQueryKey,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';
import type { ShopRestaurantEditBundle } from '@/hooks/shops/restaurant-form/mutations';

export const toggleShopStatusMutationKey = ['shops', 'toggle-status'] as const;

export type ToggleShopStatusVariables = {
  id: number;
  isActive: boolean;
  isVerified?: boolean;
  taxEnable?: boolean;
  successToast?: string;
};

export function useToggleShopStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...toggleShopStatusMutationKey],
    mutationFn: (vars: ToggleShopStatusVariables) => {
      const { id, isActive, isVerified, taxEnable } = vars;
      return ShopService.toggleShopStatus(id, { isActive, isVerified, taxEnable });
    },
    onSuccess: (_data, variables) => {
      if (variables.successToast) {
        toast.success(variables.successToast);
      } else {
        toast.success(
          `Shop ${variables.isActive ? 'activated' : 'deactivated'} successfully`,
        );
      }
      queryClient.setQueriesData<AdminShopProfileListResponse | undefined>(
        { queryKey: [...adminShopProfilesQueryRoot] },
        (old) => {
          if (!old?.content) return old;
          const idx = old.content.findIndex((row) => row.id === variables.id);
          if (idx === -1) return old;
          const nextContent = old.content.map((row, i) => {
            if (i !== idx) return row;
            const next = { ...row, isActive: variables.isActive };
            if (variables.isVerified !== undefined) {
              next.isVerified = variables.isVerified;
            }
            if (variables.taxEnable !== undefined) {
              next.taxEnable = variables.taxEnable;
            }
            return next;
          });
          return { ...old, content: nextContent };
        },
      );

      // Keep edit form cache in sync (list toggles use a 5m staleTime query elsewhere).
      queryClient.setQueryData<ShopRestaurantEditBundle | undefined>(
        shopRestaurantEditQueryKey(variables.id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            shop: {
              ...old.shop,
              isActive: variables.isActive,
              ...(variables.isVerified !== undefined
                ? { isVerified: variables.isVerified }
                : {}),
              ...(variables.taxEnable !== undefined
                ? { taxEnable: variables.taxEnable }
                : {}),
            },
            formValues: {
              ...old.formValues,
              isActive: variables.isActive,
              ...(variables.isVerified !== undefined
                ? { isVerified: variables.isVerified }
                : {}),
              ...(variables.taxEnable !== undefined
                ? { taxEnable: variables.taxEnable }
                : {}),
            },
          };
        },
      );
      void queryClient.invalidateQueries({
        queryKey: shopRestaurantEditQueryKey(variables.id),
      });
    },
    onError: (error) => {
      handleApiError(error, 'Failed to toggle shop status');
    },
    retry: false,
  });
}
