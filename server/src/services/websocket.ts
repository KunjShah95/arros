import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';

export type MessageType = 
  | 'task_started'
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'source_found'
  | 'error'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: MessageType;
  payload: unknown;
  timestamp: string;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  isAlive?: boolean;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private sessionClients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: AuthenticatedWebSocket) => {
      const clientId = uuidv4();
      ws.isAlive = true;
      this.clients.set(clientId, ws);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message, clientId);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        if (ws.sessionId) {
          const sessionClients = this.sessionClients.get(ws.sessionId);
          sessionClients?.delete(ws);
        }
      });

      ws.send(JSON.stringify({
        type: 'connected',
        payload: { clientId },
        timestamp: new Date().toISOString(),
      }));
    });

    setInterval(() => {
      this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    console.log('WebSocket server initialized');
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: { type: string; payload?: unknown }, clientId: string): void {
    switch (message.type) {
      case 'authenticate':
        ws.userId = (message.payload as { userId?: string })?.userId;
        ws.sessionId = (message.payload as { sessionId?: string })?.sessionId;
        if (ws.sessionId) {
          if (!this.sessionClients.has(ws.sessionId)) {
            this.sessionClients.set(ws.sessionId, new Set());
          }
          this.sessionClients.get(ws.sessionId)?.add(ws);
        }
        break;

      case 'subscribe':
        if (message.payload && typeof message.payload === 'object') {
          const { sessionId } = message.payload as { sessionId?: string };
          if (sessionId) {
            ws.sessionId = sessionId;
            if (!this.sessionClients.has(sessionId)) {
              this.sessionClients.set(sessionId, new Set());
            }
            this.sessionClients.get(sessionId)?.add(ws);
          }
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', payload: null, timestamp: new Date().toISOString() }));
        break;
    }
  }

  sendToSession(sessionId: string, message: WebSocketMessage): void {
    const sessionClients = this.sessionClients.get(sessionId);
    if (sessionClients) {
      const data = JSON.stringify(message);
      sessionClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }

  sendToUser(userId: string, message: WebSocketMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.userId === userId && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  emitTaskStarted(sessionId: string, taskId: string, taskType: string): void {
    this.sendToSession(sessionId, {
      type: 'task_started',
      payload: { taskId, taskType },
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskProgress(sessionId: string, taskId: string, progress: number, message?: string): void {
    this.sendToSession(sessionId, {
      type: 'task_progress',
      payload: { taskId, progress, message },
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskCompleted(sessionId: string, taskId: string, result: unknown): void {
    this.sendToSession(sessionId, {
      type: 'task_completed',
      payload: { taskId, result },
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskFailed(sessionId: string, taskId: string, error: string): void {
    this.sendToSession(sessionId, {
      type: 'task_failed',
      payload: { taskId, error },
      timestamp: new Date().toISOString(),
    });
  }

  emitSourceFound(sessionId: string, source: { title: string; url: string }): void {
    this.sendToSession(sessionId, {
      type: 'source_found',
      payload: source,
      timestamp: new Date().toISOString(),
    });
  }
}

export const wsService = new WebSocketService();
