import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { config } from '@/config/config';

/**
 * Any SuperAdmin alert pushed on this channel — an order escalation, or a shop
 * subscription purchase waiting for review. `mainType` says which.
 */
export interface EscalationSocketPayload {
  type?: string; // 'ORDER_ESCALATION' | 'SUBSCRIPTION_NOTIFICATION'
  mainType?: string; // 'ESCALATION' | 'SUBSCRIPTION'
  subType?: string; // 'SHOP_NO_RESPONSE' | 'SUBSCRIPTION_PURCHASED' | …
  notificationId?: number;
  orderId?: number;
  shopId?: number;
  status?: string;
  message?: string;
  order?: unknown;
  data?: unknown;
  title?: string;
  [key: string]: unknown;
}

/**
 * Build the raw STOMP-over-WebSocket URL for the backend gateway, which listens
 * at `/ws/websocket` (NestJS WsAdapter — raw `ws`, not SockJS). Derives ws/wss
 * + host from the configured API base; falls back to the dev origin (Vite proxy
 * forwards `/ws` → API) when no base URL is set.
 */
function computeBrokerUrl(): string {
  const base = config.apiBaseUrl || window.location.origin;
  const url = new URL('/ws/websocket', base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

/**
 * Dedicated STOMP connection for SuperAdmin escalation alerts.
 *
 * The backend gateway keys every subscription by `user-{userId}`, so a single
 * connection can only hold ONE topic at a time. The shared `useAdminWebSocket`
 * connection already uses its one slot, so this opens its OWN connection whose
 * single subscription is `/topic/superadmin/escalations`. Each WS connection is
 * a separate client on the server, so this receives broadcasts without
 * disturbing the shared connection — no backend change required.
 *
 * @param onMessage called with each escalation payload as it arrives
 * @param enabled   only connect while true (e.g. logged-in SuperAdmin)
 */
export function useSuperAdminNotificationSocket(
  onMessage: (payload: EscalationSocketPayload) => void,
  enabled: boolean,
) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Keep the latest callback without forcing a reconnect when it changes.
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) {
      console.log('[NotificationWS] disabled (not a SuperAdmin?) — socket not opened');
      return;
    }

    const token = localStorage.getItem(config.storage.tokenKey);
    if (!token) {
      console.warn('[NotificationWS] no auth token in localStorage — socket not opened');
      return;
    }

    const brokerURL = computeBrokerUrl();
    console.log('[NotificationWS] connecting to', brokerURL);

    const client = new Client({
      brokerURL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log(
          '[NotificationWS] CONNECTED → subscribing to',
          config.websocket.topics.superAdminNotifications,
        );
        setConnected(true);
        client.subscribe(
          config.websocket.topics.superAdminNotifications,
          (msg) => {
            console.log('[NotificationWS] message received:', msg.body);
            try {
              const payload = JSON.parse(msg.body) as EscalationSocketPayload;
              onMessageRef.current(payload);
            } catch (err) {
              console.error('[NotificationWS] Failed to parse payload:', err);
            }
          },
        );
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: (evt) => {
        console.warn('[NotificationWS] websocket closed', evt?.code, evt?.reason);
        setConnected(false);
      },
      onWebSocketError: (evt) =>
        console.error('[NotificationWS] websocket error', evt),
      onStompError: (frame) =>
        console.error('[NotificationWS] STOMP error:', frame.headers['message'], frame.body),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      void client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  return { connected };
}
