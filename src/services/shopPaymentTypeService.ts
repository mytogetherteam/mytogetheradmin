import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ShopPaymentTypeDTO {
  id: number;
  shopId: number;
  paymentMethodId: number;
  paymentMethodCode: string;
  paymentMethodName: string;
  qrImageUrl?: string;
  accountNumber?: string;
  accountName?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateShopPaymentMethodRequest {
  shopId: number;
  paymentMethodId: number;
  accountName: string;
  accountNumber: string;
  displayOrder: number;
  isActive: boolean;
  qrImage?: File | null;
}

interface AdminShopPaymentMethodRow {
  shopId: number;
  paymentMethodId: number;
  accountName?: string | null;
  accountNumber?: string | null;
  displayOrder?: number | null;
  isActive?: boolean | null;
  qr?: string | null;
  paymentMethod?: {
    id: number;
    name?: string | null;
    code?: string | null;
  } | null;
}

type AdminShopPaymentMethodListResponse =
  | AdminShopPaymentMethodRow[]
  | {
      data: AdminShopPaymentMethodRow[];
      meta?: {
        total: number;
        last_page: number;
        current_page: number;
        per_page: number;
      };
    };

interface ShopPaymentTypeUpdatePayload {
  accountName?: string;
  accountNumber?: string;
  displayOrder?: number;
  isActive?: boolean;
}

function extractShopPaymentMethodRows(
  raw: AdminShopPaymentMethodListResponse,
): AdminShopPaymentMethodRow[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  const pageable = raw as { content?: AdminShopPaymentMethodRow[] };
  if (Array.isArray(pageable.content)) return pageable.content;
  return [];
}

function mapAdminShopPaymentMethodRow(
  row: AdminShopPaymentMethodRow,
): ShopPaymentTypeDTO {
  return {
    id: row.paymentMethodId,
    shopId: row.shopId,
    paymentMethodId: row.paymentMethodId,
    paymentMethodCode:
      row.paymentMethod?.code || row.paymentMethodId.toString(),
    paymentMethodName:
      row.paymentMethod?.name || `Payment Method #${row.paymentMethodId}`,
    qrImageUrl: row.qr ?? undefined,
    accountNumber: row.accountNumber ?? undefined,
    accountName: row.accountName ?? undefined,
    isActive: row.isActive ?? true,
    displayOrder: row.displayOrder ?? 0,
  };
}

function toSavePaymentMethod(
  item: ShopPaymentTypeDTO,
  qrFileIndex?: number,
) {
  return {
    paymentMethodId: item.paymentMethodId,
    accountName: item.accountName || "",
    accountNumber: item.accountNumber || "",
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    status: item.isActive,
    ...(item.qrImageUrl ? { qrImage: item.qrImageUrl } : {}),
    ...(qrFileIndex !== undefined ? { qrFileIndex } : {}),
  };
}

async function readUpdatePayload(
  formData: FormData,
): Promise<ShopPaymentTypeUpdatePayload> {
  const data = formData.get('data');
  if (!data) return {};
  const text = data instanceof Blob ? await data.text() : String(data);
  return JSON.parse(text) as ShopPaymentTypeUpdatePayload;
}

export const ShopPaymentTypeService = {
  /**
   * Get all payment types for a specific shop
   */
  getShopPaymentTypes: async (shopId: number): Promise<ShopPaymentTypeDTO[]> => {
    const endpoint = config.endpoints.admin.payment.shopPaymentMethodsByShop(shopId);
    const raw = await apiClient.get<AdminShopPaymentMethodListResponse>(endpoint, {
      params: { page: 1, size: 20 },
    });
    return extractShopPaymentMethodRows(raw).map(mapAdminShopPaymentMethodRow);
  },

  /**
   * Get a specific shop payment type by ID
   */
  getShopPaymentTypeById: async (shopId: number, id: number): Promise<ShopPaymentTypeDTO> => {
    const rows = await ShopPaymentTypeService.getShopPaymentTypes(shopId);
    const item = rows.find((row) => row.paymentMethodId === id);
    if (!item) {
      throw new Error('Shop payment type not found');
    }
    return item;
  },

  /**
   * Create a new payment type for a shop
   * Uses multipart/form-data with a 'request' JSON blob
   */
  createShopPaymentType: async (shopId: number, formData: FormData): Promise<ShopPaymentTypeDTO> => {
    const endpoint = config.endpoints.admin.payment.shopPaymentTypes(shopId);
    return apiClient.post<ShopPaymentTypeDTO>(endpoint, formData);
  },

  /**
   * Create/append payment methods for a shop.
   * Matches POST /api/admin/shop-payment-methods.
   */
  createShopPaymentMethod: async (
    request: CreateShopPaymentMethodRequest,
  ): Promise<void> => {
    const formData = new FormData();
    const paymentMethod = {
      paymentMethodId: request.paymentMethodId,
      accountName: request.accountName,
      accountNumber: request.accountNumber,
      displayOrder: request.displayOrder,
      isActive: request.isActive,
      status: request.isActive,
      ...(request.qrImage ? { qrFileIndex: 0 } : {}),
    };

    formData.append('shopId', String(request.shopId));
    formData.append('paymentMethods', JSON.stringify([paymentMethod]));
    if (request.qrImage) {
      formData.append('paymentQrImages', request.qrImage, request.qrImage.name);
    }

    await apiClient.post<void>(
      config.endpoints.admin.payment.shopPaymentMethods,
      formData,
    );
  },

  /**
   * Update an existing shop payment type
   * Uses multipart/form-data with a 'request' JSON blob
   */
  updateShopPaymentType: async (shopId: number, id: number, formData: FormData): Promise<ShopPaymentTypeDTO> => {
    const [items, updates] = await Promise.all([
      ShopPaymentTypeService.getShopPaymentTypes(shopId),
      readUpdatePayload(formData),
    ]);
    const qrImage = formData.get('qrImage');
    const nextItems = items.map((item) =>
      item.paymentMethodId === id
        ? {
            ...item,
            ...updates,
            qrImageUrl:
              qrImage instanceof File ? undefined : item.qrImageUrl,
          }
        : item,
    );
    const targetExists = nextItems.some((item) => item.paymentMethodId === id);
    if (!targetExists) {
      throw new Error('Shop payment type not found');
    }

    const replaceFormData = new FormData();
    replaceFormData.append('shopId', String(shopId));
    replaceFormData.append(
      'paymentMethods',
      JSON.stringify(
        nextItems.map((item) =>
          toSavePaymentMethod(
            item,
            item.paymentMethodId === id && qrImage instanceof File
              ? 0
              : undefined,
          ),
        ),
      ),
    );
    if (qrImage instanceof File) {
      replaceFormData.append('paymentQrImages', qrImage, qrImage.name);
    }

    await apiClient.put<void>(
      config.endpoints.admin.payment.replaceShopPaymentMethods(shopId),
      replaceFormData,
    );
    return ShopPaymentTypeService.getShopPaymentTypeById(shopId, id);
  },

  /**
   * Delete a shop payment type
   */
  deleteShopPaymentType: async (shopId: number, id: number): Promise<void> => {
    const items = await ShopPaymentTypeService.getShopPaymentTypes(shopId);
    const nextItems = items.filter((item) => item.paymentMethodId !== id);

    const replaceFormData = new FormData();
    replaceFormData.append('shopId', String(shopId));
    replaceFormData.append(
      'paymentMethods',
      JSON.stringify(nextItems.map((item) => toSavePaymentMethod(item))),
    );

    await apiClient.put<void>(
      config.endpoints.admin.payment.replaceShopPaymentMethods(shopId),
      replaceFormData,
    );
  },
};
