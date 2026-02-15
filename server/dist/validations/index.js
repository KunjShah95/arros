"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = exports.memoryQuerySchema = exports.knowledgeGraphQuerySchema = exports.userIdSchema = exports.sessionIdSchema = exports.researchRequestSchema = void 0;
const zod_1 = require("zod");
exports.researchRequestSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(1000),
    userId: zod_1.z.string().uuid().optional(),
    sessionId: zod_1.z.string().uuid().optional(),
    options: zod_1.z.object({
        maxSources: zod_1.z.number().min(1).max(50).default(10),
        includeActions: zod_1.z.boolean().default(true),
        model: zod_1.z.enum(['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-haiku']).optional(),
    }).optional(),
});
exports.sessionIdSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
});
exports.userIdSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
exports.knowledgeGraphQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    query: zod_1.z.string().min(1).max(500).optional(),
    limit: zod_1.z.number().min(1).max(100).default(20),
});
exports.memoryQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['preference', 'interest', 'strategy', 'fact']).optional(),
    limit: zod_1.z.number().min(1).max(100).default(20),
});
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1).max(100).optional(),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    preferences: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
