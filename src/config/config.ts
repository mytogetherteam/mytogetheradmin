export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'https://mytogetherapi-production.up.railway.app'),
  endpoints: {
    auth: {
      login: '/api/admin/auth/login',
      register: '/api/admin/auth/register',
      refresh: '/api/admin/auth/refresh',
      logout: '/api/admin/auth/logout',
    },
    admin: {
      import: {
        shopsExcel: '/api/admin/import/shops/excel',
        singleShopExcel: '/api/admin/import/shops/single-excel',
        activityExcel: '/api/admin/import/activity/excel',
      },
      export: {
        users: '/api/admin/export/users',
        revenue: '/api/admin/export/revenue',
        orders: '/api/admin/export/orders',
      },
      auditLogs: '/api/admin/audit-logs',
      admins: {
        list: '/api/admin/admins',
        detail: (id: number) => `/api/admin/admins/${id}`,
        sessions: '/api/admin/admins/sessions',
        forceLogout: (id: number) => `/api/admin/admins/${id}/force-logout`,
      },
      shopCategories: '/api/admin/shop-categories',
      shopCategory: (id: number) => `/api/admin/shop-categories/${id}`,
      news: {
        base: '/api/admin/news',
        detail: (id: number) => `/api/admin/news/${id}`,
      },
      collections: {
        base: '/api/admin/collections',
        detail: (id: number) => `/api/admin/collections/${id}`,
        items: (id: number) => `/api/admin/collections/${id}/items`,
        reorderItems: (id: number) => `/api/admin/collections/${id}/items/reorder`,
        item: (id: number, menuItemId: number) =>
          `/api/admin/collections/${id}/items/${menuItemId}`,
      },
      shopSubCategories: '/api/admin/shop-sub-categories',
      shopSubCategory: (id: number) => `/api/admin/shop-sub-categories/${id}`,
      cuisines: {
        list: '/api/admin/cuisines',
        detail: (id: number) => `/api/admin/cuisines/${id}`,
      },
      shopProfile: {
        create: '/api/admin/shop-profile',
        list: '/api/admin/shop-profile/list',
        detail: (id: number) => `/api/admin/shop-profile/${id}`,
        operatingHours: (id: number) =>
          `/api/admin/shop-profile/${id}/operating-hours`,
        changeStatus: (id: number) =>
          `/api/admin/shop-profile/${id}/change-status`,
        assignAdmin: (id: number) =>
          `/api/admin/shop-profile/${id}/assign-admin`,
        updateAdmin: (id: number, adminId: number) =>
          `/api/admin/shop-profile/${id}/assign-admin/${adminId}`,
        importOnboardingExcel: '/api/admin/shop-profile/import/excel',
        importOnboardingJson: '/api/admin/shop-profile/import/json',
        /** Taxonomy lists for onboarding template ReferenceData sample rows */
        onboardingReferenceLists: '/api/admin/shop-profile/import/onboarding-reference-lists',
      },
      shopSubCategoriesByCategory: (categoryId: number) => `/api/admin/shop-categories/${categoryId}/sub-categories`,
      payment: {
        shopFormData: '/api/admin/setup/shop-form-data',
        cuisineTypes: '/api/admin/setup/cuisine-types',
        cuisineTypeDetail: (id: number) => `/api/admin/setup/cuisine-types/${id}`,
        paymentMethods: '/api/admin/payment-methods',
        paymentMethod: (id: number) => `/api/admin/payment-methods/${id}`,
        shopPaymentMethods: '/api/admin/shop-payment-methods',
        shopPaymentMethodsByShop: (shopId: number) => `/api/admin/shop-payment-methods/shop/${shopId}`,
        replaceShopPaymentMethods: (shopId: number) => `/api/admin/shop-payment-methods/${shopId}`,

        shopPaymentTypes: (shopId: number) => `/api/admin/shops/${shopId}/payment-types`,
        shopPaymentType: (shopId: number, id: number) => `/api/admin/shops/${shopId}/payment-types/${id}`,
      },
      cities: {
        list: '/api/admin/cities',
        detail: (id: number) => `/api/admin/cities/${id}`,
      },
      districts: {
        list: '/api/admin/districts',
        detail: (id: number) => `/api/admin/districts/${id}`,
      },
      regions: {
        list: '/api/admin/regions',
        detail: (id: number) => `/api/admin/regions/${id}`,
      },
      visas: {
        base: '/api/admin/visa',
        detail: (id: number) => `/api/admin/visa/${id}`,
        reorder: '/api/admin/visa/reorder',
      },
      visaCategories: {
        base: '/api/admin/visa/category',
        detail: (id: number) => `/api/admin/visa/category/${id}`,
      },
      places: {
        base: '/api/admin/places',
        detail: (id: number) => `/api/admin/places/${id}`,
        reorder: '/api/admin/places/reorder',
      },
      masterMenuSubCategories: {
        list: '/api/admin/master-menu-sub-categories',
        detail: (id: number) => `/api/admin/master-menu-sub-categories/${id}`,
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
          status: (id: number) => `/api/admin/reports/${id}/status`,
        }
      },
      lostFound: {
        posts: '/api/admin/community/posts',
        resolve: (postId: string) => `/api/admin/lost-found/posts/${postId}/resolve`,
        sightings: '/api/admin/lost-found/sightings',
        sightingDetail: (id: string) => `/api/admin/lost-found/sightings/${id}`,
      },
      shopFeedback: {
        list: '/api/admin/shop-feedback',
        detail: (id: number) => `/api/admin/shop-feedback/${id}`,
        read: (id: number) => `/api/admin/shop-feedback/${id}/read`,
      },
      deliveryDrivers: {
        list: '/api/admin/delivery-drivers',
        base: '/api/admin/delivery-drivers',
        detail: (id: number) => `/api/admin/delivery-drivers/${id}`,
      },
      reviews: {
        shops: '/api/admin/reviews/shops',
        shopVisibility: (id: string) => `/api/admin/reviews/shops/${id}/visibility`,
        shopDetail: (id: string) => `/api/admin/reviews/shops/${id}`,
        items: '/api/admin/reviews/items',
        itemVisibility: (id: string) => `/api/admin/reviews/items/${id}/visibility`,
        itemDetail: (id: string) => `/api/admin/reviews/items/${id}`,
        photos: {
          shops: (photoId: number) => `/api/admin/reviews/photos/shop/${photoId}`,
          items: (photoId: number) => `/api/admin/reviews/photos/item/${photoId}`,
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
        categories: '/api/admin/menu-categories',
        categoryDetail: (id: number) => `/api/admin/menu-categories/${id}`,
        categoryReorder: '/api/admin/menu-categories/reorder',
        shopCategories: (shopId: number) => `/api/admin/menu-categories/shop/${shopId}`,
        items: '/api/admin/items',
        itemDetail: (id: number) => `/api/admin/items/${id}`,
        itemTags: {
          base: '/api/admin/item-tags',
          detail: (id: number) => `/api/admin/item-tags/${id}`,
          reorder: '/api/admin/item-tags/reorder',
        },
        masterMenuCategories: {
          base: '/api/admin/master-menu-categories',
          detail: (id: number) => `/api/admin/master-menu-categories/${id}`,
          reorder: '/api/admin/master-menu-categories/reorder',
        },
        itemActions: {
          recommended: (id: number) => `/api/admin/items/${id}/recommended`,
          availability: (id: number) => `/api/admin/items/${id}/availability`,
          hotDeal: (id: number) => `/api/admin/items/${id}/hot-deal`,
        },
        approvals: {
          list: '/api/admin/menu/approvals',
          detail: (id: number) => `/api/admin/menu/approvals/${id}`,
          approve: (id: number) => `/api/admin/menu/approvals/${id}/approve`,
          reject: (id: number) => `/api/admin/menu/approvals/${id}/reject`,
          payments: {
            list: '/api/admin/menu/approvals/payments',
            detail: (id: number) => `/api/admin/menu/approvals/payments/${id}`,
            approve: (id: number) => `/api/admin/menu/approvals/payments/${id}/approve`,
            reject: (id: number) => `/api/admin/menu/approvals/payments/${id}/reject`,
          },
          categories: {
            list: '/api/admin/menu/approvals/categories',
            detail: (id: number) => `/api/admin/menu/approvals/categories/${id}`,
            approve: (id: number) => `/api/admin/menu/approvals/categories/${id}/approve`,
            reject: (id: number) => `/api/admin/menu/approvals/categories/${id}/reject`,
          }
        }
      },
      announcements: {
        create: '/api/admin/announcements',
        broadcastUsers: '/api/admin/announcements/broadcast/users',
        broadcastShops: '/api/admin/announcements/broadcast/shops',
        notifyUser: (id: string | number) => `/api/admin/announcements/notify/users/${id}`,
        notifyShop: (id: string | number) => `/api/admin/announcements/notify/shop/${id}`,
        history: '/api/admin/announcements/broadcast/history',
      },
      broadcasts: {
        base: '/api/admin/announcements',
      },
      marketing: {
        promotions: {
          base: '/api/admin/promotions',
          detail: (id: string | number) => `/api/admin/promotions/${id}`,
        },
        banners: {
          base: '/api/admin/banners',
          detail: (id: string | number) => `/api/admin/banners/${id}`,
        },
        backgroundThemes: {
          base: '/api/admin/background-themes',
          detail: (id: string | number) => `/api/admin/background-themes/${id}`,
          reorder: '/api/admin/background-themes/reorder',
        },
        homeDiscountSections: {
          base: '/api/admin/home-discount-sections',
          detail: (id: string | number) => `/api/admin/home-discount-sections/${id}`,
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
        latency: '/api/admin/system/latency',
        orderTimeouts: {
          base: '/api/admin/order-timeouts',
          status: (status: string) => `/api/admin/order-timeouts/${status}`,
          init: '/api/admin/order-timeouts/init',
        },
        configs: {
          base: '/api/admin/configs',
          key: (key: string) => `/api/admin/configs/${key}`,
          init: '/api/admin/configs/init',
        },
        appContent: {
          base: '/api/admin/app-content',
          key: (key: string) => `/api/admin/app-content/${key}`,
          publish: (key: string) => `/api/admin/app-content/${key}/publish`,
          detail: (id: number | string) => `/api/admin/app-content/${id}`,
        },
        appVersions: {
          base: '/api/admin/app-version',
          platform: (platform: string) => `/api/admin/app-version/${platform}`,
        },
        appManagement: {
          onboarding: '/api/admin/app-management/onboarding',
          onboardingDetail: (id: number) => `/api/admin/app-management/onboarding/${id}`,
          featureFlags: '/api/admin/app-management/flags',
          featureFlagDetail: (id: number) => `/api/admin/app-management/flags/${id}`,
        },
      },
      users: {
        list: '/api/admin/users',
        detail: (id: string | number) => `/api/admin/users/${id}`,
        status: (id: string | number) => `/api/admin/users/${id}/status`,
        role: (id: string | number) => `/api/admin/users/${id}/role`,
        orders: (id: string | number) => `/api/admin/users/${id}/orders`,
        activity: (id: string | number) => `/api/admin/users/${id}/activity`,
        lookup: '/api/admin/users/lookup',
        shopOwners: '/api/admin/users/shop-owners',
      },
      manageUsers: {
        list: '/api/admin/manage-users',
        detail: (accountType: string, id: string | number) =>
          `/api/admin/manage-users/${accountType}/${id}`,
        roles: '/api/admin/manage-users/roles',
      },
      search: '/api/admin/search',
    },
    shops: {
      list: '/api/admin/shop-profile',
      detail: (id: number) => `/api/admin/shops/${id}`,
      status: (id: number) => `/api/admin/shops/${id}/status`,
      verify: (id: number) => `/api/admin/shops/${id}/verify`,
      reject: (id: number) => `/api/admin/shops/${id}/reject`,
      pending: '/api/admin/shops/pending-vetting',
      lookup: '/api/admin/shops/lookup',
      photos: (id: number) => `/api/admin/shops/${id}/photos`,
      photoDetail: (id: number, photoId: number) => `/api/admin/shops/${id}/photos/${photoId}`,
      operatingHours: (id: number) => `/api/admin/shops/${id}/operating-hours`,
      paymentMethods: (id: number) => `/api/admin/shops/${id}/payment-methods`,
      categories: {
        shopCategories: (shopId: number) => `/api/admin/menu-categories/shop/${shopId}`,
        detail: (id: number) => `/api/admin/menu-categories/${id}`,
        form: '/api/admin/setup/shop-form-data',
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
    superAdminNotifications: {
      list: '/api/super-admin/notifications',
      unreadCount: '/api/super-admin/notifications/unread-count',
      readAll: '/api/super-admin/notifications/read-all',
      read: (id: number) => `/api/super-admin/notifications/${id}/read`,
      remove: (id: number) => `/api/super-admin/notifications/${id}`,
    },
  },
  websocket: {
    endpoint: '/ws',
    topics: {
      stats: '/topic/admin/stats',
      reports: '/topic/admin/reports',
      shopRequests: '/topic/admin/shop-requests',
      newOrders: '/topic/admin/new-orders',
      orderUpdates: '/topic/admin/order-updates',
      // Escalations: orders a shop didn't respond to within the SLA window.
      // Backend broadcasts here (myshop_demo_api ShopEventsGateway).
      superAdminNotifications: '/topic/superadmin/escalations',
      // Live order board: every new order / status change across all shops is
      // mirrored here for SuperAdmins (myshop_demo_api OrderEventsPublisher).
      superAdminOrders: '/topic/superadmin/orders',
    },
  },
  storage: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    userKey: 'user_data',
  },
} as const;
