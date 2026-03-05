/**
 * Toast utility functions for user-friendly error messages
 */

/**
 * Get a user-friendly error message without exposing technical details like HTTP status codes
 * @param error - The error object
 * @param defaultMessage - Default message to show if error message contains technical details
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  defaultMessage = "An error occurred. Please try again."
): string {
  if (!(error instanceof Error)) {
    return defaultMessage;
  }

  const message = error.message;

  // Check if the message contains HTTP status codes or technical error patterns
  const technicalPatterns = [
    /\b(401|403|404|500|502|503)\b/i, // HTTP status codes
    /HTTP \d{3}/i, // HTTP status pattern
    /Network request failed/i, // Generic network errors
    /Failed to fetch/i, // Fetch errors
  ];

  // If the message contains any technical patterns, return the default message
  for (const pattern of technicalPatterns) {
    if (pattern.test(message)) {
      return defaultMessage;
    }
  }

  // If the message looks safe (doesn't contain technical details), return it
  return message;
}

/**
 * Log error details for developers (will only show in browser console)
 * @param context - Context of where the error occurred
 * @param error - The error object
 */
export function logErrorForDevelopers(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
