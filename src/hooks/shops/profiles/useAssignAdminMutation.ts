import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShopService } from '@/services/shopService';
import { handleApiError } from '@/lib/error-utils';
import { adminShopProfilesQueryRoot } from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

import { AdminRoleName } from '@/schemas/assignadmin.schema';

export const assignAdminMutationKey = ['shops', 'assign-admin'] as const;

export type AssignAdminVariables = {
  id: number;
  email: string;
  username?: string;
  password: string;
  name?: string;
  role: AdminRoleName;
};

export function useAssignAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...assignAdminMutationKey],
    mutationFn: ({ id, ...body }: AssignAdminVariables) =>
      ShopService.assignAdminToShop(id, body),
    onSuccess: (data, variables) => {
      const msg = data?.message || 'Admin created and assigned successfully';
      toast.success(msg);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: [...adminShopProfilesQueryRoot] }),
        queryClient.invalidateQueries({ queryKey: ['admin-shop-profile', variables.id] }),
      ]);
    },
    onError: (error) => {
      handleApiError(error, 'Failed to assign admin');
    },
    retry: false,
  });
}
