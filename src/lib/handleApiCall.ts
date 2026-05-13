import axios from 'axios';

import { ApiError } from '@/services/apiClient';
import { getHumanMessageFromNestHttpBody } from '@/lib/nestHttpBody';

/**
 * Runs an axios-style request, maps HTTP / Nest errors to {@link ApiError},
 * and unwraps `{ success, data }` response bodies when present.
 */
export async function handleApiCall<T>(
  requestFn: () => Promise<{ data: unknown }>,
): Promise<T> {
  let json: unknown;
  try {
    const { data } = await requestFn();
    json = data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const rawBody = error.response?.data;
      const httpStatus = error.response?.status;
      const nestedCode =
        rawBody &&
        typeof rawBody === 'object' &&
        'statusCode' in rawBody &&
        typeof (rawBody as { statusCode?: unknown }).statusCode === 'number'
          ? (rawBody as { statusCode: number }).statusCode
          : undefined;
      const status = httpStatus ?? nestedCode;

      const message =
        getHumanMessageFromNestHttpBody(rawBody) ||
        (error.response?.statusText
          ? `${error.response.status} ${error.response.statusText}`
          : '') ||
        error.message ||
        'Request failed';

      throw new ApiError(message.trim(), status, rawBody);
    }
    throw new ApiError(error instanceof Error ? error.message : 'Request failed');
  }

  if (json && typeof json === 'object') {
    const body = json as Record<string, unknown>;
    if ('success' in body && body.success === false) {
      throw new ApiError(
        (typeof body.message === 'string' ? body.message.trim() : '') || 'Request failed',
        undefined,
        json,
      );
    }
    if ('data' in body && 'success' in body) {
      return body.data as T;
    }
  }

  return json as T;
}
