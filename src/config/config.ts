export const config = {
  apiBaseUrl: import.meta.env.DEV 
    ? ''  // Use empty string for dev (Vite proxy handles it)
    : import.meta.env.VITE_API_BASE_URL || 'https://mytogether-mytogether.up.railway.app',
  endpoints: {
    auth: {
      login: '/api/admin/auth/login',
      register: '/api/admin/auth/register',
      refresh: '/api/admin/auth/refresh',
    },
    admin: {
      import: {
        shopsExcel: '/api/admin/import/shops/excel',
      },
      auditLogs: '/api/admin/audit-logs',
      payment: {
        shopFormData: '/api/admin/setup/shop-form-data',
        cities: '/api/admin/setup/cities',
        districts: '/api/admin/setup/districts',
        cuisineTypes: '/api/admin/setup/cuisine-types',
        paymentMethods: '/api/admin/setup/payment-methods',
        paymentMethod: (id: number) => `/api/admin/setup/payment-methods/${id}`,
      },
      moderation: {
        reports: '/api/admin/moderation/reports',
        resolveReport: (id: string) => `/api/admin/moderation/reports/${id}/resolve`,
        posts: '/api/admin/community/posts',
        comments: '/api/admin/community/comments',
        hidePost: (id: string) => `/api/admin/community/posts/${id}/hide`,
        banUser: (userId: string) => `/api/admin/users/${userId}/ban`,
        userShopReports: {
          list: '/api/admin/reports',
          status: (id: string) => `/api/admin/reports/${id}/status`,
        }
      },
      lostFound: {
        posts: '/api/admin/community/posts',
        resolve: (id: string) => `/api/admin/lost-found/${id}/resolve`,
        sightings: '/api/admin/lost-found/sightings',
        sightingDetail: (id: string) => `/api/admin/lost-found/sightings/${id}`,
      },
      reviews: {
        shops: '/api/admin/reviews/shops',
        shopVisibility: (id: string) => `/api/admin/reviews/shops/${id}/visibility`,
        shopDetail: (id: string) => `/api/admin/reviews/shops/${id}`,
        items: '/api/admin/reviews/items',
        itemVisibility: (id: string) => `/api/admin/reviews/items/${id}/visibility`,
        itemDetail: (id: string) => `/api/admin/reviews/items/${id}`,
        photos: {
          shops: (id: string) => `/api/admin/reviews/photos/shops/${id}`,
          items: (id: string) => `/api/admin/reviews/photos/items/${id}`,
        }
      },
      orders: {
        list: '/api/admin/orders',
        active: '/api/admin/orders/active',
        health: '/api/admin/orders/health',
        history: (id: string) => `/api/admin/orders/${id}/history`,
        status: (id: string) => `/api/admin/orders/${id}/status`,
      },
      menu: {
        categories: '/api/admin/categories',
        categoryDetail: (id: number) => `/api/admin/categories/${id}`,
        shopCategories: (shopId: number) => `/api/admin/categories/shop/${shopId}`,
        items: '/api/admin/items',
        itemDetail: (id: number) => `/api/admin/items/${id}`,
        categoryItems: (catId: number) => `/api/admin/items/categories/${catId}`,
        subCategories: '/api/admin/menu-sub-categories',
        subCategoryDetail: (id: number) => `/api/admin/menu-sub-categories/${id}`,
        subCategoryByCategory: (catId: number) => `/api/admin/menu-sub-categories/category/${catId}`,
        itemActions: {
          recommended: (id: number) => `/api/admin/items/${id}/recommended`,
          popular: (id: number) => `/api/admin/items/${id}/popular`,
          availability: (id: number) => `/api/admin/items/${id}/availability`,
          hotDeal: (id: number) => `/api/admin/items/${id}/hot-deal`,
        }
      },
      announcements: {
        broadcastUsers: '/api/admin/announcements/broadcast/users',
        broadcastShops: '/api/admin/announcements/broadcast/shops',
        history: '/api/admin/announcements/broadcast/history',
      },
      marketing: {
        banners: {
            base: '/api/admin/marketing/banners',
            detail: (id: string) => `/api/admin/marketing/banners/${id}`,
            toggle: (id: string) => `/api/admin/marketing/banners/${id}/toggle`,
        },
        featuredShops: '/api/admin/marketing/featured-shops',
        shopActions: {
            boost: (shopId: string) => `/api/admin/marketing/shops/${shopId}/boost`,
            featured: (shopId: string) => `/api/admin/marketing/shops/${shopId}/featured`,
        }
      },
      analytics: {
        dashboard: '/api/admin/dashboard/stats',
        revenue: '/api/admin/analytics/revenue',
        sessions: '/api/admin/analytics/sessions',
        locations: '/api/admin/analytics/locations',
        popularShops: '/api/admin/analytics/shops/popular',
        categories: '/api/admin/analytics/categories',
        feed: '/api/admin/analytics/feed',
        feedSections: (type: string) => `/api/admin/analytics/feed/sections/${type}`,
        deviceStats: '/api/admin/analytics/devices',
      },
      system: {
        dbLatency: '/api/admin/system/db-latency',
      },
      users: {
        list: '/api/admin/users',
        detail: (id: string | number) => `/api/admin/users/${id}`,
        status: (id: string | number) => `/api/admin/users/${id}/status`,
        role: (id: string | number) => `/api/admin/users/${id}/role`,
        ban: (id: string | number) => `/api/admin/users/${id}/ban`,
      },
      search: '/api/admin/search',
    },
    shops: {
      list: '/api/admin/shops',
      detail: (id: number) => `/api/admin/shops/${id}`,
      status: (id: number) => `/api/admin/shops/${id}/status`,
      verify: (id: number) => `/api/admin/shops/${id}/verify`,
      reject: (id: number) => `/api/admin/shops/${id}/reject`,
      pending: '/api/admin/shops/pending-vetting',
      categories: {
        shopCategories: (shopId: number) => `/api/admin/categories/shop/${shopId}`,
        detail: (id: number) => `/api/admin/categories/${id}`,
        form: '/api/admin/setup/shop-form-data',
      },
    },
    user: {
      profile: '/api/admin/profile',
    },
  },
  storage: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    userKey: 'user_data',
  },
} as const;
