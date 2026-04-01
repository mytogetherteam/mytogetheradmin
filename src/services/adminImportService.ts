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

export const adminImportService = {
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






