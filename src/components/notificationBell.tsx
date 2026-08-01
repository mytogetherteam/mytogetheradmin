import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { authService } from '@/services/authService';
import { AdminRole, hasAccess } from '@/utils/rbac';
import {
  superAdminNotificationKeys,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useSuperAdminNotifications,
  useSuperAdminUnreadCount,
} from '@/hooks/notifications/useSuperAdminNotifications';
import {
  useSuperAdminNotificationSocket,
  type EscalationSocketPayload,
} from '@/hooks/notifications/useSuperAdminNotificationSocket';
import type { SuperAdminNotification } from '@/services/superAdminNotificationService';

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export function NotificationBell() {
  const isSuperAdmin = hasAccess(authService.getUserData()?.role, AdminRole.ADMIN);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useSuperAdminUnreadCount({ enabled: isSuperAdmin });
  const { data: page, isLoading } = useSuperAdminNotifications(
    { page: 0, size: 20 },
    { enabled: isSuperAdmin && open },
  );
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  // Realtime: a new alert arrives → toast + refresh badge/list from server.
  const handleRealtime = useCallback(
    (payload: EscalationSocketPayload) => {
      const isSubscription = payload.mainType === 'SUBSCRIPTION';
      const notify = isSubscription ? toast.info : toast.warning;
      notify(payload.title, {
        description:
          payload.message ??
          (isSubscription
            ? 'A shop bought a plan and is waiting for review.'
            : 'An order is waiting too long for a shop reply.'),
        position: 'bottom-right',
        duration: 8000,
      });
      void queryClient.invalidateQueries({ queryKey: superAdminNotificationKeys.all });
    },
    [queryClient],
  );
  useSuperAdminNotificationSocket(handleRealtime, isSuperAdmin);

  if (!isSuperAdmin) return null;

  const items: SuperAdminNotification[] = page?.items ?? [];
  const hasUnread = unreadCount > 0;

  const onItemClick = (n: SuperAdminNotification) => {
    if (!n.isRead) markRead.mutate(n.id);

    // A plan purchase is only useful next to its transfer slip — open it.
    const subscriptionId = (n.data as { subscriptionId?: number } | null)
      ?.subscriptionId;
    if (n.mainType === 'SUBSCRIPTION' && subscriptionId) {
      setOpen(false);
      void navigate(`/subscriptions/manage?subscriptionId=${subscriptionId}`);
    }
  };


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white border border-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">
            Notifications{hasUnread ? ` (${unreadCount})` : ''}
          </div>
          {hasUnread && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(n)}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${n.isRead ? '' : 'bg-amber-50 dark:bg-amber-950/20'
                      }`}
                  >
                    <div className="flex w-full items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      )}
                      <span className="min-w-0 flex-1 break-words text-sm font-medium leading-snug">
                        {n.title}
                      </span>
                    </div>
                    <span className="break-words pl-4 text-xs text-muted-foreground leading-snug">
                      {n.message}
                    </span>
                    <span className="pl-4 text-[11px] text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
