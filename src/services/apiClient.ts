import { config } from '@/config/config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
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

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private refreshPromise: Promise<void> | null = null;
  private tokenExpiryCache: number | null = null;

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
    this.refreshSubscribers.map((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private decodeJwtExpiry(token: string): number | null {
    if (this.tokenExpiryCache) return this.tokenExpiryCache;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
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

    // Refresh if expiring in less than 2 minutes
    const bufferTime = 2 * 60 * 1000;
    const now = Date.now();
    
    if (expiry - now < bufferTime) {
      console.log(`Token expires soon (${new Date(expiry).toLocaleTimeString()}), proactively refreshing...`);
      return this.performRefresh();
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
                  authorities: data.authorities || []
              };
              localStorage.setItem(config.storage.userKey, JSON.stringify(userProfile));
          }
          
          console.log('Token and user data successfully refreshed');
          this.tokenExpiryCache = null; // Clear cache for new token
          this.onRefreshed(newToken);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch {
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const isFormData = (body: unknown): body is FormData => {
      return body instanceof FormData || (body !== null && typeof body === 'object' && body.constructor.name === 'FormData');
    };

    const isAuthEndpoint = endpoint.includes('/auth/login') || 
                          endpoint.includes('/auth/register') || 
                          endpoint.includes('/auth/refresh');

    // Skip proactive refresh for the refresh endpoint itself
    if (!endpoint.includes('/refresh')) {
      await this.checkAndRefreshToken();
    }

    const token = this.getAuthToken();
    const headers: Record<string, string> = {};

    // Merge with any existing headers from options
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.assign(headers, existingHeaders);
    }

    // Only add Authorization header if it's not an auth endpoint
    if (token && !isAuthEndpoint) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set Content-Type based on body type:
    // - FormData: let browser set it (with boundary)
    // - JSON body: set application/json
    // - No body (e.g. DELETE, GET): omit Content-Type entirely
    if (isFormData(options.body)) {
      // No Content-Type — browser will set multipart/form-data with boundary
    } else if (options.body) {
      headers['Content-Type'] = 'application/json';
    }
    // else: no body → no Content-Type header

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 errors
      if (response.status === 401) {
        // If it's an auth endpoint, don't try to refresh, just throw
        if (isAuthEndpoint) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || 'Authentication failed',
            401,
            errorData
          );
        }

        // For other endpoints, try to refresh
        if (!this.isRefreshing) {
          await this.performRefresh();
          // Retry the original request
          return this.request<T>(endpoint, options);
        }

        // If already refreshing, wait for it to finish
        return new Promise<T>((resolve) => {
          this.addRefreshSubscriber(() => {
            resolve(this.request<T>(endpoint, options));
          });
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const text = await response.text();
      if (!text) {
        return null as unknown as T;
      }
      
      const data = JSON.parse(text);

      // Automatically unwrap if it's a standard ApiResponseData
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data.data;
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network request failed'
      );
    }
  }

  private handleLogout() {
    this.tokenExpiryCache = null;
    localStorage.removeItem(config.storage.tokenKey);
    localStorage.removeItem(config.storage.refreshTokenKey);
    localStorage.removeItem(config.storage.userKey);
    // Use window.location as a fallback to force redirect if not in a react context
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const isFormData = (body: unknown): body is FormData => {
      return body instanceof FormData || (body !== null && typeof body === 'object' && body.constructor.name === 'FormData');
    };
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData(data) ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const isFormData = (body: unknown): body is FormData => {
      return body instanceof FormData || (body !== null && typeof body === 'object' && body.constructor.name === 'FormData');
    };
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData(data) ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(config.apiBaseUrl);
