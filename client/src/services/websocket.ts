import { useEffect, useRef, useCallback } from 'react';

export type MessageType = 
  | 'connected'
  | 'task_started'
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'source_found'
  | 'error'
  | 'pong';

export interface WebSocketMessage {
  type: MessageType;
  payload: unknown;
  timestamp: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

const getWebSocketUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }
  return 'ws://localhost:3001/ws';
};

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<MessageType, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private sessionId: string | null = null;

  constructor(url?: string) {
    this.url = url || getWebSocketUrl();
  }

  connect(sessionId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId || null;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          if (sessionId) {
            this.subscribe(sessionId);
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.notifyHandlers(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => {
        this.connect(this.sessionId || undefined).catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(sessionId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        payload: { sessionId },
      }));
    }
  }

  authenticate(userId: string, sessionId?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'authenticate',
        payload: { userId, sessionId },
      }));
    }
  }

  on(type: MessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  off(type: MessageType, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private notifyHandlers(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

const wsClient = new WebSocketClient();

export function useWebSocket(sessionId?: string) {
  const wsRef = useRef(wsClient);

  useEffect(() => {
    if (sessionId) {
      wsRef.current.connect(sessionId).catch(console.error);
    }

    return () => {
      wsRef.current.disconnect();
    };
  }, [sessionId]);

  const on = useCallback((type: MessageType, handler: MessageHandler) => {
    return wsRef.current.on(type, handler);
  }, []);

  const subscribe = useCallback((sessionId: string) => {
    wsRef.current.subscribe(sessionId);
  }, []);

  return {
    on,
    subscribe,
    isConnected: wsRef.current.isConnected(),
  };
}

export { wsClient };
export default wsClient;
