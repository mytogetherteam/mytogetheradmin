/**
 * useOrderBoardWebSocket
 * ──────────────────────
 * A PAGE-SCOPED STOMP/WebSocket hook for /orders/board.
 *
 * Design goals
 * ────────────
 * • Connect on mount, disconnect on unmount – never leaks an open socket.
 * • Does NOT reuse the global AdminWebSocketProvider so it cannot affect
 *   stats / reports / shop-requests subscriptions on other pages.
 * • Deduplicates new-order inserts (guards against duplicate messages).
 * • Updates existing orders in-place without replacing the full array,
 *   which keeps React reconciliation cheap and avoids unnecessary re-renders.
 * • Exposes `wsConnected` so the host can toggle the polling fallback.
 * • Reconnects automatically (reconnectDelay = 5 s via @stomp/stompjs).
 *
 * Fallback strategy (implemented in OrderBoard.tsx, driven by wsConnected):
 *   wsConnected = false  →  REST polling every 30 s
 *   wsConnected = true   →  polling paused; WS pushes deltas in real-time
 */

import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { config } from '@/config/config';
import { Order, OrderStatus } from '@/services/orderService';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal shape the backend sends on /topic/admin/new-orders */
interface NewOrderPayload extends Partial<Order> {
  id: number | string;
  status: OrderStatus;
}

/** Minimal shape the backend sends on /topic/admin/order-updates */
interface OrderUpdatePayload {
  id: number | string;
  status: OrderStatus;
  updatedAt?: string;
  [key: string]: unknown;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseOrderBoardWebSocketOptions {
  /** Called to mutate the orders cache when a new order arrives. */
  onNewOrder: (order: NewOrderPayload) => void;
  /** Called to mutate the orders cache when an existing order changes. */
  onOrderUpdate: (update: OrderUpdatePayload) => void;
}

export function useOrderBoardWebSocket({
  onNewOrder,
  onOrderUpdate,
}: UseOrderBoardWebSocketOptions): { wsConnected: boolean } {
  const [wsConnected, setWsConnected] = useState(false);

  /**
   * Stable refs for the callbacks so the STOMP subscribe handlers always
   * call the latest version without needing to re-subscribe / re-activate.
   */
  const onNewOrderRef = useRef(onNewOrder);
  const onOrderUpdateRef = useRef(onOrderUpdate);
  useEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);
  useEffect(() => { onOrderUpdateRef.current = onOrderUpdate; }, [onOrderUpdate]);

  useEffect(() => {
    const token = localStorage.getItem(config.storage.tokenKey);
    if (!token) {
      console.warn('[OrderBoardWS] No auth token found – skipping WS connection.');
      return;
    }

    const wsBaseUrl = import.meta.env.DEV
      ? ''
      : (import.meta.env.VITE_API_BASE_URL || 'https://mytogetherapi-production.up.railway.app');

    const client = new Client({
      webSocketFactory: () => {
        const url = `${wsBaseUrl}${config.websocket.endpoint}`;
        console.log('[OrderBoardWS] Connecting to:', url);
        return new SockJS(url) as WebSocket;
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        console.log('[OrderBoardWS] Connected');
        setWsConnected(true);

        // ── New orders (PENDING status – just checked out) ──────────────────
        client.subscribe(config.websocket.topics.newOrders, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as NewOrderPayload;
            console.log('[OrderBoardWS] new-order:', payload);
            onNewOrderRef.current(payload);
          } catch (err) {
            console.error('[OrderBoardWS] Failed to parse new-order payload:', err);
          }
        });

        // ── Any status change on any order ───────────────────────────────────
        client.subscribe(config.websocket.topics.orderUpdates, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as OrderUpdatePayload;
            console.log('[OrderBoardWS] order-update:', payload);
            onOrderUpdateRef.current(payload);
          } catch (err) {
            console.error('[OrderBoardWS] Failed to parse order-update payload:', err);
          }
        });
      },

      onDisconnect: () => {
        console.log('[OrderBoardWS] Disconnected');
        setWsConnected(false);
      },

      onStompError: (frame) => {
        console.error('[OrderBoardWS] STOMP error:', frame.headers['message']);
        setWsConnected(false);
      },

      onWebSocketError: (event) => {
        console.error('[OrderBoardWS] WebSocket error:', event);
        setWsConnected(false);
      },

      onWebSocketClose: (event) => {
        console.log('[OrderBoardWS] WebSocket closed:', event.code, event.reason);
        setWsConnected(false);
      },
    });

    client.activate();

    // ── Cleanup: runs when user navigates away from /orders/board ────────────
    return () => {
      console.log('[OrderBoardWS] Deactivating (page unmount)');
      client.deactivate();
    };
  // Empty dep array: create once on mount, destroy on unmount.
  // Callbacks are accessed via stable refs so no re-activation is needed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { wsConnected };
}
