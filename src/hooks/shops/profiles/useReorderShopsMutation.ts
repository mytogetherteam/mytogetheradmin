import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShopService,
  type AdminShopProfileListItem,
  type AdminShopProfileListResponse,
} from '@/services/shopService';
import { handleApiError } from '@/lib/error-utils';
import { adminShopProfilesQueryRoot } from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

type ReorderShopsVariables = {
  ids: number[];
  queryKey: readonly unknown[];
  nextContent: AdminShopProfileListItem[];
};

type ReorderShopsContext = {
  previous?: AdminShopProfileListResponse;
  queryKey: readonly unknown[];
};

/**
 * Persist a drag-reorder of the shop list. Optimistically rewrites the current
 * page's cached order, rolls back on error, and revalidates on settle.
 */
export function useReorderShopsMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, ReorderShopsVariables, ReorderShopsContext>({
    mutationFn: (vars) => ShopService.reorderShops(vars.ids),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: vars.queryKey });
      const previous = queryClient.getQueryData<AdminShopProfileListResponse>(
        vars.queryKey,
      );
      queryClient.setQueryData<AdminShopProfileListResponse>(
        vars.queryKey,
        (old) => (old ? { ...old, content: vars.nextContent } : old),
      );
      return { previous, queryKey: vars.queryKey };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      handleApiError(error, 'Failed to update shop order');
    },
    onSuccess: () => {
      toast.success('Shop order updated');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminShopProfilesQueryRoot });
    },
  });
}
