/** Root key: matches all admin shop-profile list queries for cache updates. */
export const adminShopProfilesQueryRoot = ['admin', 'shop-profiles'] as const;

export function adminShopProfilesQueryKey(
  page: number,
  size: number,
  search: string,
) {
  return [...adminShopProfilesQueryRoot, { page, size, search }] as const;
}
