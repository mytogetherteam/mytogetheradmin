import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PageableResponse } from '@/components/ui/infinite-searchable-select';
import {
  ShopService,
  Shop,
  mapAdminShopProfileRowToShop,
} from '@/services/shopService';
import {
  adminShopProfilesBareListIncludes,
  adminShopProfilesQueryKey,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';

export type AdminShopProfileDropdownShop = Shop & {
  dropdownLabel: string;
  [key: string]: unknown;
};

function mapRowToDropdownShop(
  row: Parameters<typeof mapAdminShopProfileRowToShop>[0],
): AdminShopProfileDropdownShop {
  const shop = mapAdminShopProfileRowToShop(row);
  return {
    ...shop,
    dropdownLabel:
      shop.nameEn || shop.nameMm || shop.name || `Shop #${shop.id}`,
  };
}

/** Infinite-select fetcher for bare admin shop profiles (no relations). */
export function useAdminShopProfilesBareInfiniteFetcher() {
  const queryClient = useQueryClient();

  const fetchShops = useCallback(
    async (
      page: number,
      size: number,
      search: string,
    ): Promise<PageableResponse<AdminShopProfileDropdownShop>> => {
      const apiPage = page + 1;
      const trimmedSearch = search.trim();
      const response = await queryClient.fetchQuery({
        queryKey: adminShopProfilesQueryKey(
          apiPage,
          size,
          trimmedSearch,
          adminShopProfilesBareListIncludes,
        ),
        queryFn: () =>
          ShopService.getAdminShopProfiles(
            apiPage,
            size,
            trimmedSearch || undefined,
            adminShopProfilesBareListIncludes,
          ),
      });

      return {
        content: (response.content || []).map(mapRowToDropdownShop),
        last:
          apiPage >= response.totalPages ||
          (response.content?.length ?? 0) === 0,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        size: response.size,
        number: page,
      };
    },
    [queryClient],
  );

  return { fetchShops };
}
