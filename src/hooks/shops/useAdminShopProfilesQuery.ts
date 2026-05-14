import { useQuery } from '@tanstack/react-query';
import { ShopService } from '@/services/shopService';
import { adminShopProfilesQueryKey } from './adminShopProfilesQueryKeys';

export function useAdminShopProfilesQuery(
  page: number,
  size: number,
  search: string,
) {
  return useQuery({
    queryKey: adminShopProfilesQueryKey(page, size, search),
    queryFn: () =>
      ShopService.getAdminShopProfiles(
        page,
        size,
        search.trim() || undefined,
      ),
  });
}
