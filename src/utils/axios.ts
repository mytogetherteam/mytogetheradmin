import axios from 'axios';
import { config } from '@/config/config';

/**
 * Shared Axios instance for REST calls against the backend.
 * Uses the same base URL semantics as apiClient (`''` in dev → Vite proxy).
 */
export const api = axios.create({
  baseURL: config.apiBaseUrl === '' ? undefined : config.apiBaseUrl,
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

api.interceptors.request.use((req) => {
  const token = localStorage.getItem(config.storage.tokenKey);
  const path = req.url ?? '';
  const skipBearer =
    path.includes('/auth/login') ||
    path.includes('/auth/register') ||
    path.includes('/auth/refresh');
  if (token && !skipBearer && !req.headers.Authorization) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});
