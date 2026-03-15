import { apiClient } from './apiClient';
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
  },

  /**
   * Login user with username/email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('Login attempt to:', config.endpoints.auth.login);
    console.log('API Base URL:', config.apiBaseUrl);
    const response = await apiClient.post<LoginResponse>(
      config.endpoints.auth.login,
      credentials
    );

    // Store token and user data
    authService.saveAuthData(response);

    return response;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      config.endpoints.auth.register,
      data
    );

    // Store token and user data after successful registration
    authService.saveAuthData(response);

    return response;
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
    return data ? JSON.parse(data) : null;
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
