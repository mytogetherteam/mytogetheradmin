import { useQuery } from '@tanstack/react-query';
import { ShopService } from '@/services/shopService';
import { shopOperatingHoursQueryKey } from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

export function useShopOperatingHoursQuery(shopId: number | null | undefined) {
  const id = shopId ?? 0;

  return useQuery({
    queryKey: shopOperatingHoursQueryKey(id),
    queryFn: () => ShopService.getAdminShopOperatingHours(id),
    enabled: id > 0,
  });
}
