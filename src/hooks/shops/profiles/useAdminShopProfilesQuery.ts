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
  categoryId?: number,
  isActive?: boolean,
  isVerified?: boolean,
  includes: AdminShopProfileListIncludes = adminShopProfilesManageListIncludes,
) {
  return useQuery({
    queryKey: adminShopProfilesQueryKey(page, size, search, categoryId, isActive, isVerified, includes),
    queryFn: () =>
      ShopService.getAdminShopProfiles(
        page,
        size,
        search.trim() || undefined,
        categoryId,
        isActive,
        isVerified,
        includes,
      ),
  });
}
