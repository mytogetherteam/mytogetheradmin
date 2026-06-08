import { config } from "@/config/config";
import { ApiError } from "@/services/apiClient";

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem(config.storage.tokenKey);
}

function buildUrl(endpoint: string): string {
  // In dev mode, apiBaseUrl is empty string - use relative URL for Vite proxy
  // In prod mode, apiBaseUrl is the full URL
  return config.apiBaseUrl ? `${config.apiBaseUrl}${endpoint}` : endpoint;
}

/** Nest `TransformInterceptor` wraps `{ success: true, data, message }` around many controllers. */
function unwrapApiSuccessEnvelope(json: unknown): unknown {
  if (
    json &&
    typeof json === "object" &&
    "success" in json &&
    (json as { success?: unknown }).success === true &&
    "data" in json
  ) {
    return (json as { data: unknown }).data;
  }
  return json;
}

function formatNestImportError(status: number, data: unknown): string {
  if (data === null || data === undefined) return `Request failed (${status})`;
  if (typeof data === "string")
    return data.length > 800 ? `${data.slice(0, 800)}…` : data;

  const o = data as Record<string, unknown>;

  let head = "";
  const m = o.message;
  if (Array.isArray(m)) head = m.map(String).join("; ");
  else if (typeof m === "string") head = m;
  else head = `Validation failed (${status})`;

  const nestedMsg =
    m && typeof m === "object" && !Array.isArray(m)
      ? (m as Record<string, unknown>)
      : null;
  const errors = Array.isArray(o.errors)
    ? o.errors
    : nestedMsg && Array.isArray(nestedMsg.errors)
      ? nestedMsg.errors
      : [];
  const errLines = errors
    .map((e: unknown) => {
      if (e && typeof e === "object" && "detail" in e && "code" in e)
        return `${String((e as { code: unknown }).code)}: ${String((e as { detail: unknown }).detail)}`;
      try {
        return JSON.stringify(e);
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  if (errLines.length) {
    head += `\n${errLines.map((line) => `• ${line}`).join("\n")}`;
  }

  return head;
}

export type ShopOnboardingImportMetadata = {
  adminEmail: string;
  /** Required when persist (dryRun false). Omit or empty during dry-run. */
  adminPassword?: string;
  adminUsername?: string;
  dryRun?: boolean;
  /**
   * When `false`, skips server-side upsert of rows from the ReferenceData sheet before import.
   * Omit or `true` to let the API seed missing shop_category / cuisine / master_category / payment_method / district rows.
   */
  bootstrapReference?: boolean;
};

/** Response from GET `/admin/shop-profile/import/onboarding-reference-lists` — used to fill template ReferenceData. */
export type OnboardingReferenceTemplateLists = {
  shopCategories: string[];
  cuisineTypes: string[];
  masterMenuCategories: string[];
  yesNo: string[];
  dayOfWeek: string[];
  mealTypes: string[];
  paymentTypes: string[];
  districts: string[];
};

/** Mirror of the API `ParsedShopExcelBundle`. Use for the JSON onboarding endpoint. */
export interface ShopOnboardingBundle {
  profile: Record<string, string>;
  menuCategories: Array<{
    menuNameEn: string;
    menuNameMm?: string;
    menuNameTh?: string;
    masterCategoryKeyHint?: string;
  }>;
  menuItems: Array<{
    groupingNameEn: string;
    itemNameEn: string;
    itemNameMm?: string;
    itemNameTh?: string;
    price: number;
    isAvailable?: boolean;
    isPopular?: boolean;
    isVegetarian?: boolean;
    isSpicy?: boolean;
    isHotDeal?: boolean;
    isRecommended?: boolean;
    mealTypes: string[];
    imageUrl?: string;
  }>;
  variants: Array<{
    itemNameEn: string;
    variantNameEn: string;
    variantNameMm?: string;
    variantNameTh?: string;
    price: number;
  }>;
  toppings: Array<{
    itemNameEn: string;
    toppingNameEn: string;
    toppingNameMm?: string;
    toppingNameTh?: string;
    toppingPrice?: number;
  }>;
  operatingHours: Array<{
    dayLabel: string;
    openFraction?: number;
    closeFraction?: number;
    isClosed?: boolean;
  }>;
  payments: Array<{
    paymentType?: string;
    accountName?: string;
    accountNumber?: string;
    qrImageHint?: string;
  }>;
  referenceRows: Array<{
    shop_category?: string;
    cuisine_type?: string;
    master_menu_category?: string;
    yes_no?: string;
    day_of_week?: string;
    meal_type?: string;
    payment_type?: string;
    district?: string;
  }>;
}

export const adminImportService = {
  /**
   * NestJS shop onboarding workbook (matches `docs/ADMIN_SHOP_EXCEL_IMPORT.md` /
   * sample `ShopProfile`, `MenuCategories`, `MenuItems`, … sheets).
   */
  importShopProfileOnboardingExcel: async (
    file: File,
    meta: ShopOnboardingImportMetadata,
  ): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "metadata",
      JSON.stringify({
        adminEmail: meta.adminEmail.trim(),
        adminPassword: (meta.adminPassword ?? "").trim(),
        adminUsername: meta.adminUsername?.trim() || undefined,
        dryRun: meta.dryRun === true,
        ...(meta.bootstrapReference === false ? { bootstrapReference: false } : {}),
      }),
    );

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = buildUrl(config.endpoints.admin.shopProfile.importOnboardingExcel);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      const msg = formatNestImportError(response.status, data);
      throw new ApiError(msg, response.status, data);
    }

    const json = await parseJsonSafe(response);
    return unwrapApiSuccessEnvelope(json);
  },

  /** SuperAdmin. Active taxonomy from DB for onboarding template ReferenceData sample rows. */
  fetchOnboardingReferenceTemplateLists: async (): Promise<OnboardingReferenceTemplateLists> => {
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = buildUrl(config.endpoints.admin.shopProfile.onboardingReferenceLists);
    const response = await fetch(url, { method: "GET", headers });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      const msg = formatNestImportError(response.status, data);
      throw new ApiError(msg, response.status, data);
    }

    const json = await parseJsonSafe(response);
    return unwrapApiSuccessEnvelope(json) as OnboardingReferenceTemplateLists;
  },

  /**
   * JSON-only onboarding entry (no file upload). Posts a `ShopOnboardingBundle`
   * directly to `/api/admin/shop-profile/import/json`. Useful when the parsed
   * bundle is generated client-side (e.g. SheetJS) or after manual edits.
   *
   * Same metadata fields as `importShopProfileOnboardingExcel`. Server behavior:
   * 1. Bootstraps missing ReferenceData rows (unless `bootstrapReference:false`).
   * 2. Validates FKs (shop_category, district, cuisines).
   * 3. Persists shop + menu (when `dryRun:false`).
   */
  importShopProfileOnboardingJson: async (
    bundle: ShopOnboardingBundle,
    meta: ShopOnboardingImportMetadata,
  ): Promise<unknown> => {
    const payload = {
      adminEmail: meta.adminEmail.trim(),
      adminPassword: (meta.adminPassword ?? "").trim() || undefined,
      adminUsername: meta.adminUsername?.trim() || undefined,
      dryRun: meta.dryRun === true,
      ...(meta.bootstrapReference === false ? { bootstrapReference: false } : {}),
      bundle,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = buildUrl(config.endpoints.admin.shopProfile.importOnboardingJson);

    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      const msg = formatNestImportError(response.status, data);
      throw new ApiError(msg, response.status, data);
    }

    const json = await parseJsonSafe(response);
    return unwrapApiSuccessEnvelope(json);
  },

  /** @deprecated Prefer `importShopProfileOnboardingExcel` if backend exposes legacy route only */
  importShopsExcel: async (file: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = buildUrl(config.endpoints.admin.import.shopsExcel);
    console.log('[Import] Uploading shops to:', url);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? String((data as { message: unknown }).message)
          : `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(message, response.status, data);
    }

    return await parseJsonSafe(response);
  },

  importActivityExcel: async (file: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = buildUrl(config.endpoints.admin.import.activityExcel);
    console.log('[Import] Uploading activity to:', url);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? String((data as { message: unknown }).message)
          : `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(message, response.status, data);
    }

    return await parseJsonSafe(response);
  },

  importSingleShopExcel: async (file: File): Promise<{
    success: boolean;
    message?: string;
    data?: {
      successCount?: number;
      failureCount?: number;
      errors?: Array<{ row: number; message: string }>;
    };
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = buildUrl(config.endpoints.admin.import.singleShopExcel);
    console.log('[Import] Uploading single shop to:', url);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const data = await parseJsonSafe(response);
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? String((data as { message: unknown }).message)
          : `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(message, response.status, data);
    }

    const data = await parseJsonSafe(response);
    return data as {
      success: boolean;
      message?: string;
      data?: {
        successCount?: number;
        failureCount?: number;
        errors?: Array<{ row: number; message: string }>;
      };
    };
  },
};






