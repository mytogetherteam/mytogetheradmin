import { useQuery } from '@tanstack/react-query';
import { ShopService } from '@/services/shopService';
import {
  adminShopProfilesManageListIncludes,
  adminShopProfilesQueryKey,
  type AdminShopProfileListIncludes,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

export function useAdminShopProfilesQuery(
  page: number,
  size: number,
  search: string,
  includes: AdminShopProfileListIncludes = adminShopProfilesManageListIncludes,
) {
  return useQuery({
    queryKey: adminShopProfilesQueryKey(page, size, search, includes),
    queryFn: () =>
      ShopService.getAdminShopProfiles(
        page,
        size,
        search.trim() || undefined,
        includes,
      ),
  });
}
