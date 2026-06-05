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
  orderId?: number;
  orderNo?: string;
  order?: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_KEYS = {
  STATS: 'admin_ws_stats',
  REPORT: 'admin_ws_latest_report',
  SHOP: 'admin_ws_latest_shop',
  ORDER: 'admin_ws_latest_order',
  ORDER_UPDATE: 'admin_ws_latest_order_update',
};

const getCached = <T,>(key: string): T | null => {
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

const setCached = (key: string, data: unknown) => {
  if (data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export interface AdminWebSocketState extends AdminWebSocketStateData {
  // Demand tracking internal - not usually for consumers but here for completeness
  addDemand: () => void;
  removeDemand: () => void;
}

export interface AdminWebSocketStateData {
  connected: boolean;
  systemStats: SystemStatsDTO | null;
  latestReport: AdminAlertPayload | null;
  latestShopRequest: AdminAlertPayload | null;
  latestOrder: AdminAlertPayload | null;
  latestOrderUpdate: AdminAlertPayload | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AdminWsContext = createContext<AdminWebSocketState>({
  connected: false,
  systemStats: getCached<SystemStatsDTO>(CACHE_KEYS.STATS),
  latestReport: getCached<AdminAlertPayload>(CACHE_KEYS.REPORT),
  latestShopRequest: getCached<AdminAlertPayload>(CACHE_KEYS.SHOP),
  latestOrder: getCached<AdminAlertPayload>(CACHE_KEYS.ORDER),
  latestOrderUpdate: getCached<AdminAlertPayload>(CACHE_KEYS.ORDER_UPDATE),
  addDemand: () => {},
  removeDemand: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Mount once inside the authenticated layout.
 * All consumers of `useAdminWebSocket` share the single STOMP connection.
 */
export function AdminWebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [demandCount, setDemandCount] = useState(0);
  
  const [systemStats, setSystemStats] = useState<SystemStatsDTO | null>(() => getCached(CACHE_KEYS.STATS));
  const [latestReport, setLatestReport] = useState<AdminAlertPayload | null>(() => getCached(CACHE_KEYS.REPORT));
  const [latestShopRequest, setLatestShopRequest] = useState<AdminAlertPayload | null>(() => getCached(CACHE_KEYS.SHOP));
  const [latestOrder, setLatestOrder] = useState<AdminAlertPayload | null>(() => getCached(CACHE_KEYS.ORDER));
  const [latestOrderUpdate, setLatestOrderUpdate] = useState<AdminAlertPayload | null>(() => getCached(CACHE_KEYS.ORDER_UPDATE));

  const clientRef = useRef<Client | null>(null);

  const addDemand = useCallback(() => setDemandCount(prev => prev + 1), []);
  const removeDemand = useCallback(() => setDemandCount(prev => prev - 1), []);

  const deactivate = useCallback(() => {
    if (clientRef.current) {
      console.log('[AdminWS] Deactivating due to zero demand');
      clientRef.current.deactivate();
      clientRef.current = null;
      // Wrap in timeout to avoid synchronous setState in effect warning if called during render/effect
      setTimeout(() => setConnected(false), 0);
    }
  }, []);

  const activate = useCallback(() => {
    // Disabled: this connection uses SockJS (`/ws/info`), but the current
    // backend is a raw-WebSocket STOMP server with no SockJS endpoint, so it
    // 404s and reconnects every 5s forever. Realtime now runs through the
    // dedicated raw-WS hook (useSuperAdminNotificationSocket). Flip to `true`
    // to re-enable if pointing at a SockJS-capable backend.
    const LEGACY_ADMIN_WS_ENABLED = false;
    if (!LEGACY_ADMIN_WS_ENABLED) return;

    if (clientRef.current?.active) return;

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
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log('[AdminWS] Connected');
        setConnected(true);

        // /topic/admin/stats
        client.subscribe(config.websocket.topics.stats, (msg) => {
          try {
            const stats = JSON.parse(msg.body) as SystemStatsDTO;
            console.log('[AdminWS] Received stats:', stats);
            setSystemStats(stats);
            setCached(CACHE_KEYS.STATS, stats);
          } catch (err) {
            console.error('[AdminWS] Failed to parse stats:', err);
          }
        });

        // /topic/admin/reports
        client.subscribe(config.websocket.topics.reports, (msg) => {
          try {
            const raw = JSON.parse(msg.body);
            console.log('[AdminWS] Received report:', raw);
            const data = {
              ...(raw as AdminAlertPayload),
              timestamp: new Date().toISOString(),
            };
            setLatestReport(data);
            setCached(CACHE_KEYS.REPORT, data);
          } catch (err) {
            console.error('[AdminWS] Failed to parse report:', err);
          }
        });

        // /topic/admin/shop-requests
        client.subscribe(config.websocket.topics.shopRequests, (msg) => {
          try {
            const raw = JSON.parse(msg.body);
            console.log('[AdminWS] Received shop request:', raw);
            const data = {
              ...(raw as AdminAlertPayload),
              timestamp: new Date().toISOString(),
            };
            setLatestShopRequest(data);
            setCached(CACHE_KEYS.SHOP, data);
          } catch (err) {
            console.error('[AdminWS] Failed to parse shop request:', err);
          }
        });

        // /topic/admin/new-orders
        client.subscribe(config.websocket.topics.newOrders, (msg) => {
          try {
            const raw = JSON.parse(msg.body);
            console.log('[AdminWS] Received new order:', raw);
            const data = {
              ...(raw as AdminAlertPayload),
              timestamp: new Date().toISOString(),
            };
            setLatestOrder(data);
            setCached(CACHE_KEYS.ORDER, data);
          } catch (err) {
            console.error('[AdminWS] Failed to parse order:', err);
          }
        });

        // /topic/admin/order-updates
        client.subscribe(config.websocket.topics.orderUpdates, (msg) => {
          try {
            const raw = JSON.parse(msg.body);
            console.log('[AdminWS] Received order update:', raw);
            const data: AdminAlertPayload = {
              ...raw,
              orderId: raw.orderId,
              orderNo: raw.orderNo,
              order: raw.order,
              timestamp: new Date().toISOString(),
            };
            setLatestOrderUpdate(data);
            setCached(CACHE_KEYS.ORDER_UPDATE, data);
          } catch (err) {
            console.error('[AdminWS] Failed to parse order update:', err);
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
      onWebSocketClose: () => {
        console.log('[AdminWS] WebSocket closed');
        setConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (demandCount > 0) activate();
      } else {
        // Option: we could deactivate on hidden, but maybe keep it for notifications?
        // User said "Only when you really need them". Background tab usually doesn't need them
        // unless they are "critical". For now, let's keep it active but maybe slow down heartbeats?
        // Actually, let's stick to the refcount for now, but ensure we don't reconnect while hidden if it drops.
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [demandCount, activate]);

  useEffect(() => {
    if (demandCount > 0) {
      activate();
    } else {
      deactivate();
    }
  }, [demandCount, activate, deactivate]);

  useEffect(() => {
    return () => {
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, []);

  return (
    <AdminWsContext.Provider
      value={{
        connected,
        systemStats,
        latestReport,
        latestShopRequest,
        latestOrder,
        latestOrderUpdate,
        addDemand,
        removeDemand
      }}
    >
      {children}
    </AdminWsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseAdminWsOptions {
  enabled?: boolean;
}

/**
 * Consume the shared WebSocket state.
 * Must be used inside <AdminWebSocketProvider>.
 * 
 * @param options.enabled If true, ensures the WebSocket is active while this component is mounted.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook + context intentionally co-located
export function useAdminWebSocket(options?: UseAdminWsOptions): AdminWebSocketState {
  const context = useContext(AdminWsContext);
  const enabled = !!options?.enabled;

  useEffect(() => {
    if (enabled) {
      context.addDemand();
      return () => context.removeDemand();
    }
  }, [enabled, context]);

  return context;
}
