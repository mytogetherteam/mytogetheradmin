import { apiClient, ApiError } from './apiClient';
import { config } from '@/config/config';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  authorities: string[];
}

export type RegisterResponse = LoginResponse;

export interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  authorities: string[];
}

interface AdminLoginPayload {
  token?: string;
  refreshToken?: string;
  id?: number;
  email?: string;
  name?: string | null;
  fullName?: string | null;
  username?: string;
  role?: string;
  authorities?: string[];
}

const decodeJwtExpiry = (token: string): number | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload) as { exp: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

/** Backend JWT roles → Admin Panel RBAC roles (`ADMIN` is Super Admin). */
const mapBackendRole = (role: string | undefined): string => {
  switch (role) {
    case 'SuperAdmin':
    case 'MASTER_ADMIN':
      return 'ADMIN';
    case 'OperationAdmin':
      return 'ADMIN_OPS';
    default:
      return role || 'ADMIN';
  }
};

const toLoginResponse = (payload: AdminLoginPayload): LoginResponse => {
  const email = payload.email ?? '';
  const fullName = payload.fullName || payload.name || email || 'Admin';
  const username =
    payload.username ||
    (email.includes('@') ? email.split('@')[0] : email) ||
    String(payload.id ?? '');
  const role = mapBackendRole(payload.role);

  return {
    token: payload.token ?? '',
    type: 'Bearer',
    refreshToken: payload.refreshToken ?? '',
    id: payload.id ?? 0,
    username,
    email,
    fullName,
    role,
    authorities: payload.authorities?.length ? payload.authorities : [role],
  };
};

export const authService = {
  /**
   * Helper to store authentication data
   */
  saveAuthData: (response: LoginResponse): void => {
    localStorage.setItem(config.storage.tokenKey, response.token);
    localStorage.setItem(config.storage.refreshTokenKey, response.refreshToken);
    localStorage.setItem(
      config.storage.userKey,
      JSON.stringify({
        id: response.id,
        username: response.username,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
        authorities: response.authorities || [],
      })
    );
    apiClient.clearTokenCache();
  },

  /**
   * Login user with username/email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const payload = await apiClient.post<AdminLoginPayload>(
      config.endpoints.auth.login,
      {
        emailOrUsername: credentials.usernameOrEmail,
        password: credentials.password,
      }
    );

    if (!payload?.token) {
      throw new ApiError('Login failed', 401, payload);
    }

    const mapped = toLoginResponse(payload);
    authService.saveAuthData(mapped);
    return mapped;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const payload = await apiClient.post<AdminLoginPayload>(
      config.endpoints.auth.register,
      data
    );
    if (!payload?.token) {
      throw new ApiError('Registration failed', 401, payload);
    }
    const mapped = toLoginResponse(payload);
    authService.saveAuthData(mapped);
    return mapped;
  },

  /**
   * Logout user and clear stored data
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post(config.endpoints.auth.logout);
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem(config.storage.tokenKey);
      localStorage.removeItem(config.storage.refreshTokenKey);
      localStorage.removeItem(config.storage.userKey);
      apiClient.clearTokenCache();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  },

  /**
   * Get stored authentication token
   */
  getToken: (): string | null => {
    return localStorage.getItem(config.storage.tokenKey);
  },

  /**
   * Get stored refresh token
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem(config.storage.refreshTokenKey);
  },

  /**
   * Get stored user data
   */
  getUserData: (): UserData | null => {
    const data = localStorage.getItem(config.storage.userKey);
    return data ? (JSON.parse(data) as UserData) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = authService.getToken();
    if (!token) return false;

    const expiry = decodeJwtExpiry(token);
    if (!expiry) return false;

    return Date.now() < expiry;
  },
};
