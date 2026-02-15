"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const http_1 = require("http");
const prisma_1 = require("./services/prisma");
const cache_1 = require("./services/cache");
const websocket_1 = require("./services/websocket");
const api_1 = __importDefault(require("./routes/api"));
const auth_1 = require("./middleware/auth");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const validations_1 = require("./validations");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const port = process.env.PORT || 3001;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(rateLimiter_1.generalLimiter);
app.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
}));
app.use('/api', rateLimiter_1.researchLimiter, api_1.default);
app.use('/api/auth', rateLimiter_1.authLimiter);
app.post('/api/research', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = validations_1.researchRequestSchema.parse(req.body);
        const { AgentOrchestrator } = yield Promise.resolve().then(() => __importStar(require('./agents/orchestrator')));
        const orchestrator = new AgentOrchestrator(parsed.userId || req.userId || 'guest');
        const result = yield orchestrator.research(parsed.query);
        res.json(result);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(error, req, res, () => { });
    }
}));
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, prisma_1.connectDatabase)();
        yield cache_1.cacheService.connect();
        websocket_1.wsService.initialize(httpServer);
        httpServer.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, prisma_1.disconnectDatabase)();
    process.exit(0);
}));
startServer();
