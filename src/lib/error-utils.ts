import { toast } from "sonner";
import { ApiError } from "@/services/apiClient";

/**
 * Handles API errors by displaying a toast with the error message and details.
 * @param error The error object to handle.
 * @param defaultTitle A fallback title if the error doesn't contain a message.
 */
export function handleApiError(error: unknown, defaultTitle: string = "An error occurred") {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    const errorData = error.data as any;
    const message = errorData?.message || error.message || defaultTitle;
    const details = errorData?.details || null;

    toast.error(message, {
      description: details,
      duration: 5000,
    });
    return;
  }

  // Generic Error handling
  const message = error instanceof Error ? error.message : String(error);
  toast.error(defaultTitle, {
    description: message,
    duration: 4000,
  });
}
