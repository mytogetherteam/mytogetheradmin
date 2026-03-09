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
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to decode JWT:', error);
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
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.addRefreshSubscriber(() => resolve());
      });
    }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.isRefreshing = false;
      this.handleLogout();
      return;
    }

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

        // Synchronize user data if present in response
        if (data.id && data.username) {
            const userProfile = {
                id: data.id,
                username: data.username,
                email: data.email,
                fullName: data.fullName,
                role: data.role
            };
            localStorage.setItem(config.storage.userKey, JSON.stringify(userProfile));
        }
        
        console.log('Token and user data successfully refreshed');
        this.isRefreshing = false;
        this.onRefreshed(newToken);
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch {
      this.isRefreshing = false;
      this.handleLogout();
      throw new ApiError('Session expired', 401);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Skip proactive refresh for the refresh endpoint itself
    if (!endpoint.includes('/refresh')) {
      await this.checkAndRefreshToken();
    }

    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge with any existing headers from options
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.assign(headers, existingHeaders);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // If body is FormData, let the browser set the Content-Type with boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if ((response.status === 401 || response.status === 403) && !endpoint.includes('/refresh')) {
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

      const data = await response.json();

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
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(config.apiBaseUrl);
