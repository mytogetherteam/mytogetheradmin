import type { SubscriptionStatus } from "@/services/subscriptionService";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** One colour per status, used everywhere so the queue reads the same on every screen. */
const STATUS_STYLES: Record<SubscriptionStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending review",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  ACTIVE: {
    label: "Active",
    className:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    className:
      "border-destructive/40 bg-destructive/15 text-destructive dark:text-red-400",
  },
  EXPIRED: {
    label: "Expired",
    className: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
  CANCELED: {
    label: "Cancelled",
    className: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
};

export function SubscriptionStatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={cn(style.className, className)}>
      {style.label}
    </Badge>
  );
}

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> =
  Object.fromEntries(
    Object.entries(STATUS_STYLES).map(([key, value]) => [key, value.label]),
  ) as Record<SubscriptionStatus, string>;
