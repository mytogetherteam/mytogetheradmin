import { config } from '@/config/config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponseData<T> {
  success: boolean;
  message: string;
  details?: string;
  data: T;
  status?: number;
  code?: string;
  path?: string;
  timestamp?: string;
}

interface JwtPayload {
  exp: number;
  iat?: number;
  [key: string]: unknown;
}

/** `meta` shape from Nest `ApiResponse.withPagination`. */
interface NestPaginationMeta {
  current_page: unknown;
  last_page: unknown;
  total: unknown;
  per_page: unknown;
}

function isFormDataBody(body: unknown): body is FormData {
  return (
    body instanceof FormData ||
    (body !== null && typeof body === 'object' && (body as object).constructor.name === 'FormData')
  );
}

function isSuccessEnvelope(
  value: unknown,
): value is { success: boolean; data: unknown; meta?: unknown } {
  return typeof value === 'object' && value !== null && 'success' in value && 'data' in value;
}

function isNestPaginationMeta(meta: unknown): meta is NestPaginationMeta {
  if (!meta || typeof meta !== 'object') return false;
  const m = meta as Record<string, unknown>;
  return (
    'current_page' in m &&
    'last_page' in m &&
    'total' in m &&
    'per_page' in m
  );
}

/** Maps `{ success, data: rows[], meta }` into Spring-style `PageableResponse` for list UIs. */
function pageableFromNestEnvelope<T>(rows: T[], meta: NestPaginationMeta) {
  const current_page = Number(meta.current_page);
  const last_page = Number(meta.last_page);
  const total = Number(meta.total);
  const per_page = Number(meta.per_page);
  return {
    content: rows,
    last: current_page >= last_page,
    first: current_page <= 1,
    totalElements: total,
    totalPages: last_page,
    size: per_page,
    number: Math.max(0, current_page - 1),
    numberOfElements: rows.length,
    empty: rows.length === 0,
  };
}

function unwrapJsonBody<T>(parsed: unknown): T {
  if (!isSuccessEnvelope(parsed)) {
    return parsed as T;
  }
  const { data, meta } = parsed;
  if (Array.isArray(data) && meta !== undefined && isNestPaginationMeta(meta)) {
    return pageableFromNestEnvelope(data, meta) as T;
  }
  return data as T;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private refreshPromise: Promise<void> | null = null;
  private tokenExpiryCache: number | null = null;
  private cachedTokenString: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(config.storage.tokenKey);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(config.storage.refreshTokenKey);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }


  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private decodeJwtExpiry(token: string): number | null {
    if (this.cachedTokenString !== token) {
      this.tokenExpiryCache = null;
      this.cachedTokenString = token;
    }
    if (this.tokenExpiryCache) return this.tokenExpiryCache;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const payload = JSON.parse(jsonPayload) as JwtPayload;
      const expiry = payload.exp ? payload.exp * 1000 : null;
      this.tokenExpiryCache = expiry;
      return expiry;
    } catch {
      return null;
    }
  }

  private async checkAndRefreshToken(): Promise<void> {
    const token = this.getAuthToken();
    if (!token) return;

    const expiry = this.decodeJwtExpiry(token);
    if (!expiry) return;

    const bufferTime = 5 * 60 * 1000;
    if (expiry - Date.now() < bufferTime) {
      console.log(`Token expires soon (${new Date(expiry).toLocaleTimeString()}), proactively refreshing...`);
      await this.performRefresh();
    }
  }

  private async performRefresh(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.isRefreshing = false;
      this.handleLogout();
      return;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshUrl = `${this.baseUrl}${config.endpoints.auth.refresh}`;
        const refreshResponse = await fetch(refreshUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh failed');
        }

        const responseData = await refreshResponse.json();
        const data = responseData.data || responseData;
        const newToken = data.token;
        const newRefreshToken = data.refreshToken;

        if (newToken) {
          localStorage.setItem(config.storage.tokenKey, newToken);
          if (newRefreshToken) {
            localStorage.setItem(config.storage.refreshTokenKey, newRefreshToken);
          }

          if (data.id && data.username) {
            const userProfile = {
              id: data.id,
              username: data.username,
              email: data.email,
              fullName: data.fullName,
              role: data.role,
              authorities: data.authorities || [],
            };
            localStorage.setItem(config.storage.userKey, JSON.stringify(userProfile));
          }

          console.log('Token and user data successfully refreshed');
          this.tokenExpiryCache = null;
          this.onRefreshed(newToken);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (error) {
        console.error('Critical Auth Failure: Session refresh failed', {
          error,
          timestamp: new Date().toISOString(),
          context: 'Proactive refresh or 401 retry failed',
        });
        this.handleLogout();
        this.refreshSubscribers = [];
        throw new ApiError('Session expired', 401);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/auth/refresh');

    if (!isAuthEndpoint) {
      await this.checkAndRefreshToken();
    }

    const token = this.getAuthToken();
    const headers: Record<string, string> = {};

    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    if (token && !isAuthEndpoint) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormDataBody(options.body) && options.body) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${base}${path}`;

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        if (isAuthEndpoint) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(errorData.message || 'Authentication failed', 401, errorData);
        }

        if (!this.isRefreshing) {
          await this.performRefresh();
          return this.request<T>(endpoint, options);
        }

        // If already refreshing, wait for it to finish
        return new Promise<T>((resolve, reject) => {
          this.addRefreshSubscriber(() => {
            this.request<T>(endpoint, options).then(resolve).catch(reject);
          });
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData,
        );
      }

      const text = await response.text();
      if (!text) {
        return null as unknown as T;
      }

      return unwrapJsonBody<T>(JSON.parse(text));
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error instanceof Error ? error.message : 'Network request failed');
    }
  }

  private handleLogout() {
    this.tokenExpiryCache = null;
    this.cachedTokenString = null;
    localStorage.removeItem(config.storage.tokenKey);
    localStorage.removeItem(config.storage.refreshTokenKey);
    localStorage.removeItem(config.storage.userKey);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  clearTokenCache() {
    this.tokenExpiryCache = null;
    this.cachedTokenString = null;
  }

  async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<T> {
    let url = endpoint;
    if (options?.params) {
      const query = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormDataBody(data) ? data : data != null ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormDataBody(data) ? data : data != null ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: isFormDataBody(data) ? data : data != null ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(config.apiBaseUrl);
