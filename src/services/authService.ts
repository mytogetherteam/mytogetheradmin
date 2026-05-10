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

// const decodeJwtExpiry = (token: string): number | null => {
//   try {
//     const base64Url = token.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(
//       atob(base64)
//         .split('')
//         .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
//         .join('')
//     );
//     const payload = JSON.parse(jsonPayload) as { exp: number };
//     return payload.exp ? payload.exp * 1000 : null;
//   } catch {
//     return null;
//   }
// };

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
    // Clear the apiClient's expiry cache so it decodes the NEW token's expiry
    // apiClient.clearTokenCache();
  },

  /**
   * Login user with username/email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('Login attempt mocked for:', credentials.usernameOrEmail);
    const mockResponse: LoginResponse = {
      token: 'mock-token',
      type: 'Bearer',
      refreshToken: 'mock-refresh-token',
      id: 1,
      username: credentials.usernameOrEmail,
      email: `${credentials.usernameOrEmail}@example.com`,
      fullName: 'Mock Admin',
      role: 'ADMIN',
      authorities: ['ROLE_ADMIN']
    };
    authService.saveAuthData(mockResponse);
    return mockResponse;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const mockResponse: RegisterResponse = {
      token: 'mock-token',
      type: 'Bearer',
      refreshToken: 'mock-refresh-token',
      id: 1,
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      role: 'ADMIN',
      authorities: ['ROLE_ADMIN']
    };
    authService.saveAuthData(mockResponse);
    return mockResponse;
  },

  /**
   * Logout user and clear stored data
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem(config.storage.tokenKey);
    localStorage.removeItem(config.storage.refreshTokenKey);
    localStorage.removeItem(config.storage.userKey);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },

  /**
   * Get stored authentication token
   */
  getToken: (): string | null => {
    return 'mock-token';
  },

  /**
   * Get stored refresh token
   */
  getRefreshToken: (): string | null => {
    return 'mock-refresh-token';
  },

  /**
   * Get stored user data
   */
  getUserData: (): UserData | null => {
    return {
      id: 1,
      username: 'mockadmin',
      email: 'mockadmin@example.com',
      fullName: 'Mock Admin',
      role: 'ADMIN',
      authorities: ['ROLE_ADMIN']
    };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return true;
  },
};
