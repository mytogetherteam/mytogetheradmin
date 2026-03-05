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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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

      if (response.status === 401 && !endpoint.includes('/refresh')) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const refreshToken = this.getRefreshToken();

          if (!refreshToken) {
            this.isRefreshing = false;
            this.handleLogout();
            throw new ApiError('Session expired', 401);
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

            const data = await refreshResponse.json();
            const newToken = data.data?.token || data.token;
            const newRefreshToken = data.data?.refreshToken || data.refreshToken;

            if (newToken) {
              localStorage.setItem(config.storage.tokenKey, newToken);
              if (newRefreshToken) {
                localStorage.setItem(config.storage.refreshTokenKey, newRefreshToken);
              }
              
              this.isRefreshing = false;
              this.onRefreshed(newToken);
              
              // Retry the original request
              return this.request<T>(endpoint, options);
            } else {
              throw new Error('Invalid refresh response');
            }
          } catch (error) {
            this.isRefreshing = false;
            this.handleLogout();
            throw new ApiError('Session expired', 401);
          }
        }

        // If already refreshing, wait for it to finish
        return new Promise<T>((resolve) => {
          this.addRefreshSubscriber((newToken) => {
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
