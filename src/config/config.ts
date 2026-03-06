export const config = {
  apiBaseUrl: import.meta.env.DEV 
    ? ''  // Use empty string for dev (Vite proxy handles it)
    : import.meta.env.VITE_API_BASE_URL || 'https://mytogetherapi-production.up.railway.app',
  endpoints: {
    auth: {
      login: '/api/admin/auth/login',
      register: '/api/admin/auth/register',
      refresh: '/api/admin/auth/refresh',
    },
    admin: {
      import: {
        shopsExcel: '/api/admin/import/shops/excel',
        activityExcel: '/api/admin/import/activity/excel',
      },
      export: {
        users: '/api/admin/export/users',
        revenue: '/api/admin/export/revenue',
        orders: '/api/admin/export/orders',
      },
      auditLogs: '/api/admin/audit-logs',
      payment: {
        shopFormData: '/api/admin/setup/shop-form-data',
        cities: '/api/admin/setup/cities',
        cityDetail: (id: number) => `/api/admin/setup/cities/${id}`,
        districts: '/api/admin/setup/districts',
        districtDetail: (id: number) => `/api/admin/setup/districts/${id}`,
        cuisineTypes: '/api/admin/setup/cuisine-types',
        cuisineTypeDetail: (id: number) => `/api/admin/setup/cuisine-types/${id}`,
        paymentMethods: '/api/admin/setup/payment-methods',
        paymentMethod: (id: number) => `/api/admin/setup/payment-methods/${id}`,
        shopCategories: '/api/admin/setup/shop-categories',
        shopCategory: (id: number) => `/api/admin/setup/shop-categories/${id}`,
        shopSubCategories: (categoryId: number) => `/api/admin/setup/shop-categories/${categoryId}/sub-categories`,
        shopSubCategory: (id: number) => `/api/admin/setup/shop-categories/sub-categories/${id}`,
        shopPaymentTypes: (shopId: number) => `/api/admin/shops/${shopId}/payment-types`,
        shopPaymentType: (shopId: number, id: number) => `/api/admin/shops/${shopId}/payment-types/${id}`,
      },
      districts: {
        list: '/api/admin/districts',
        detail: (id: number) => `/api/admin/districts/${id}`,
      },
      cities: {
        list: '/api/admin/cities',
        detail: (id: number) => `/api/admin/cities/${id}`,
      },
      moderation: {
        reports: '/api/admin/moderation/reports',
        resolveReport: (id: string) => `/api/admin/moderation/reports/${id}/resolve`,
        posts: '/api/admin/community/posts',
        postDetail: (id: string) => `/api/admin/community/posts/${id}`,
        comments: '/api/admin/community/comments',
        commentDetail: (id: string) => `/api/admin/community/comments/${id}`,
        hidePost: (id: string) => `/api/admin/community/posts/${id}/hide`,
        banUser: (userId: string) => `/api/admin/users/${userId}/ban`,
        userShopReports: {
          list: '/api/admin/reports',
          status: (id: string) => `/api/admin/reports/${id}/status`,
        }
      },
      lostFound: {
        posts: '/api/admin/community/posts',
        resolve: (postId: string) => `/api/admin/lost-found/posts/${postId}/resolve`,
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
        detail: (id: string) => `/api/admin/orders/${id}`,
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
        subCategoryDetail: (id: number) => `/api/admin/menu-sub-categories/${id}`,
        subCategoryByCategory: (catId: number) => `/api/admin/menu-sub-categories/category/${catId}`,
        itemActions: {
          recommended: (id: number) => `/api/admin/items/${id}/recommended`,
          availability: (id: number) => `/api/admin/items/${id}/availability`,
          hotDeal: (id: number) => `/api/admin/items/${id}/hot-deal`,
        }
      },
      announcements: {
        create: '/api/admin/announcements',
        broadcastUsers: '/api/admin/announcements/broadcast/users',
        broadcastShops: '/api/admin/announcements/broadcast/shops',
        notifyUser: (id: string | number) => `/api/admin/announcements/notify/user/${id}`,
        notifyShop: (id: string | number) => `/api/admin/announcements/notify/shop/${id}`,
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
        orders: '/api/admin/analytics/orders',
        ordersCancellationRate: '/api/admin/analytics/orders/cancellation-rate',
        sessions: '/api/admin/analytics/sessions',
        locations: '/api/admin/analytics/locations',
        popularShops: '/api/admin/analytics/shops/popular',
        shopRevenue: (shopId: number) => `/api/admin/analytics/shops/${shopId}/revenue`,
        shopOrders: (shopId: number) => `/api/admin/analytics/shops/${shopId}/orders`,
        categories: '/api/admin/analytics/categories',
        feed: '/api/admin/analytics/feed',
        feedSections: (type: string) => `/api/admin/analytics/feed/sections/${type}`,
        usersGrowth: '/api/admin/analytics/users/growth',
        features: '/api/admin/analytics/features',
        deviceStats: '/api/admin/analytics/devices',
        deviceDetail: (deviceId: string) => `/api/admin/analytics/device/${deviceId}`,
      },
      system: {
        dbLatency: '/api/admin/system/db-latency',
      },
      users: {
        list: '/api/admin/users',
        detail: (id: string | number) => `/api/admin/users/${id}`,
        status: (id: string | number) => `/api/admin/users/${id}/status`,
        role: (id: string | number) => `/api/admin/users/${id}/role`,
        orders: (id: string | number) => `/api/admin/users/${id}/orders`,
        activity: (id: string | number) => `/api/admin/users/${id}/activity`,
        lookup: '/api/admin/users/lookup',
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
      lookup: '/api/admin/shops/lookup',
      photos: (id: number) => `/api/admin/shops/${id}/photos`,
      photoDetail: (id: number, photoId: number) => `/api/admin/shops/${id}/photos/${photoId}`,
      operatingHours: (id: number) => `/api/admin/shops/${id}/operating-hours`,
      categories: {
        shopCategories: (shopId: number) => `/api/admin/categories/shop/${shopId}`,
        detail: (id: number) => `/api/admin/categories/${id}`,
        form: '/api/admin/setup/shop-form-data',
      },
      riders: {
        list: '/api/admin/riders',
        detail: (id: number) => `/api/admin/riders/${id}`,
      },
      profile: {
        base: '/api/admin/shops/profile',
        status: '/api/admin/shops/profile/status',
        operatingHours: '/api/admin/shops/profile/operating-hours',
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
