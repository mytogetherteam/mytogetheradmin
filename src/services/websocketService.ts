import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { config } from '@/config/config';

export type MessageCallback<T = unknown> = (payload: T) => void;

class WebSocketService {
  private client: Client | null = null;
  private connected = false;

  /**
   * Connect to the STOMP broker using SockJS transport.
   * The JWT is sent in the CONNECT frame's Authorization header.
   */
  connect(token: string, onConnect?: () => void, onDisconnect?: () => void): void {
    if (this.client?.active) {
      return; // Already connected / connecting
    }

    const wsUrl = import.meta.env.DEV
      ? `${window.location.origin}${config.websocket.endpoint}`
      : `${import.meta.env.VITE_API_BASE_URL || 'https://mytogetherapi-production.up.railway.app'}${config.websocket.endpoint}`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
        console.log('[WS] Connected to admin WebSocket');
        onConnect?.();
      },
      onDisconnect: () => {
        this.connected = false;
        console.log('[WS] Disconnected from admin WebSocket');
        onDisconnect?.();
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message']);
      },
    });

    this.client.activate();
  }

  /**
   * Subscribe to a topic. Returns the subscription so the caller can unsubscribe.
   */
  subscribe<T = unknown>(topic: string, callback: MessageCallback<T>): StompSubscription | null {
    if (!this.client?.active || !this.connected) {
      console.warn('[WS] Cannot subscribe — client not connected yet.');
      return null;
    }
    return this.client.subscribe(topic, (message) => {
      try {
        const payload: T = JSON.parse(message.body);
        callback(payload);
      } catch {
        console.error('[WS] Failed to parse message body:', message.body);
      }
    });
  }

  /**
   * Gracefully disconnect the STOMP client.
   */
  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
    }
    this.client = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Register a callback that runs once the client is connected (useful for
   * subscribing immediately after connection while the client is still activating).
   */
  onConnect(callback: () => void): void {
    if (!this.client) return;
    const original = this.client.onConnect.bind(this.client);
    this.client.onConnect = (frame) => {
      original(frame);
      callback();
    };
  }
}

export const websocketService = new WebSocketService();
