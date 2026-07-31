import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

/** The channel an account belongs to — KBZ Pay, AYA, … */
export interface PlatformAccountMethod {
  id: number;
  name: string;
  iconUrl: string | null;
  isActive: boolean;
}

/**
 * One of the platform owner's own accounts. This is where a shop transfers its
 * plan payment — not to be confused with ShopPaymentMethod, which is a shop's
 * account for taking customer orders.
 */
export interface PlatformPaymentAccountListItem {
  id: number;
  paymentMethodId: number;
  paymentMethod: PlatformAccountMethod;
  accountName: string;
  accountNumber: string;
  qrUrl: string | null;
  note: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPaymentAccountListParams {
  page?: number;
  size?: number;
  search?: string;
  isActive?: boolean;
  paymentMethodId?: number;
}

export interface PaginatedPlatformPaymentAccounts {
  content: PlatformPaymentAccountListItem[];
  totalElements: number;
  totalPages: number;
}

/** Fields the form collects; the QR arrives as a File, so the wire format is multipart. */
export interface PlatformPaymentAccountPayload {
  paymentMethodId: number;
  accountName: string;
  accountNumber: string;
  note?: string;
  displayOrder?: number;
  isActive?: boolean;
  /** New QR image to upload. */
  qr?: File | null;
  /** Clears the stored QR without uploading a replacement. */
  removeQr?: boolean;
}

interface NestEnvelope<T> {
  data: T[];
  meta: { total: number; last_page: number };
}

function isEnvelope<T>(value: unknown): value is NestEnvelope<T> {
  return (
    !!value &&
    typeof value === "object" &&
    "meta" in value &&
    "data" in value &&
    Array.isArray((value as { data: unknown }).data)
  );
}

function toFormData(payload: PlatformPaymentAccountPayload): FormData {
  const form = new FormData();
  form.append("paymentMethodId", String(payload.paymentMethodId));
  form.append("accountName", payload.accountName);
  form.append("accountNumber", payload.accountNumber);
  form.append("note", payload.note ?? "");
  if (payload.displayOrder !== undefined) {
    form.append("displayOrder", String(payload.displayOrder));
  }
  if (payload.isActive !== undefined) {
    form.append("isActive", String(payload.isActive));
  }
  // Only ever send one of the two: a replacement file, or the remove flag.
  if (payload.qr) {
    form.append("qr", payload.qr);
  } else if (payload.removeQr) {
    form.append("removeQr", "true");
  }
  return form;
}

export const PlatformPaymentAccountService = {
  getAccounts: async (
    params?: PlatformPaymentAccountListParams,
  ): Promise<PaginatedPlatformPaymentAccounts> => {
    const response = await handleApiCall<
      PlatformPaymentAccountListItem[] | NestEnvelope<PlatformPaymentAccountListItem>
    >(
      () =>
        api.get(config.endpoints.admin.platformPaymentAccounts.base, {
          params: {
            page: params?.page ?? 1,
            size: params?.size ?? 20,
            ...(params?.search ? { search: params.search } : {}),
            ...(params?.isActive !== undefined
              ? { isActive: params.isActive }
              : {}),
            ...(params?.paymentMethodId
              ? { paymentMethodId: params.paymentMethodId }
              : {}),
          },
        }),
      { preservePaginatedMeta: true },
    );

    if (isEnvelope<PlatformPaymentAccountListItem>(response)) {
      return {
        content: response.data,
        totalElements: response.meta.total,
        totalPages: response.meta.last_page,
      };
    }
    const list = Array.isArray(response) ? response : [];
    return { content: list, totalElements: list.length, totalPages: 1 };
  },

  getAccountById: async (
    id: number,
  ): Promise<PlatformPaymentAccountListItem> => {
    return handleApiCall<PlatformPaymentAccountListItem>(() =>
      api.get(config.endpoints.admin.platformPaymentAccounts.detail(id)),
    );
  },

  createAccount: async (
    payload: PlatformPaymentAccountPayload,
  ): Promise<PlatformPaymentAccountListItem> => {
    return handleApiCall<PlatformPaymentAccountListItem>(() =>
      api.post(
        config.endpoints.admin.platformPaymentAccounts.base,
        toFormData(payload),
      ),
    );
  },

  updateAccount: async (
    id: number,
    payload: PlatformPaymentAccountPayload,
  ): Promise<PlatformPaymentAccountListItem> => {
    return handleApiCall<PlatformPaymentAccountListItem>(() =>
      api.put(
        config.endpoints.admin.platformPaymentAccounts.detail(id),
        toFormData(payload),
      ),
    );
  },

  deleteAccount: async (id: number): Promise<void> => {
    await handleApiCall<null>(() =>
      api.delete(config.endpoints.admin.platformPaymentAccounts.detail(id)),
    );
  },

  reorderAccounts: async (ids: number[]): Promise<void> => {
    await handleApiCall<null>(() =>
      api.post(config.endpoints.admin.platformPaymentAccounts.reorder, { ids }),
    );
  },
};
