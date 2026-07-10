import { config } from '@/config/config';
import { getHumanMessageFromNestHttpBody } from '@/lib/nestHttpBody';
import { ApiError, apiClient } from '@/services/apiClient';
import { api } from '@/utils/axios';
import { adminLoginApiResponseSchema } from '@/schemas/admin-login.schema';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserData,
} from '@/interfaces/auth/auth.interface';

export type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserData };

function mapAdminPayloadToLoginResponse(
  credentials: LoginRequest,
  data: {
    token: string;
    refreshToken: string;
    id: number;
    email: string;
    role: string;
    name?: string | null;
    fullName?: string | null;
  }
): LoginResponse {
  const fullName =
    (data.fullName && data.fullName.trim()) ||
    (data.name && data.name.trim()) ||
    credentials.usernameOrEmail.trim() ||
    data.email.split('@')[0] ||
    'Admin';

  const guessedUsername = data.email.includes('@')
    ? data.email.split('@')[0]!
    : credentials.usernameOrEmail.trim();

  return {
    token: data.token,
    type: 'Bearer',
    refreshToken: data.refreshToken,
    id: data.id,
    username: guessedUsername,
    email: data.email,
    fullName,
    role: data.role,
    authorities: [`ROLE_${data.role}`],
  };
}

export const authService = {
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

  /** Update cached user profile without touching auth tokens. */
  updateUserData: (patch: Partial<UserData>): void => {
    const current = authService.getUserData();
    if (!current) return;
    const next: UserData = { ...current, ...patch };
    localStorage.setItem(config.storage.userKey, JSON.stringify(next));
    useAuthStore.getState().setUser(next);
  },

  /**
   * Platform admin login — maps to Nest `POST /api/admin/auth/login` (emailOrUsername + password).
   */
  adminLogin: async (credentials: LoginRequest): Promise<LoginResponse> => {
    let json: unknown;
    try {
      const { data } = await api.post<unknown>(config.endpoints.auth.login, {
        emailOrUsername: credentials.usernameOrEmail.trim(),
        password: credentials.password,
      });
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

        let message = '';
        const business = adminLoginApiResponseSchema.safeParse(rawBody);
        if (
          business.success &&
          !business.data.success &&
          'message' in business.data &&
          business.data.message
        ) {
          message = business.data.message.trim();
        } else {
          message =
            getHumanMessageFromNestHttpBody(rawBody) ||
            (error.response?.statusText
              ? `${error.response.status} ${error.response.statusText}`
              : '') ||
            error.message ||
            'Login request failed';
        }

        throw new ApiError(message.trim(), status, rawBody);
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Login request failed',
      );
    }

    const parsed = adminLoginApiResponseSchema.safeParse(json);
    if (!parsed.success) {
      const hintFromBody = json && typeof json === 'object' ? getHumanMessageFromNestHttpBody(json).trim() : '';
      const codeFromBody =
        json &&
          typeof json === 'object' &&
          'statusCode' in json &&
          typeof (json as { statusCode?: unknown }).statusCode === 'number'
          ? (json as { statusCode: number }).statusCode
          : undefined;
      throw new ApiError(hintFromBody || 'Unexpected login response', codeFromBody, json);
    }
    const body = parsed.data;
    if (!body.success) {
      throw new ApiError(
        body.message?.trim() || 'Unable to sign in',
        undefined,
        json,
      );
    }

    const mapped = mapAdminPayloadToLoginResponse(credentials, body.data);
    authService.saveAuthData(mapped);
    useAuthStore.getState().setUser({
      id: mapped.id,
      username: mapped.username,
      email: mapped.email,
      fullName: mapped.fullName,
      role: mapped.role,
      authorities: mapped.authorities,
    });
    return mapped;
  },

  /**
   * @deprecated Prefer `adminLogin` + typed flows; kept as alias for callers that still say `login`.
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> =>
    authService.adminLogin(credentials),

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
      authorities: ['ROLE_ADMIN'],
    };
    authService.saveAuthData(mockResponse);
    useAuthStore.getState().setUser({
      id: mockResponse.id,
      username: mockResponse.username,
      email: mockResponse.email,
      fullName: mockResponse.fullName,
      role: mockResponse.role,
      authorities: mockResponse.authorities,
    });
    return mockResponse;
  },

  logout: async (): Promise<void> => {
    useAuthStore.getState().clearAuth();
    apiClient.clearTokenCache();
    localStorage.removeItem(config.storage.tokenKey);
    localStorage.removeItem(config.storage.refreshTokenKey);
    localStorage.removeItem(config.storage.userKey);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem(config.storage.tokenKey);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(config.storage.refreshTokenKey);
  },

  /** Parsed `user_key` only — for first paint before Zustand persist rehydrates. */
  getUserProfileFromStorageOnly: (): UserData | null => {
    const raw = localStorage.getItem(config.storage.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserData;
    } catch {
      return null;
    }
  },

  getUserData: (): UserData | null => {
    const fromStore = useAuthStore.getState().user;
    if (fromStore) return fromStore;
    return authService.getUserProfileFromStorageOnly();
  },

  isAuthenticated: (): boolean => {
    return Boolean(localStorage.getItem(config.storage.tokenKey));
  },
};
