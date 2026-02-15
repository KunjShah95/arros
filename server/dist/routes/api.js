"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orchestrator_1 = require("../agents/orchestrator");
const prisma_1 = require("../services/prisma");
const router = (0, express_1.Router)();
router.post('/research', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query, userId } = req.body;
        if (!query || !userId) {
            return res.status(400).json({ error: 'Query and userId are required' });
        }
        const orchestrator = new orchestrator_1.AgentOrchestrator(userId);
        const result = yield orchestrator.research(query);
        res.json(result);
    }
    catch (error) {
        console.error('Research error:', error);
        res.status(500).json({ error: 'Research failed' });
    }
}));
router.get('/session/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const orchestrator = new orchestrator_1.AgentOrchestrator('');
        const session = yield orchestrator.getSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get session' });
    }
}));
router.get('/sessions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const orchestrator = new orchestrator_1.AgentOrchestrator(userId);
        const sessions = yield orchestrator.getUserSessions();
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get sessions' });
    }
}));
router.get('/sources/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const sources = yield prisma_1.prisma.source.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(sources);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get sources' });
    }
}));
router.get('/memory', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const memories = yield prisma_1.prisma.userMemory.findMany({
            where: { userId },
            orderBy: { importance: 'desc' },
            take: 50,
        });
        res.json(memories);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get memories' });
    }
}));
router.get('/interests', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const interests = yield prisma_1.prisma.userInterest.findMany({
            where: { userId },
            orderBy: { depth: 'desc' },
        });
        res.json(interests);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get interests' });
    }
}));
router.get('/knowledge-graph', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const nodes = yield prisma_1.prisma.knowledgeNode.findMany({
            include: {
                edgesFrom: true,
                edgesTo: true,
            },
        });
        res.json(nodes);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get knowledge graph' });
    }
}));
exports.default = router;
