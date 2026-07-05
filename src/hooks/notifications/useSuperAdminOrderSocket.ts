import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { config } from '@/config/config';

export interface OrderSocketPayload {
  type?: 'NEW_ORDER' | 'ORDER_UPDATE' | string;
  shopId?: number;
  orderId?: number;
  status?: string;
  order?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Build the raw STOMP-over-WebSocket URL for the backend gateway, which listens
 * at `/ws/websocket` (NestJS WsAdapter — raw `ws`, not SockJS).
 */
function computeBrokerUrl(): string {
  const base = config.apiBaseUrl || window.location.origin;
  const url = new URL('/ws/websocket', base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

/**
 * Dedicated STOMP connection for the SuperAdmin live order board.
 *
 * Opens its OWN connection subscribed to `/topic/superadmin/orders`, where the
 * backend mirrors every new order and order status change across all shops.
 * Kept separate from the escalation socket because the gateway routes by the
 * client-generated subscription id, and a dedicated connection keeps concerns
 * isolated.
 *
 * @param onMessage   called with each order event payload as it arrives
 * @param enabled     only connect while true (e.g. logged-in SuperAdmin on board)
 * @param onReconnect called each time the STOMP connection (re)establishes — use
 *                    this to re-sync any data that may have been missed while the
 *                    socket was disconnected.
 */
export function useSuperAdminOrderSocket(
  onMessage: (payload: OrderSocketPayload) => void,
  enabled: boolean,
  onReconnect?: () => void,
) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Keep the latest callbacks without forcing a reconnect when they change.
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const onReconnectRef = useRef(onReconnect);
  useEffect(() => { onReconnectRef.current = onReconnect; }, [onReconnect]);

  // Track whether this is the initial connect or a RE-connect.
  const hasConnectedOnce = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem(config.storage.tokenKey);
    if (!token) {
      console.warn('[OrderWS] no auth token in localStorage — socket not opened');
      return;
    }

    const brokerURL = computeBrokerUrl();
    console.log('[OrderWS] connecting to', brokerURL);

    const client = new Client({
      brokerURL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);

        // If this is a reconnect (not the initial connect), fire the callback
        // so the board can immediately refetch and recover any missed events.
        if (hasConnectedOnce.current) {
          console.log('[OrderWS] reconnected — triggering data sync');
          onReconnectRef.current?.();
        }
        hasConnectedOnce.current = true;

        client.subscribe(config.websocket.topics.superAdminOrders, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as OrderSocketPayload;
            onMessageRef.current(payload);
          } catch (err) {
            console.error('[OrderWS] Failed to parse payload:', err);
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onWebSocketError: (evt) => console.error('[OrderWS] websocket error', evt),
      onStompError: (frame) =>
        console.error('[OrderWS] STOMP error:', frame.headers['message']),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      void client.deactivate();
      clientRef.current = null;
      setConnected(false);
      hasConnectedOnce.current = false;
    };
  }, [enabled]);

  return { connected };
}
