import { StompSubscription } from '@stomp/stompjs';

export type MessageCallback<T = unknown> = (payload: T) => void;

class WebSocketService {
  private connected = false;

  connect(_token: string, onConnect?: () => void, _onDisconnect?: () => void): void {
    console.log('[WS MOCK] Connected to admin WebSocket');
    this.connected = true;
    if (onConnect) onConnect();
  }

  subscribe<T = unknown>(topic: string, _callback: MessageCallback<T>): StompSubscription | null {
    console.log(`[WS MOCK] Subscribed to ${topic}`);
    // Return a mock subscription object
    return {
      id: `mock-${Date.now()}`,
      unsubscribe: () => {
        console.log(`[WS MOCK] Unsubscribed from ${topic}`);
      }
    };
  }

  disconnect(): void {
    console.log('[WS MOCK] Disconnected');
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  onConnect(callback: () => void): void {
    if (this.connected) {
      callback();
    } else {
      // Just immediately call it in the mock
      callback();
    }
  }
}

export const websocketService = new WebSocketService();
