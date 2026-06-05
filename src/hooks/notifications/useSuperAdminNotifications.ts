import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminNotificationService } from '@/services/superAdminNotificationService';

export const superAdminNotificationKeys = {
  all: ['super-admin-notifications'] as const,
  list: (page: number, size: number) =>
    [...superAdminNotificationKeys.all, 'list', page, size] as const,
  unreadCount: () => [...superAdminNotificationKeys.all, 'unread-count'] as const,
};

/** List of escalations. Pass `enabled` so it only fetches when the panel opens. */
export function useSuperAdminNotifications(
  params: { page?: number; size?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const page = params.page ?? 0;
  const size = params.size ?? 20;
  return useQuery({
    queryKey: superAdminNotificationKeys.list(page, size),
    queryFn: () => superAdminNotificationService.list({ page, size }),
    enabled: options.enabled ?? true,
  });
}

/**
 * Unread count for the bell badge. Polls every 60s as a safety net in case a
 * realtime message is missed; realtime updates invalidate this immediately.
 */
export function useSuperAdminUnreadCount(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: superAdminNotificationKeys.unreadCount(),
    queryFn: () => superAdminNotificationService.unreadCount(),
    enabled: options.enabled ?? true,
    refetchInterval: 60_000,
    retry: false,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => superAdminNotificationService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: superAdminNotificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => superAdminNotificationService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: superAdminNotificationKeys.all });
    },
  });
}
