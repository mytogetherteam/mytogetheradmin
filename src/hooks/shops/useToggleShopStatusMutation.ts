import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShopService,
  type AdminShopProfileListResponse,
} from '@/services/shopService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { adminShopProfilesQueryRoot } from './adminShopProfilesQueryKeys';

export const toggleShopStatusMutationKey = ['shops', 'toggle-status'] as const;

export function useToggleShopStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...toggleShopStatusMutationKey],
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      ShopService.toggleShopStatus(id, isActive),
    onSuccess: (_data, { id, isActive }) => {
      toast.success(
        `Shop ${isActive ? 'activated' : 'deactivated'} successfully`,
      );
      queryClient.setQueriesData<AdminShopProfileListResponse | undefined>(
        { queryKey: [...adminShopProfilesQueryRoot] },
        (old) => {
          if (!old?.content) return old;
          const idx = old.content.findIndex((row) => row.id === id);
          if (idx === -1) return old;
          const nextContent = old.content.map((row, i) =>
            i === idx ? { ...row, isActive } : row,
          );
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
