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

export const adminImportService = {
  importShopsExcel: async (file: File): Promise<unknown> => {
    const formData = new FormData();
    // If Swagger uses a different field name, change "file" here.
    formData.append("file", file);

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = `${config.apiBaseUrl}${config.endpoints.admin.import.shopsExcel}`;
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

    const url = `${config.apiBaseUrl}${config.endpoints.admin.import.activityExcel}`;
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
};






