import { config } from '@/config/config';
import { handleApiCall } from '@/lib/handleApiCall';
import { api } from '@/utils/axios';

export interface SuperAdminNotification {
  id: number;
  orderId: number | null;
  mainType: string; // 'ESCALATION'
  subType: string; // 'SHOP_NO_RESPONSE'
  title: string;
  message: string;
  data?: unknown; // frozen order snapshot
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminNotificationPage {
  items: SuperAdminNotification[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
}

const endpoints = config.endpoints.superAdminNotifications;

export const superAdminNotificationService = {
  /** Paginated list, newest first. */
  list: async (params?: { page?: number; size?: number }): Promise<SuperAdminNotificationPage> => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.size !== undefined) query.append('size', String(params.size));
    const qs = query.toString();
    const url = qs ? `${endpoints.list}?${qs}` : endpoints.list;
    return handleApiCall<SuperAdminNotificationPage>(() => api.get(url));
  },

  /** Badge count of unread escalations. */
  unreadCount: async (): Promise<number> => {
    const res = await handleApiCall<{ count: number }>(() => api.get(endpoints.unreadCount));
    return res.count;
  },

  markRead: (id: number): Promise<SuperAdminNotification> =>
    handleApiCall<SuperAdminNotification>(() => api.put(endpoints.read(id))),

  markAllRead: (): Promise<{ updatedCount: number }> =>
    handleApiCall<{ updatedCount: number }>(() => api.put(endpoints.readAll)),

  remove: (id: number): Promise<unknown> =>
    handleApiCall<unknown>(() => api.delete(endpoints.remove(id))),
};
