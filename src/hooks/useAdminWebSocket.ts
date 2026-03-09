import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { config } from '@/config/config';

export interface SystemStatsDTO {
  totalUsers: number;
  totalShops: number;
  totalReviews: number;
  totalOrdersToday: number;
  totalRevenueToday: number;
  // Optional/Legacy fields (might be missing in newer versions)
  activeUsers24h?: number;
  pendingOrders?: number;
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

/**
 * Manages a STOMP over SockJS connection to the admin WebSocket endpoint.
 * Subscribes to all four admin topics and exposes the latest payload for each.
 */
export function useAdminWebSocket(): AdminWebSocketState {
  const [connected, setConnected] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStatsDTO | null>(null);
  const [latestReport, setLatestReport] = useState<AdminAlertPayload | null>(null);
  const [latestShopRequest, setLatestShopRequest] = useState<AdminAlertPayload | null>(null);
  const [latestOrder, setLatestOrder] = useState<AdminAlertPayload | null>(null);

  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem(config.storage.tokenKey);
    if (!token) return;

    const wsUrl = import.meta.env.DEV
      ? `${window.location.origin}${config.websocket.endpoint}`
      : `${import.meta.env.VITE_API_BASE_URL || 'https://mytogetherapi-production.up.railway.app'}${config.websocket.endpoint}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);

        client.subscribe(config.websocket.topics.stats, (msg) => {
          try {
            const stats = JSON.parse(msg.body) as SystemStatsDTO;
            console.log('[AdminWS] Received stats:', stats);
            setSystemStats(stats);
          } catch { /* ignore malformed */ }
        });

        client.subscribe(config.websocket.topics.reports, (msg) => {
          try {
            setLatestReport({ ...JSON.parse(msg.body) as AdminAlertPayload, timestamp: new Date().toISOString() });
          } catch { /* ignore malformed */ }
        });

        client.subscribe(config.websocket.topics.shopRequests, (msg) => {
          try {
            setLatestShopRequest({ ...JSON.parse(msg.body) as AdminAlertPayload, timestamp: new Date().toISOString() });
          } catch { /* ignore malformed */ }
        });

        client.subscribe(config.websocket.topics.newOrders, (msg) => {
          try {
            setLatestOrder({ ...JSON.parse(msg.body) as AdminAlertPayload, timestamp: new Date().toISOString() });
          } catch { /* ignore malformed */ }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[AdminWS] STOMP error:', frame.headers['message']);
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

  return { connected, systemStats, latestReport, latestShopRequest, latestOrder };
}
