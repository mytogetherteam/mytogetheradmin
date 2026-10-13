import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { config } from '@/config/config';
import { orderKeys } from '@/hooks/orders/useOrders';
import { OrderChatConversation, ChatMessage } from '@/services/orderService';

export interface ChatSocketEventPayload {
  type: 'CHAT_MESSAGE' | 'CHAT_MESSAGE_EDIT' | 'CHAT_MESSAGE_DELETE' | string;
  shopId?: number;
  orderId?: number;
  conversationId?: number;
  message?: ChatMessage;
  shopUnreadCount?: number;
  userUnreadCount?: number;
  [key: string]: unknown;
}

function computeBrokerUrl(): string {
  const base = config.apiBaseUrl || window.location.origin;
  const url = new URL('/ws/websocket', base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

/**
 * Real-time STOMP WebSocket hook for live order chat.
 * Subscribes to `/topic/shop/${shopId}/chat` and applies incoming messages
 * directly into the TanStack Query cache for instant zero-latency updates.
 */
export function useOrderChatSocket(
  orderId?: string | number,
  shopId?: string | number,
  enabled: boolean = true,
) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !orderId || !shopId) return;

    const token = localStorage.getItem(config.storage.tokenKey);
    if (!token) return;

    const brokerURL = computeBrokerUrl();
    const destination = `/topic/shop/${shopId}/chat`;

    const client = new Client({
      brokerURL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);

        client.subscribe(destination, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as ChatSocketEventPayload;
            if (Number(payload.orderId) !== Number(orderId)) return;

            const chatKey = orderKeys.chat(String(orderId));

            if (payload.type === 'CHAT_MESSAGE' && payload.message) {
              const incoming = payload.message;
              queryClient.setQueryData<OrderChatConversation | null>(chatKey, (old) => {
                if (!old) return old;
                const existingIdx = old.messages.findIndex((m) => m.id === incoming.id);
                if (existingIdx !== -1) {
                  const updated = [...old.messages];
                  updated[existingIdx] = incoming;
                  return { ...old, messages: updated };
                }
                return {
                  ...old,
                  messages: [...old.messages, incoming],
                };
              });
            } else if (payload.type === 'CHAT_MESSAGE_EDIT' && payload.message) {
              const incoming = payload.message;
              queryClient.setQueryData<OrderChatConversation | null>(chatKey, (old) => {
                if (!old) return old;
                return {
                  ...old,
                  messages: old.messages.map((m) => (m.id === incoming.id ? incoming : m)),
                };
              });
            } else if (payload.type === 'CHAT_MESSAGE_DELETE' && payload.message) {
              const incoming = payload.message;
              queryClient.setQueryData<OrderChatConversation | null>(chatKey, (old) => {
                if (!old) return old;
                return {
                  ...old,
                  messages: old.messages.filter((m) => m.id !== incoming.id),
                };
              });
            }

            // Background invalidate to keep counts and server state in perfect sync
            void queryClient.invalidateQueries({ queryKey: chatKey });
          } catch (err) {
            console.error('[OrderChatWS] Failed to parse chat message frame:', err);
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: (frame) =>
        console.warn('[OrderChatWS] STOMP error:', frame.headers['message']),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      void client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [enabled, orderId, shopId, queryClient]);

  return { connected };
}
