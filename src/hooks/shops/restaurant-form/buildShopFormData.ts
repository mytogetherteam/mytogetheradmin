import type { ShopFormValues } from '@/schemas/shop.schema';

export type AdminShopProfileFormFields = {
  nameEn: string;
  nameMm: string;
  nameTh: string;
  shopCategoryId?: number | null;
  shopSubCategoryId: number | null;
  addressEn?: string;
  addressMm: string;
  addressTh: string;
  districtId?: number;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  descriptionEn: string;
  descriptionMm: string;
  descriptionTh: string;
  deliveryEnabled: boolean;
  isPickUp: boolean;
  hasParking: boolean;
  hasWifi: boolean;
  isVerified: boolean;
  isActive: boolean;
  taxEnable: boolean;
  cityId: number | null;
  isHalal: boolean;
  isVegetarian: boolean;
  pricePreference: string;
  enableStockCheck: boolean;
  cuisineTypeIds: number[];
  shopPaymentMethods: ShopFormValues['shopPaymentMethods'];
  operatingHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
  adminEmail?: string;
  adminUsername?: string;
  adminPassword?: string;
  adminConfirmPassword?: string;
};

/** Form fields for POST /api/admin/shop-profile — must match CreateAdminShopProfileDto (multipart). */
export function appendCreateAdminShopProfileFields(
  fd: FormData,
  p: AdminShopProfileFormFields,
) {
  fd.append('nameEn', p.nameEn ?? '');
  fd.append('nameMm', p.nameMm);
  fd.append('nameTh', p.nameTh);
  if (p.shopCategoryId != null && p.shopCategoryId > 0) {
    fd.append('shopCategoryId', String(p.shopCategoryId));
  }
  if (p.shopSubCategoryId != null && p.shopSubCategoryId > 0) {
    fd.append('shopSubCategoryId', String(p.shopSubCategoryId));
  }
  if (p.addressEn) fd.append('addressEn', p.addressEn);
  fd.append('addressMm', p.addressMm);
  fd.append('addressTh', p.addressTh);
  if (p.districtId != null && p.districtId > 0) {
    fd.append('districtId', String(p.districtId));
  }
  if (p.latitude != null && p.latitude !== 0) {
    fd.append('latitude', String(p.latitude));
  }
  if (p.longitude != null && p.longitude !== 0) {
    fd.append('longitude', String(p.longitude));
  }
  fd.append('phone', p.phone);
  if (p.email) fd.append('email', p.email);
  fd.append('descriptionEn', p.descriptionEn);
  fd.append('descriptionMm', p.descriptionMm);
  fd.append('descriptionTh', p.descriptionTh);
  fd.append('deliveryEnabled', String(p.deliveryEnabled));
  fd.append('isPickUp', String(p.isPickUp));
  fd.append('hasParking', String(p.hasParking));
  fd.append('hasWifi', String(p.hasWifi));
  fd.append('isVerified', String(p.isVerified));
  fd.append('isActive', String(p.isActive));
  fd.append('taxEnable', String(p.taxEnable));
  if (p.cityId != null && p.cityId > 0) {
    fd.append('cityId', String(p.cityId));
  }
  fd.append('isHalal', String(p.isHalal));
  fd.append('isVegetarian', String(p.isVegetarian));
  fd.append('pricePreference', p.pricePreference || 'MEDIUM');
  fd.append('enableStockCheck', String(p.enableStockCheck));
  fd.append('cuisineTypeIds', JSON.stringify(p.cuisineTypeIds ?? []));
  const paymentQrFiles: File[] = [];
  const shopPaymentMethods = (p.shopPaymentMethods ?? []).map((method) => {
    const qrFile = method.qrFile instanceof File ? method.qrFile : undefined;
    const qrFileIndex = qrFile ? paymentQrFiles.push(qrFile) - 1 : undefined;

    return {
      paymentMethodId: method.paymentMethodId,
      accountName: method.accountName || undefined,
      accountNumber: method.accountNumber || undefined,
      displayOrder: method.displayOrder ?? 0,
      status: method.isActive ?? true,
      qrImage: method.qr || undefined,
      ...(qrFileIndex !== undefined ? { qrFileIndex } : {}),
    };
  });
  fd.append('shopPaymentMethods', JSON.stringify(shopPaymentMethods));
  paymentQrFiles.forEach((file) => {
    fd.append('paymentQrImages', file);
  });
  fd.append('operatingHours', JSON.stringify(p.operatingHours ?? []));
  if (p.adminEmail) {
    fd.append('adminEmail', p.adminEmail);
  }
  if (p.adminUsername) {
    fd.append('adminUsername', p.adminUsername);
  }
  if (p.adminPassword) {
    fd.append('adminPassword', p.adminPassword);
  }
}

export function shopFormValuesToAdminProfileFields(
  data: ShopFormValues,
  cityId: number | null,
): AdminShopProfileFormFields {
  return {
    nameEn: data.nameEn ?? '',
    nameMm: data.nameMm || '',
    nameTh: data.nameTh || '',
    shopCategoryId: data.shopCategoryId,
    shopSubCategoryId: data.shopSubCategoryId ?? null,
    addressEn: data.addressEn,
    addressMm: data.addressMm || '',
    addressTh: data.addressTh || '',
    districtId: data.districtId ?? undefined,
    latitude: data.latitude,
    longitude: data.longitude,
    phone: data.phone || '',
    email: data.email || '',
    descriptionEn: data.descriptionEn || '',
    descriptionMm: data.descriptionMm || '',
    descriptionTh: data.descriptionTh || '',
    deliveryEnabled: data.deliveryEnabled ?? false,
    isPickUp: data.isPickUp ?? false,
    hasParking: data.hasParking ?? false,
    hasWifi: data.hasWifi ?? false,
    isVerified: data.isVerified ?? false,
    isActive: data.isActive ?? true,
    taxEnable: data.taxEnable ?? true,
    cityId,
    isHalal: data.isHalal ?? false,
    isVegetarian: data.isVegetarian ?? false,
    pricePreference: data.pricePreference || 'MEDIUM',
    enableStockCheck: data.enableStockCheck ?? false,
    cuisineTypeIds: data.cuisineTypeIds,
    shopPaymentMethods: data.shopPaymentMethods,
    operatingHours: data.operatingHours,
    adminEmail: data.adminEmail,
    adminUsername: data.adminUsername,
    adminPassword: data.adminPassword,
    adminConfirmPassword: data.adminConfirmPassword,
  };
}

export function buildShopRestaurantSubmitFormData(
  data: ShopFormValues,
  options: {
    cityId: number | null;
    logoFile?: File | null;
    coverFile?: File | null;
    galleryFiles: File[];
  },
): FormData {
  const formData = new FormData();
  appendCreateAdminShopProfileFields(
    formData,
    shopFormValuesToAdminProfileFields(data, options.cityId),
  );
  if (options.logoFile) {
    formData.append('logoPhoto', options.logoFile);
  }
  if (options.coverFile) {
    formData.append('coverPhoto', options.coverFile);
  }
  options.galleryFiles.forEach((file) => {
    formData.append('galleryPhotos', file);
  });
  return formData;
}
