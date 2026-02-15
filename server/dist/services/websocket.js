"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsService = void 0;
const ws_1 = require("ws");
const uuid_1 = require("uuid");
class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map();
        this.sessionClients = new Map();
    }
    initialize(server) {
        this.wss = new ws_1.WebSocketServer({ server, path: '/ws' });
        this.wss.on('connection', (ws) => {
            const clientId = (0, uuid_1.v4)();
            ws.isAlive = true;
            this.clients.set(clientId, ws);
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message, clientId);
                }
                catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            ws.on('close', () => {
                this.clients.delete(clientId);
                if (ws.sessionId) {
                    const sessionClients = this.sessionClients.get(ws.sessionId);
                    sessionClients === null || sessionClients === void 0 ? void 0 : sessionClients.delete(ws);
                }
            });
            ws.send(JSON.stringify({
                type: 'connected',
                payload: { clientId },
                timestamp: new Date().toISOString(),
            }));
        });
        setInterval(() => {
            var _a;
            (_a = this.wss) === null || _a === void 0 ? void 0 : _a.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
        console.log('WebSocket server initialized');
    }
    handleMessage(ws, message, clientId) {
        var _a, _b, _c, _d;
        switch (message.type) {
            case 'authenticate':
                ws.userId = (_a = message.payload) === null || _a === void 0 ? void 0 : _a.userId;
                ws.sessionId = (_b = message.payload) === null || _b === void 0 ? void 0 : _b.sessionId;
                if (ws.sessionId) {
                    if (!this.sessionClients.has(ws.sessionId)) {
                        this.sessionClients.set(ws.sessionId, new Set());
                    }
                    (_c = this.sessionClients.get(ws.sessionId)) === null || _c === void 0 ? void 0 : _c.add(ws);
                }
                break;
            case 'subscribe':
                if (message.payload && typeof message.payload === 'object') {
                    const { sessionId } = message.payload;
                    if (sessionId) {
                        ws.sessionId = sessionId;
                        if (!this.sessionClients.has(sessionId)) {
                            this.sessionClients.set(sessionId, new Set());
                        }
                        (_d = this.sessionClients.get(sessionId)) === null || _d === void 0 ? void 0 : _d.add(ws);
                    }
                }
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', payload: null, timestamp: new Date().toISOString() }));
                break;
        }
    }
    sendToSession(sessionId, message) {
        const sessionClients = this.sessionClients.get(sessionId);
        if (sessionClients) {
            const data = JSON.stringify(message);
            sessionClients.forEach((client) => {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(data);
                }
            });
        }
    }
    sendToUser(userId, message) {
        const data = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.userId === userId && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    emitTaskStarted(sessionId, taskId, taskType) {
        this.sendToSession(sessionId, {
            type: 'task_started',
            payload: { taskId, taskType },
            timestamp: new Date().toISOString(),
        });
    }
    emitTaskProgress(sessionId, taskId, progress, message) {
        this.sendToSession(sessionId, {
            type: 'task_progress',
            payload: { taskId, progress, message },
            timestamp: new Date().toISOString(),
        });
    }
    emitTaskCompleted(sessionId, taskId, result) {
        this.sendToSession(sessionId, {
            type: 'task_completed',
            payload: { taskId, result },
            timestamp: new Date().toISOString(),
        });
    }
    emitTaskFailed(sessionId, taskId, error) {
        this.sendToSession(sessionId, {
            type: 'task_failed',
            payload: { taskId, error },
            timestamp: new Date().toISOString(),
        });
    }
    emitSourceFound(sessionId, source) {
        this.sendToSession(sessionId, {
            type: 'source_found',
            payload: source,
            timestamp: new Date().toISOString(),
        });
    }
}
exports.wsService = new WebSocketService();
