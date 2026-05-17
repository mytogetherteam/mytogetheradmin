import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShopService,
  type AdminShopProfileListResponse,
} from '@/services/shopService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { adminShopProfilesQueryRoot } from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

export const toggleShopStatusMutationKey = ['shops', 'toggle-status'] as const;

export type ToggleShopStatusVariables = {
  id: number;
  isActive: boolean;
  isVerified?: boolean;
  successToast?: string;
};

export function useToggleShopStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...toggleShopStatusMutationKey],
    mutationFn: (vars: ToggleShopStatusVariables) => {
      const { id, isActive, isVerified } = vars;
      return ShopService.toggleShopStatus(id, { isActive, isVerified });
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
            return next;
          });
          return { ...old, content: nextContent };
        },
      );
    },
    onError: (error) => {
      handleApiError(error, 'Failed to toggle shop status');
    },
    retry: false,
  });
}
