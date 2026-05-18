import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { PageableResponse } from "@/components/ui/infinite-searchable-select";
import {
  ShopService,
  Shop,
  mapAdminShopProfileRowToShop,
} from "@/services/shopService";
import {
  adminShopProfilesQueryKey,
} from "@/hooks/shops/shared/adminShopProfilesQueryKeys";

const adminShopProfilesDropdownIncludes = {
  withDistrict: true,
} as const;

export type AdminShopProfileDropdownShop = Shop & {
  dropdownLabel: string;
  [key: string]: unknown;
};

function mapRowToDropdownShop(
  row: Parameters<typeof mapAdminShopProfileRowToShop>[0],
): AdminShopProfileDropdownShop {
  const shop = mapAdminShopProfileRowToShop(row);
  const shopName = shop.nameEn || shop.nameMm || shop.name || `Shop #${shop.id}`;
  const districtName =
    (typeof shop.district === "object" ? shop.district?.nameEn : undefined) ||
    shop.districtEn ||
    shop.districtMm ||
    shop.districtTh;

  return {
    ...shop,
    dropdownLabel: districtName ? `${shopName} (${districtName})` : shopName,
  };
}

/** Infinite-select fetcher for admin shop profiles with labels for dropdowns. */
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
          undefined,
          undefined,
          undefined,
          adminShopProfilesDropdownIncludes,
        ),
        queryFn: () =>
          ShopService.getAdminShopProfiles(
            apiPage,
            size,
            trimmedSearch || undefined,
            undefined,
            undefined,
            undefined,
            adminShopProfilesDropdownIncludes,
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
