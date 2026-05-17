import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shopFormSchema, type ShopFormValues } from '@/schemas/shop.schema';

export const defaultOperatingWeek = (): ShopFormValues['operatingHours'] => [
  { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false },
  { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false },
  { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false },
  { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false },
  { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false },
  { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false },
  { dayOfWeek: 6, openTime: '09:00', closeTime: '21:00', isClosed: false },
];

export const defaultShopFormValues: ShopFormValues = {
  nameEn: '',
  nameMm: '',
  nameTh: '',
  shopCategoryId: undefined,
  shopSubCategoryId: undefined,
  addressEn: '',
  addressMm: '',
  addressTh: '',
  districtId: undefined,
  latitude: undefined,
  longitude: undefined,
  phone: '',
  email: '',
  descriptionEn: '',
  descriptionMm: '',
  descriptionTh: '',
  deliveryEnabled: false,
  isPickUp: false,
  hasParking: false,
  hasWifi: false,
  isVerified: false,
  isActive: true,
  isHalal: false,
  isVegetarian: false,
  pricePreference: 'MEDIUM',
  enableStockCheck: false,
  cuisineTypeIds: [],
  paymentMethodIds: [],
  shopPaymentMethods: [],
  operatingHours: defaultOperatingWeek(),
  assignedAdminId: undefined,
};

/** Values used when resetting the form in create mode (after leaving edit). */
export const createModeShopFormValues: ShopFormValues = {
  ...defaultShopFormValues,
  districtId: 0,
  latitude: 0,
  longitude: 0,
};

export function useShopRestaurantForm() {
  return useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema) as Resolver<ShopFormValues>,
    /** Full-schema Zod runs on every validation; avoid doing that on each keystroke (use onTouched). */
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: defaultShopFormValues,
  });
}
