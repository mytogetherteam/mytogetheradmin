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
}

export interface RegisterResponse extends LoginResponse {}

export interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export const authService = {
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
      })
    );

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
      })
    );

    return response;
  },

  /**
   * Logout user and clear stored data
   */
  logout: (): void => {
    localStorage.removeItem(config.storage.tokenKey);
    localStorage.removeItem(config.storage.refreshTokenKey);
    localStorage.removeItem(config.storage.userKey);
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
    return !!authService.getToken();
  },
};
