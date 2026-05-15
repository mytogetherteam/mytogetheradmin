import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShopService } from '@/services/shopService';
import { handleApiError } from '@/lib/error-utils';
import type { OperatingHoursFormValues } from '@/schemas/operatingHours.schema';
import {
  shopOperatingHoursQueryKey,
  shopOperatingHoursQueryRoot,
  shopRestaurantEditQueryKey,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';
import { buildOperatingHoursUpdateFormData } from './operatingHoursForm';

export const updateShopOperatingHoursMutationKey = [
  'admin',
  'shop-profile',
  'operating-hours',
  'update',
] as const;

export function useUpdateShopOperatingHoursMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...updateShopOperatingHoursMutationKey],
    mutationFn: ({
      shopId,
      operatingHours,
    }: {
      shopId: number;
      operatingHours: OperatingHoursFormValues['operatingHours'];
    }) =>
      ShopService.updateShop(
        shopId,
        buildOperatingHoursUpdateFormData(operatingHours),
      ),
    onSuccess: async (_data, { shopId }) => {
      toast.success('Operating hours updated');
      await queryClient.invalidateQueries({
        queryKey: shopOperatingHoursQueryKey(shopId),
      });
      await queryClient.invalidateQueries({
        queryKey: [...shopOperatingHoursQueryRoot],
      });
      await queryClient.invalidateQueries({
        queryKey: [...shopRestaurantEditQueryKey(shopId)],
      });
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update operating hours');
    },
    retry: false,
  });
}
