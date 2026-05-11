import { toast } from "sonner";
import { ApiError } from "@/services/apiClient";
import { getHumanMessageFromNestHttpBody } from "@/lib/nestHttpBody";

function statusLabel(code: number | undefined): string {
  if (code === undefined) return "";
  if (code === 422) return "validation";
  if (code === 401 || code === 403) return "auth";
  if (code === 400 || code === 428) return "request";
  if (code >= 500) return "server";
  return "error";
}

export function handleApiError(error: unknown, defaultTitle = "Something went wrong") {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    const code = error.status;
    const body = error.data;

    const fromBody =
      body !== undefined && body !== null
        ? getHumanMessageFromNestHttpBody(body).trim()
        : "";
    const text = error.message?.trim() || fromBody || defaultTitle;

    /** Skip technical status line for validation — user only needs field messages. */
    const slab =
      code != null && code !== 422
        ? `HTTP ${code} (${statusLabel(code)})`
        : "";

    toast.error(`${defaultTitle}${slab ? ` — ${slab}` : ""}`, {
      description: text,
      duration: code === 422 ? 8500 : 6500,
    });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  toast.error(defaultTitle, {
    description: message,
    duration: 5000,
  });
}
