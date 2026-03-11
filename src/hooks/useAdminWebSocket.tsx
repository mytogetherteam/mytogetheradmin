import { useEffect, useRef, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { config } from '@/config/config';

/**
 * Reflects the actual live payload from /topic/admin/stats.
 * Optional fields are planned by the backend spec but not yet sent.
 */
export interface SystemStatsDTO {
  // Currently broadcast
  totalUsers: number;
  totalShops: number;
  totalReviews: number;
  totalOrdersToday: number;
  totalRevenueToday: number;
  // Future fields (spec-planned, not yet broadcast)
  activeUsers24h?: number;
  pendingOrders?: number;
  activeShops?: number;
  revenueToday?: number;
  systemHealth?: string;
  pendingReports?: number;
}

export interface AdminAlertPayload {
  type?: string;
  message?: string;
  id?: string | number;
  timestamp?: string;
  [key: string]: unknown;
}

export interface AdminWebSocketState {
  connected: boolean;
  systemStats: SystemStatsDTO | null;
  latestReport: AdminAlertPayload | null;
  latestShopRequest: AdminAlertPayload | null;
  latestOrder: AdminAlertPayload | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AdminWsContext = createContext<AdminWebSocketState>({
  connected: false,
  systemStats: null,
  latestReport: null,
  latestShopRequest: null,
  latestOrder: null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Mount once inside the authenticated layout.
 * All consumers of `useAdminWebSocket` share the single STOMP connection.
 */
export function AdminWebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStatsDTO | null>(null);
  const [latestReport, setLatestReport] = useState<AdminAlertPayload | null>(null);
  const [latestShopRequest, setLatestShopRequest] = useState<AdminAlertPayload | null>(null);
  const [latestOrder, setLatestOrder] = useState<AdminAlertPayload | null>(null);

  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem(config.storage.tokenKey);
    if (!token) return;

    const wsBaseUrl = import.meta.env.DEV
      ? ''
      : (import.meta.env.VITE_API_BASE_URL || 'https://mytogetherapi-production.up.railway.app');

    const client = new Client({
      webSocketFactory: () => {
        const wsUrl = `${wsBaseUrl}${config.websocket.endpoint}`;
        console.log('[AdminWS] Connecting to:', wsUrl);
        return new SockJS(wsUrl) as WebSocket;
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[AdminWS] Connected');
        setConnected(true);

        // /topic/admin/stats — broadcast every 10 s
        client.subscribe(config.websocket.topics.stats, (msg) => {
          try {
            const stats = JSON.parse(msg.body) as SystemStatsDTO;
            console.log('[AdminWS] stats:', stats);
            setSystemStats(stats);
          } catch (err) {
            console.error('[AdminWS] Failed to parse stats:', err);
          }
        });

        // /topic/admin/reports
        client.subscribe(config.websocket.topics.reports, (msg) => {
          try {
            setLatestReport({
              ...(JSON.parse(msg.body) as AdminAlertPayload),
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.error('[AdminWS] Failed to parse report:', err);
          }
        });

        // /topic/admin/shop-requests
        client.subscribe(config.websocket.topics.shopRequests, (msg) => {
          try {
            setLatestShopRequest({
              ...(JSON.parse(msg.body) as AdminAlertPayload),
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.error('[AdminWS] Failed to parse shop request:', err);
          }
        });

        // /topic/admin/new-orders
        client.subscribe(config.websocket.topics.newOrders, (msg) => {
          try {
            setLatestOrder({
              ...(JSON.parse(msg.body) as AdminAlertPayload),
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.error('[AdminWS] Failed to parse order:', err);
          }
        });
      },
      onDisconnect: () => {
        console.log('[AdminWS] Disconnected');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[AdminWS] STOMP error:', frame.headers['message']);
        setConnected(false);
      },
      onWebSocketError: (event) => {
        console.error('[AdminWS] WebSocket error:', event);
      },
      onWebSocketClose: (event) => {
        console.log('[AdminWS] WebSocket closed:', event.code, event.reason);
        setConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [connect]);

  return (
    <AdminWsContext.Provider
      value={{ connected, systemStats, latestReport, latestShopRequest, latestOrder }}
    >
      {children}
    </AdminWsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Consume the shared WebSocket state.
 * Must be used inside <AdminWebSocketProvider>.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook + context intentionally co-located
export function useAdminWebSocket(): AdminWebSocketState {
  return useContext(AdminWsContext);
}
