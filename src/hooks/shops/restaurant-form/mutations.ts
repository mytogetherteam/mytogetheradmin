import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ShopFormValues } from '@/schemas/shop.schema';
import {
  ShopService,
  type ShopDetail,
  type CuisineTypeDTO,
  type ShopSubCategoryDTO,
  type ShopProfileOperatingHour,
  type ShopCuisineAssignment,
} from '@/services/shopService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';
import {
  adminShopProfilesQueryRoot,
  shopRestaurantEditQueryKey,
} from '@/hooks/shops/shared/adminShopProfilesQueryKeys';
import { ShopCategoryService, type ShopSubCategoryDTO as AdminShopSubCategoryDTO } from '@/services/shopCategoryService';
import { adminSelectLabel, type PlatformAdminDTO } from '@/services/adminsService';
import { defaultOperatingWeek } from './useShopRestaurantForm';

function mapNestedCuisineToDto(
  c: NonNullable<ShopCuisineAssignment['cuisineType']>,
): CuisineTypeDTO {
  const nameEn = c.nameEn ?? undefined;
  return {
    id: c.id,
    name: nameEn ?? c.nameMm ?? c.nameTh ?? undefined,
    nameEn,
    nameMm: c.nameMm ?? undefined,
    nameTh: c.nameTh ?? undefined,
    imageUrl: c.imageUrl ?? undefined,
    regionId: c.regionId ?? undefined,
    regionName:
      c.region && typeof c.region === 'object'
        ? (c.region.name ?? undefined)
        : undefined,
  };
}

function cuisineTypesFromAdminShopProfile(shop: ShopDetail): CuisineTypeDTO[] {
  const rows = shop.shopCuisines;
  if (rows?.length) {
    return [...rows]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((r) => (r.cuisineType ? mapNestedCuisineToDto(r.cuisineType) : null))
      .filter((x): x is CuisineTypeDTO => x != null);
  }
  return shop.cuisineTypes?.length ? [...shop.cuisineTypes] : [];
}

function mapAdminSubToShopSub(s: AdminShopSubCategoryDTO): ShopSubCategoryDTO {
  const nameEn = s.nameEn ?? s.name ?? '';
  return {
    id: s.id,
    name: s.name ?? nameEn,
    nameEn,
    nameMm: s.nameMm ?? '',
    nameTh: s.nameTh ?? '',
    imageUrl: s.imageUrl,
    isActive: s.active ?? true,
    categoryId: s.categoryId,
    displayOrder: s.displayOrder ?? 0,
  };
}

/** Load subcategory row for labels when API shop profile omits `subCategories`. */
async function enrichShopForEditLabels(
  shop: ShopDetail,
  shopSubCategoryId: number | undefined,
): Promise<ShopDetail> {
  if (!shopSubCategoryId) return shop;
  const subs = shop.shopCategory?.subCategories;
  if (subs?.some((x) => x.id === shopSubCategoryId)) {
    return { ...shop, shopSubCategoryId };
  }

  const sub = await ShopCategoryService.getShopSubCategoryById(shopSubCategoryId).catch(() => null);
  if (!sub) return shop;

  const subDto = mapAdminSubToShopSub(sub);
  const subLabel = subDto.nameEn || subDto.nameMm || subDto.name;
  const existingSubs = shop.shopCategory?.subCategories ?? [];
  const mergedSubs = [subDto, ...existingSubs.filter((x) => x.id !== subDto.id)];

  return {
    ...shop,
    shopSubCategoryId,
    subCategory: shop.subCategory ?? subLabel,
    shopCategory: shop.shopCategory
      ? {
          ...shop.shopCategory,
          subCategories: mergedSubs,
        }
      : {
          id: sub.categoryId,
          name: '',
          nameEn: '',
          nameMm: '',
          active: true,
          subCategories: [subDto],
        },
  };
}

export const createShopMutationKey = ['shops', 'create'] as const;
export const updateShopMutationKey = ['shops', 'update'] as const;

function padTimePart(n: number) {
  return String(Number.isFinite(n) ? n : 0).padStart(2, '0');
}

function mapPrismaOperatingHoursToForm(
  rows: ShopProfileOperatingHour[] | undefined,
): ShopFormValues['operatingHours'] {
  if (!rows?.length) return defaultOperatingWeek();
  return rows.map((oh) => ({
    dayOfWeek: oh.dayOfWeek,
    openTime: `${padTimePart(oh.openTimeHour ?? 9)}:${padTimePart(oh.openTimeMin ?? 0)}`,
    closeTime: `${padTimePart(oh.closeTimeHour ?? 21)}:${padTimePart(oh.closeTimeMin ?? 0)}`,
    isClosed: oh.isClosed ?? false,
  }));
}

export type ShopRestaurantEditBundle = {
  shop: ShopDetail;
  formValues: ShopFormValues;
  forMedia: {
    logoUrl?: string | null;
    coverUrl?: string | null;
    primaryPhotoUrl?: string | null;
    photos?: { url?: string; thumbnailUrl?: string }[];
  };
  /** Resolved label for AsyncSelect when editing (from shop profile `adminShops[].admin`). */
  initialAssignedAdminLabel: string | null;
};

