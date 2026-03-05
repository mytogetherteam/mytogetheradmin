export const config = {
  apiBaseUrl: import.meta.env.DEV 
    ? ''  // Use empty string for dev (Vite proxy handles it)
    : import.meta.env.VITE_API_BASE_URL || 'https://mytogether-mytogether.up.railway.app',
  endpoints: {
    auth: {
      login: '/api/admin/auth/login',
      register: '/api/admin/auth/register',
    },
    admin: {
      import: {
        shopsExcel: '/api/admin/import/shops/excel',
      },
    },
    shops: {
      list: '/api/admin/shops',
      detail: (id: number) => `/api/admin/shops/${id}`,
      categories: '/api/admin/setup/shop-form-data',
    },
    user: {
      profile: '/api/admin/profile',
      detail: (id: number) => `/api/admin/users/${id}`,
    },
  },
  storage: {
    tokenKey: 'auth_token',
    userKey: 'user_data',
  },
} as const;
