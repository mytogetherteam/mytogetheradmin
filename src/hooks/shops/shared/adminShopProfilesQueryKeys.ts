/** Root key: matches all admin shop-profile list queries for cache updates. */
export const adminShopProfilesQueryRoot = ['admin', 'shop-profiles'] as const;

/** Edit form: full shop payload for create/edit screen (TanStack Query). */
export const shopRestaurantEditQueryRoot = ['admin', 'shop-profile', 'edit-form'] as const;

export type AdminShopProfileListIncludes = {
  withOperationHours?: boolean;
  withCity?: boolean;
  withDistrict?: boolean;
  withGalleries?: boolean;
  withShopCategory?: boolean;
};

/** Relations needed by Manage Shop/Restaurant table. */
export const adminShopProfilesManageListIncludes: AdminShopProfileListIncludes =
  {
    withCity: true,
    withDistrict: true,
    withShopCategory: true,
  };

/** Shop rows only — no joined relations (e.g. operating-hours picker). */
export const adminShopProfilesBareListIncludes: AdminShopProfileListIncludes =
  {};

export function shopRestaurantEditQueryKey(shopId: number) {
  return [...shopRestaurantEditQueryRoot, shopId] as const;
}

export function adminShopProfilesQueryKey(
  page: number,
  size: number,
  search: string,
  includes: AdminShopProfileListIncludes = adminShopProfilesManageListIncludes,
) {
  return [...adminShopProfilesQueryRoot, { page, size, search, includes }] as const;
}

export const shopOperatingHoursQueryRoot = [
  'admin',
  'shop-profile',
  'operating-hours',
] as const;

export function shopOperatingHoursQueryKey(shopId: number) {
  return [...shopOperatingHoursQueryRoot, shopId] as const;
}
