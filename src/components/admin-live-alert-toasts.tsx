import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminWebSocket } from "@/hooks/useAdminWebSocket";

type AlertPayload = {
  message?: unknown;
  id?: string | number;
  timestamp?: string;
  [key: string]: unknown;
};

type Variant = "error" | "success" | "warning" | "info";

interface LiveAlertToastProps {
  payload: AlertPayload | null;
  title: string;
  /**
   * Used when the payload does not contain a message or id.
   */
  fallbackDescription: string;
  /**
   * Optional custom formatter for the toast description.
   */
  formatDescription?: (payload: AlertPayload) => string;
  /**
   * Label for the action button (e.g. "View").
   */
  actionLabel?: string;
  /**
   * Called when the action button is clicked.
   */
  onAction?: () => void;
  /**
   * Chooses the Sonner variant; defaults to "error" (red alert).
   */
  variant?: Variant;
}

/**
 * Reusable hook-driven toast for any "latest payload" that has a timestamp.
 * Handles de-duplication and basic description formatting.
 */
function LiveAlertToast({
  payload,
  title,
  fallbackDescription,
  formatDescription,
  actionLabel = "View",
  onAction,
  variant = "error",
}: LiveAlertToastProps) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!payload?.timestamp) return;
    if (lastKey.current === payload.timestamp) return;
    lastKey.current = payload.timestamp;

    let description: string;
    if (formatDescription) {
      description = formatDescription(payload) || fallbackDescription;
    } else {
      const msg = payload.message as string | undefined;
      if (msg) {
        description = msg;
      } else if (payload.id) {
        description = `${fallbackDescription} #${payload.id}`;
      } else {
        description = fallbackDescription;
      }
    }

    const action = onAction
      ? {
        label: actionLabel,
        onClick: onAction,
      }
      : undefined;

    const show =
      variant === "success"
        ? toast.success
        : variant === "warning"
          ? toast.warning
          : variant === "info"
            ? toast
            : toast.error;

    show(title, {
      description,
      action,
    });
  }, [payload, title, fallbackDescription, formatDescription, actionLabel, onAction, variant]);

  return null;
}

/**
 * Global live-alert toasts for admin WebSocket topics.
 * Mounted once inside `AppLayout` so alerts show on every page.
 * Composes the generic `LiveAlertToast` so it can be reused elsewhere.
 */
export function AdminLiveAlertToasts() {
  const navigate = useNavigate();
  const { latestReport, latestShopRequest, latestOrder, latestOrderUpdate } = useAdminWebSocket();

  return (
    <>
      <LiveAlertToast
        payload={latestReport}
        title="New Report"
        fallbackDescription="A user or content has been reported"
        formatDescription={(p) =>
          (p.message as string | undefined) ||
          (p.id ? `Report #${p.id}` : "A user or content has been reported")
        }
        actionLabel="View"
        onAction={() => navigate("/moderation/user-shop")}
        variant="error"
      />

      <LiveAlertToast
        payload={latestShopRequest}
        title="Shop Approval Needed"
        fallbackDescription="A shop is awaiting vetting"
        formatDescription={(p) =>
          (p.message as string | undefined) ||
          (p.id ? `Shop #${p.id} pending review` : "A shop is awaiting vetting")
        }
        actionLabel="Review"
        onAction={() => navigate("/shops/vetting")}
        variant="warning"
      />

      <LiveAlertToast
        payload={latestOrder}
        title="New Order"
        fallbackDescription="A new order was placed"
        formatDescription={(p) =>
          (p.message as string | undefined) ||
          (p.id ? `Order #${p.id}` : "A new order was placed")
        }
        actionLabel="Open"
        onAction={() => navigate("/orders/board")}
        variant="info"
      />

      <LiveAlertToast
        payload={latestOrderUpdate}
        title="Order Updated"
        fallbackDescription="An order status has changed"
        formatDescription={(p) => {
          const msg = p.message as string | undefined;
          const order = p.order as { id?: string | number; status?: string; statusLabel?: string } | undefined;
          if (msg) return msg;
          if (order) {
            return `Order #${order.id} is now ${order.statusLabel || order.status}`;
          }
          return p.id ? `Order #${p.id} status updated` : "An order status has changed";
        }}
        actionLabel="View"
        onAction={() => {
          const order = latestOrderUpdate?.order as { id?: string | number } | undefined;
          if (order?.id) {
            navigate(`/orders/${order.id}`);
          } else if (latestOrderUpdate?.id) {
            navigate(`/orders/${latestOrderUpdate.id}`);
          } else {
            navigate("/orders/board");
          }
        }}
        variant="success"
      />
    </>
  );
}