export async function fetchShopRestaurantEditBundle(
  numericShopId: number,
): Promise<ShopRestaurantEditBundle> {
  if (!Number.isFinite(numericShopId) || numericShopId < 1) {
    throw new Error('Invalid shop ID');
  }

  const shop: ShopDetail = await ShopService.getAdminShopProfileById(numericShopId);
  const operatingHoursForForm = mapPrismaOperatingHoursToForm(
    shop.operatingHours?.filter(
      (oh): oh is ShopProfileOperatingHour => 'openTimeHour' in oh,
    ),
  );

  const shopCategoryId = shop.categoryId ?? undefined;

  const shopSubCategoryId = shop.subCategoryId ?? undefined;

  const cuisineTypesJoined = cuisineTypesFromAdminShopProfile(shop);
  const cuisineIdsRaw = cuisineTypesJoined.length > 0 ? cuisineTypesJoined.map((c) => c.id): [];

  const assignedAdminId = shop.adminShops?.[0]?.adminId ?? undefined;

  const shopForLabels = await enrichShopForEditLabels(shop, shopSubCategoryId);
  const embeddedAdmin = shop.adminShops?.[0]?.admin;

  const initialAssignedAdminLabel: string | null = embeddedAdmin
    ? adminSelectLabel({
        id: embeddedAdmin.id ?? assignedAdminId ?? 0,
        email: embeddedAdmin.email ?? '',
        name: embeddedAdmin.name,
        username: embeddedAdmin.username,
        isActive: true,
        roleId: 0,
        createdAt: '',
        updatedAt: '',
        role: { id: 0, name: '' },
      } as PlatformAdminDTO)
    : null;

  const enrichedShop: ShopDetail = {
    ...shopForLabels,
    cuisineTypes:
      cuisineTypesJoined.length > 0 ? cuisineTypesJoined : shopForLabels.cuisineTypes,
    shopSubCategoryId: shopSubCategoryId ?? shopForLabels.shopSubCategoryId,
  };

  const formValues: ShopFormValues = {
    nameEn: shop.nameEn || shop.nameMm || '',
    nameMm: shop.nameMm || shop.nameEn || '',
    nameTh: shop.nameTh || '',
    shopCategoryId,
    shopSubCategoryId,
    addressEn: shop.address || shop.addressEn || shop.addressMm || '',
    addressMm: shop.addressMm || shop.address || '',
    addressTh: shop.addressTh || '',
    districtId: shop.districtId || undefined,
    latitude: shop.latitude || undefined,
    longitude: shop.longitude || undefined,
    phone: shop.phone || '',
    email: shop.email || '',
    descriptionEn: shop.descriptionEn || '',
    descriptionMm: shop.descriptionMm || '',
    descriptionTh: shop.descriptionTh || '',
    deliveryEnabled: shop.deliveryEnabled ?? false,
    isPickUp: shop.isPickUp ?? false,
    hasParking: shop.hasParking ?? false,
    hasWifi: shop.hasWifi ?? false,
    isVerified: shop.isVerified ?? false,
    isActive: shop.isActive ?? true,
    isHalal: shop.isHalal ?? false,
    isVegetarian: shop.isVegetarian ?? false,
    pricePreference: shop.pricePreference || 'MEDIUM',
    enableStockCheck: shop.enableStockCheck ?? false,
    cuisineTypeIds:
      cuisineIdsRaw.length > 0
        ? cuisineIdsRaw
        : (enrichedShop.cuisineTypes?.map((c) => c.id) ?? []),
    paymentMethodIds: [],
    operatingHours: operatingHoursForForm,
    assignedAdminId,
  };

  const forMedia = {
    logoUrl: shop.logoUrl,
    coverUrl: shop.coverUrl,
    primaryPhotoUrl: shop.primaryPhotoUrl,
    photos:
      shop.photos ??
      shop.galleries?.map((g) => ({
        url: g.imageUrl ?? undefined,
      })),
  };

  return { shop: enrichedShop, formValues, forMedia, initialAssignedAdminLabel };
}

/** TanStack Query: load shop profile for the create/edit form. */
export function useShopRestaurantEditQuery(numericEditId: number | null) {
  return useQuery({
    queryKey: shopRestaurantEditQueryKey(numericEditId ?? 0),
    queryFn: () => fetchShopRestaurantEditBundle(numericEditId!),
    enabled: numericEditId !== null,
    retry: false,
  });
}

export function useCreateShopMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...createShopMutationKey],
    mutationFn: (formData: FormData) => ShopService.createShop(formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminShopProfilesQueryRoot] });
      toast.success('Shop created successfully!');
      navigate('/shops/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create shop');
    },
    retry: false,
  });
}

export function useUpdateShopMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...updateShopMutationKey],
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      ShopService.updateShop(id, formData),
    onSuccess: (_data, variables) => {
      toast.success('Shop updated successfully!');
      navigate('/shops/manage');
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: [...adminShopProfilesQueryRoot] }),
        queryClient.invalidateQueries({ queryKey: [...shopRestaurantEditQueryKey(variables.id)] }),
      ]);
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update shop');
    },
    retry: false,
  });
}
