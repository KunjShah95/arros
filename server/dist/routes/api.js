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
const express_1 = require("express");
const orchestrator_1 = require("../agents/orchestrator");
const humanBrainOrchestrator_1 = require("../agents/humanBrainOrchestrator");
const spacedRepetition_1 = require("../agents/spacedRepetition");
const nightResearchScheduler_1 = require("../agents/nightResearchScheduler");
const pdfResearcher_1 = require("../agents/pdfResearcher");
const xpSystem_1 = require("../agents/xpSystem");
const prisma_1 = require("../services/prisma");
const sarvam_1 = require("../services/sarvam");
const export_1 = require("../services/export");
const integrations_1 = require("../services/integrations");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
// Brain instance cache — one brain per user per server lifetime
const brainCache = new Map();
function getBrain(userId) {
    if (!brainCache.has(userId)) {
        brainCache.set(userId, new humanBrainOrchestrator_1.HumanBrainOrchestrator(userId, true));
    }
    return brainCache.get(userId);
}
router.post('/research', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query, useBrain = true } = req.body;
        const userId = req.userId || 'guest';
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        if (useBrain) {
            // Use the Human Brain Orchestrator for human-like cognition
            const brain = getBrain(userId);
            const result = yield brain.research(query);
            res.json(result);
        }
        else {
            // Fallback to standard orchestrator
            const orchestrator = new orchestrator_1.AgentOrchestrator(userId);
            const result = yield orchestrator.research(query);
            res.json(result);
        }
    }
    catch (error) {
        console.error('Research error:', error);
        res.status(500).json({ error: 'Research failed' });
    }
}));
// ─── Human Brain API Endpoints ────────────────────────────────────────────────
/** GET /api/brain/state — Get current cognitive state of the brain */
router.get('/brain/state', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const brain = getBrain(userId);
        const state = yield brain.getBrainState();
        res.json(state);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get brain state' });
    }
}));
/** POST /api/brain/sleep — Run offline memory consolidation */
router.post('/brain/sleep', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const brain = getBrain(userId);
        yield brain.sleep();
        res.json({ success: true, message: 'Memory consolidation complete — brain refreshed' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to run consolidation' });
    }
}));
/** GET /api/brain/curiosities — What the brain is most curious about */
router.get('/brain/curiosities', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        // Curiosity state comes from active interests
        const interests = yield prisma_1.prisma.userInterest.findMany({
            where: { userId },
            orderBy: { depth: 'desc' },
            take: 10,
        });
        res.json({
            topCuriosities: interests.map(i => ({
                topic: i.topic,
                depth: i.depth,
                lastExplored: i.lastResearchedAt,
                curiosityScore: Math.min(1, i.depth * 0.1),
            }))
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get curiosities' });
    }
}));
/** GET /api/brain/config — Brain architecture metadata */
router.get('/brain/config', (0, auth_1.authenticate)({ optional: true }), (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({
        architecture: 'Human Brain Cognitive Architecture v1.0',
        modules: [
            { name: 'CognitiveCore', analog: 'Prefrontal Cortex', role: 'Executive function, decision-making, deliberate reasoning' },
            { name: 'EmotionalEngine', analog: 'Limbic System', role: 'Emotional state tracking, somatic markers, motivation' },
            { name: 'IntuitionEngine', analog: 'Basal Ganglia + VMPFC', role: 'Fast pattern recognition, System 1 thinking' },
            { name: 'WorkingMemory', analog: 'Dorsolateral PFC', role: 'Active context buffer, 7±2 item capacity' },
            { name: 'CuriosityEngine', analog: 'Nucleus Accumbens + Dopamine', role: 'Information gap detection, self-directed learning' },
            { name: 'SelfAwarenessModule', analog: 'Anterior Cingulate Cortex', role: 'Error monitoring, metacognition, bias detection' },
            { name: 'DreamConsolidator', analog: 'Hippocampus during sleep', role: 'Memory consolidation, insight extraction, pruning' },
        ],
        cognitivePrinciples: [
            'Dual Process Theory (System 1 + System 2)',
            'Global Workspace Theory',
            'Predictive Processing',
            'Somatic Marker Hypothesis (Damasio)',
            'Information Gap Theory (Loewenstein)',
            'Metacognition (Flavell)',
            'Systems Consolidation Theory',
        ],
    });
}));
// ─── Spaced Repetition API ────────────────────────────────────────────────────
/** GET /api/flashcards — Get all flashcards for user */
router.get('/flashcards', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const { topic } = req.query;
        const engine = new spacedRepetition_1.SpacedRepetitionEngine(userId);
        const cards = yield engine.getAllCards();
        const filtered = topic ? cards.filter(c => c.topic.toLowerCase().includes(topic.toLowerCase())) : cards;
        res.json(filtered);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get flashcards' });
    }
}));
/** GET /api/flashcards/due — Get cards due for review */
router.get('/flashcards/due', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const limit = parseInt(req.query.limit) || 20;
        const engine = new spacedRepetition_1.SpacedRepetitionEngine(userId);
        const dueCards = yield engine.getDueCards(limit);
        res.json(dueCards);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get due cards' });
    }
}));
/** GET /api/flashcards/stats — Study statistics */
router.get('/flashcards/stats', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const engine = new spacedRepetition_1.SpacedRepetitionEngine(userId);
        const stats = yield engine.getStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
}));
/** POST /api/flashcards/review — Submit a review result */
router.post('/flashcards/review', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const { cardId, quality, responseTimeMs } = req.body;
        if (!cardId || quality === undefined)
            return res.status(400).json({ error: 'cardId and quality required' });
        const engine = new spacedRepetition_1.SpacedRepetitionEngine(userId);
        const updated = yield engine.processReview(cardId, quality, responseTimeMs || 5000);
        // Award XP
        const xp = new xpSystem_1.XPSystem(userId);
        yield xp.awardXP('flashcard_review');
        if (quality === 5)
            yield xp.awardXP('perfect_recall');
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to process review' });
    }
}));
/** POST /api/flashcards/generate — Generate flashcards from a session */
router.post('/flashcards/generate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.userId || 'guest';
        const { sessionId, topic } = req.body;
        if (!sessionId)
            return res.status(400).json({ error: 'sessionId required' });
        // Get the session synthesis
        const session = yield prisma_1.prisma.session.findUnique({ where: { id: sessionId }, include: { outputs: true } });
        if (!session)
            return res.status(404).json({ error: 'Session not found' });
        const synthesis = ((_b = (_a = session.outputs) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) ? JSON.parse(session.outputs[0].content) : null;
        if (!synthesis)
            return res.status(400).json({ error: 'No synthesis found for this session' });
        const engine = new spacedRepetition_1.SpacedRepetitionEngine(userId);
        const cards = yield engine.generateFromResearch(synthesis, topic || session.query || 'Research', sessionId);
        res.json({ cardsGenerated: cards.length, cards });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate flashcards' });
    }
}));
/** DELETE /api/flashcards/:id — Delete a flashcard */
router.delete('/flashcards/:id', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const engine = new spacedRepetition_1.SpacedRepetitionEngine(userId);
        yield engine.deleteCard(String(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete flashcard' });
    }
}));
// ─── Night Research Scheduler API ─────────────────────────────────────────────
/** GET /api/night/digest — Get today's morning digest */
router.get('/night/digest', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const scheduler = new nightResearchScheduler_1.NightResearchScheduler();
        const digest = yield scheduler.getMorningDigest(userId);
        res.json(digest || { readyForReview: false, message: 'No digest for today yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get digest' });
    }
}));
/** GET /api/night/digests — Get past digests */
router.get('/night/digests', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const days = parseInt(req.query.days) || 7;
        const scheduler = new nightResearchScheduler_1.NightResearchScheduler();
        const digests = yield scheduler.getPastDigests(userId, days);
        res.json(digests);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get past digests' });
    }
}));
/** POST /api/night/run — Manually trigger overnight research */
router.post('/night/run', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const scheduler = new nightResearchScheduler_1.NightResearchScheduler();
        const digest = yield scheduler.triggerManual(userId);
        // Award XP for night discovery
        const xp = new xpSystem_1.XPSystem(userId);
        yield xp.awardXP('night_discovery');
        res.json(digest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to run overnight research' });
    }
}));
// ─── PDF & YouTube Research API ────────────────────────────────────────────────
/** POST /api/media/pdf — Analyze an uploaded PDF */
const pdfUpload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
router.post('/media/pdf', (0, auth_1.authenticate)({ optional: true }), pdfUpload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        if (!req.file)
            return res.status(400).json({ error: 'No file uploaded' });
        // Extract text from PDF buffer
        let text = '';
        try {
            // Try using pdf-parse if installed
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pdfParse = require('pdf-parse');
            const data = yield pdfParse(req.file.buffer);
            text = data.text;
        }
        catch (_a) {
            // Fallback: treat as plain text
            text = req.file.buffer.toString('utf-8');
        }
        const researcher = new pdfResearcher_1.PDFResearcher(userId);
        const analysis = yield researcher.analyzeText(text, req.file.originalname);
        // Award XP
        const xp = new xpSystem_1.XPSystem(userId);
        yield xp.awardXP('pdf_upload', { filename: req.file.originalname });
        res.json(analysis);
    }
    catch (error) {
        console.error('PDF analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze PDF' });
    }
}));
/** POST /api/media/youtube — Analyze a YouTube video */
router.post('/media/youtube', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const { url } = req.body;
        if (!url)
            return res.status(400).json({ error: 'YouTube URL required' });
        const researcher = new pdfResearcher_1.YouTubeResearcher(userId);
        const analysis = yield researcher.analyzeVideo(url);
        // Award XP
        const xp = new xpSystem_1.XPSystem(userId);
        yield xp.awardXP('youtube_research', { url });
        res.json(analysis);
    }
    catch (error) {
        console.error('YouTube analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze YouTube video' });
    }
}));
// ─── XP & Gamification API ─────────────────────────────────────────────────────
/** GET /api/xp/profile — Full XP profile */
router.get('/xp/profile', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const xp = new xpSystem_1.XPSystem(userId);
        const profile = yield xp.getProfile();
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get XP profile' });
    }
}));
/** POST /api/xp/award — Award XP (internal, but useful for testing) */
router.post('/xp/award', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const { action, metadata } = req.body;
        const xp = new xpSystem_1.XPSystem(userId);
        const result = yield xp.awardXP(action, metadata);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to award XP' });
    }
}));
router.get('/session/:sessionId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const brain = getBrain(req.userId || 'guest');
        const session = yield brain.getSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get session' });
    }
}));
router.get('/sessions', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const brain = getBrain(userId);
        const sessions = yield brain.getUserSessions();
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get sessions' });
    }
}));
router.get('/sources/:sessionId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get('/memory', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
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
router.get('/interests', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
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
router.get('/knowledge-graph', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
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
router.get('/research/export/:sessionId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const task = yield prisma_1.prisma.agentTask.findFirst({
            where: { sessionId: sessionId, type: 'synthesizer' },
            orderBy: { createdAt: 'desc' }
        });
        if (!task || !task.output) {
            return res.status(404).json({ error: 'Synthesis not found for this session' });
        }
        const markdown = export_1.ExportService.toMarkdown(task.output);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="ARROS-Research-${sessionId}.md"`);
        res.send(markdown);
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
}));
router.get('/integrations', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const integrations = yield integrations_1.IntegrationService.getIntegrations(req.userId || 'guest');
        res.json(integrations);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get integrations' });
    }
}));
router.post('/research/action/execute', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { action, integrationId } = req.body;
        const result = yield integrations_1.IntegrationService.executeAction(action, integrationId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to execute action' });
    }
}));
router.post('/research/stream', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.body;
        const userId = req.userId || 'guest';
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const brain = getBrain(userId);
        res.write(`data: ${JSON.stringify({ type: 'started', query })}\n\n`);
        const result = yield brain.research(query);
        res.write(`data: ${JSON.stringify({ type: 'completed', result })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error('Streaming research error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Research failed' })}\n\n`);
        res.end();
    }
}));
router.get('/agents/config', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json({
            researchTypes: ['web', 'academic', 'code', 'news'],
            criticTypes: ['verifier', 'bias', 'contradiction'],
            memoryTypes: ['shortTerm', 'longTerm', 'knowledgeGraph'],
            actionTypes: ['prd', 'ticket', 'code', 'decision'],
            availableModels: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-haiku'],
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get agent config' });
    }
}));
router.get('/evaluations/:sessionId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const evaluations = yield prisma_1.prisma.evaluation.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(evaluations);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get evaluations' });
    }
}));
router.get('/analytics/usage', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const sessions = yield prisma_1.prisma.session.findMany({
            where: { userId, createdAt: { gte: startDate } },
            include: { tasks: true, sources: true },
        });
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'completed').length;
        const totalSources = sessions.reduce((acc, s) => acc + s.sources.length, 0);
        const totalTasks = sessions.reduce((acc, s) => acc + s.tasks.length, 0);
        const totalCost = sessions.reduce((acc, s) => acc + s.tasks.reduce((tacc, t) => tacc + (t.cost || 0), 0), 0);
        res.json({
            period: { days, startDate, endDate: new Date() },
            summary: {
                totalSessions,
                completedSessions,
                totalSources,
                totalTasks,
                totalCost: Math.round(totalCost * 10000) / 10000,
            },
            sessions: sessions.map(s => ({
                id: s.id,
                title: s.title,
                status: s.status,
                createdAt: s.createdAt,
                taskCount: s.tasks.length,
                sourceCount: s.sources.length,
            })),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
}));
router.post('/memory/search', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const { query, limit = 5 } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        const { MemoryFleet } = yield Promise.resolve().then(() => __importStar(require('../agents/subagents/memoryFleet')));
        const memoryFleet = new MemoryFleet(userId, 'search-session');
        const memories = yield memoryFleet.retrieveMemory(query, limit);
        res.json(memories);
    }
    catch (error) {
        console.error('Memory search error:', error);
        res.status(500).json({ error: 'Failed to search memories' });
    }
}));
router.delete('/memory/:memoryId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const memoryId = req.params.memoryId;
        yield prisma_1.prisma.userMemory.deleteMany({
            where: { id: memoryId, userId: userId },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete memory' });
    }
}));
router.delete('/knowledge-graph/:nodeId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const nodeId = req.params.nodeId;
        yield prisma_1.prisma.knowledgeEdge.deleteMany({
            where: {
                OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }],
            },
        });
        yield prisma_1.prisma.knowledgeNode.delete({
            where: { id: nodeId },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete node' });
    }
}));
router.get('/tasks/:sessionId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const tasks = yield prisma_1.prisma.agentTask.findMany({
            where: { sessionId: sessionId },
            orderBy: { createdAt: 'asc' },
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get tasks' });
    }
}));
// Sarvam AI Integration Routes
// Note: Sarvam AI does not provide OCR service. This is a placeholder.
// For OCR, consider using Google Cloud Vision, AWS Textract, or Tesseract.js
router.post('/sarvam/ocr', upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { imageUrl, language = 'en' } = req.body;
        const imageFile = req.file;
        if (!imageUrl && !imageFile) {
            return res.status(400).json({ error: 'imageUrl or image file is required' });
        }
        let result;
        if (imageFile) {
            result = yield sarvam_1.sarvamClient.performOCR(imageFile, language);
        }
        else if (imageUrl) {
            result = yield sarvam_1.sarvamClient.performOCR(imageUrl, language);
        }
        res.json(result);
    }
    catch (error) {
        console.error('OCR error:', error);
        res.status(500).json({ error: 'OCR processing failed' });
    }
}));
router.post('/sarvam/tts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, language = 'en', voice = 'female' } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'text is required' });
        }
        const result = yield sarvam_1.sarvamClient.textToSpeech({
            text,
            language,
            voice,
        });
        res.json(result);
    }
    catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: 'Text-to-speech conversion failed' });
    }
}));
router.post('/sarvam/stt', upload.single('audio'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { audioUrl, language = 'en' } = req.body;
        const audioFile = req.file;
        if (!audioUrl && !audioFile) {
            return res.status(400).json({ error: 'audioUrl or audio file is required' });
        }
        let result;
        if (audioFile) {
            result = yield sarvam_1.sarvamClient.speechToText(audioFile, language);
        }
        else if (audioUrl) {
            result = yield sarvam_1.sarvamClient.speechToText(audioUrl, language);
        }
        res.json(result);
    }
    catch (error) {
        console.error('STT error:', error);
        res.status(500).json({ error: 'Speech-to-text conversion failed' });
    }
}));
router.get('/sarvam/voices', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const voices = yield sarvam_1.sarvamClient.getAvailableVoices();
        res.json({ voices });
    }
    catch (error) {
        console.error('Get voices error:', error);
        res.status(500).json({ error: 'Failed to get available voices' });
    }
}));
router.get('/sarvam/languages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const languages = yield sarvam_1.sarvamClient.getSupportedLanguages();
        res.json({ languages });
    }
    catch (error) {
        console.error('Get languages error:', error);
        res.status(500).json({ error: 'Failed to get supported languages' });
    }
}));
const studyOS_1 = require("../agents/studyOS");
const conceptCoach_1 = require("../agents/conceptCoach");
const assignmentEvaluator_1 = require("../agents/assignmentEvaluator");
const integrity_1 = require("../agents/integrity");
const studyPlanner_1 = require("../agents/studyPlanner");
const codeDebugCoach_1 = require("../agents/codeDebugCoach");
const careerNavigator_1 = require("../agents/careerNavigator");
const confidenceBooster_1 = require("../agents/confidenceBooster");
const fallacyDetector_1 = require("../agents/fallacyDetector");
const uuid_1 = require("uuid");
router.post('/studyos/exam-prep', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, topic, options } = req.body;
        const userId = req.userId || 'guest';
        const sessionId = req.body.sessionId || (0, uuid_1.v4)();
        const taskId = (0, uuid_1.v4)();
        if (!content || !topic) {
            return res.status(400).json({ error: 'Content and topic are required' });
        }
        const studyAgent = new studyOS_1.StudyOSAgent(sessionId, userId, taskId);
        const result = yield studyAgent.generateExamPrepMaterials(content, topic, options || {});
        res.json(result);
    }
    catch (error) {
        console.error('StudyOS exam prep error:', error);
        res.status(500).json({ error: 'Failed to generate exam prep materials' });
    }
}));
router.post('/studyos/from-pdf', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const sessionId = (0, uuid_1.v4)();
        const taskId = (0, uuid_1.v4)();
        const title = req.body.title || 'PDF Study Session';
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required' });
        }
        const pdfText = req.file.buffer.toString('utf-8');
        const studyAgent = new studyOS_1.StudyOSAgent(sessionId, userId, taskId);
        const result = yield studyAgent.generateFromPDF(pdfText, title);
        res.json(result);
    }
    catch (error) {
        console.error('StudyOS PDF error:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
}));
router.post('/studyos/continue', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { previousMaterials, focusAreas } = req.body;
        const userId = req.userId || 'guest';
        const sessionId = (0, uuid_1.v4)();
        const taskId = (0, uuid_1.v4)();
        if (!previousMaterials) {
            return res.status(400).json({ error: 'Previous materials are required' });
        }
        const studyAgent = new studyOS_1.StudyOSAgent(sessionId, userId, taskId);
        const result = yield studyAgent.continueStudySession(previousMaterials, focusAreas);
        res.json(result);
    }
    catch (error) {
        console.error('StudyOS continue error:', error);
        res.status(500).json({ error: 'Failed to continue study session' });
    }
}));
router.post('/studyos/share', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { materials, options } = req.body;
        const userId = req.userId || 'guest';
        if (!materials) {
            return res.status(400).json({ error: 'Materials are required' });
        }
        const shareAgent = new studyOS_1.DecentralizedShareAgent(userId);
        const result = yield shareAgent.createShareableStudyBundle(materials, options || {});
        res.json(result);
    }
    catch (error) {
        console.error('StudyOS share error:', error);
        res.status(500).json({ error: 'Failed to create shareable bundle' });
    }
}));
router.get('/studyos/bundle/:bundleId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bundleId = req.params.bundleId;
        const bundle = yield prisma_1.prisma.agentOutput.findFirst({
            where: { sessionId: bundleId },
        });
        if (!bundle) {
            return res.status(404).json({ error: 'Bundle not found' });
        }
        res.json(bundle);
    }
    catch (error) {
        console.error('StudyOS bundle error:', error);
        res.status(500).json({ error: 'Failed to get bundle' });
    }
}));
router.post('/studyos/srs/create-queue', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cards, settings } = req.body;
        const userId = req.userId || 'guest';
        const srsAgent = new studyOS_1.SpacedRepetitionAgent(userId);
        const result = yield srsAgent.createSRSQueue(cards, settings);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create SRS queue' });
    }
}));
router.post('/studyos/srs/review', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cardId, quality } = req.body;
        const srsAgent = new studyOS_1.SpacedRepetitionAgent(req.userId || 'guest');
        const result = yield srsAgent.reviewCard(cardId, quality);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to review card' });
    }
}));
router.get('/studyos/srs/due', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const srsAgent = new studyOS_1.SpacedRepetitionAgent(req.userId || 'guest');
        const cards = yield srsAgent.getDueCards();
        const stats = yield srsAgent.getReviewStats();
        res.json({ dueCards: cards, stats });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get due cards' });
    }
}));
router.post('/studyos/formulas', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, content } = req.body;
        const agent = new studyOS_1.FormulaSheetAgent();
        const result = yield agent.generateFormulaSheet(topic, content);
        const cheatSheet = agent.generateCheatSheet([result]);
        res.json({ formulaSheet: result, cheatSheet });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate formula sheet' });
    }
}));
router.post('/studyos/mock-exam', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, content, options } = req.body;
        const agent = new studyOS_1.MockExamAgent();
        const exam = yield agent.generateMockExam(topic, content, options);
        const answerKey = agent.generateAnswerKey(exam);
        res.json({ exam, answerKey });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate mock exam' });
    }
}));
router.post('/studyos/schedule', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, subtopics, examDate, dailyHours } = req.body;
        const agent = new studyOS_1.RevisionSchedulerAgent();
        const schedule = yield agent.generateSchedule(topic, subtopics, new Date(examDate), dailyHours);
        const progress = agent.getProgress(schedule);
        res.json({ schedule, progress });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate schedule' });
    }
}));
router.post('/studyos/literature-review', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, papers } = req.body;
        const agent = new studyOS_1.LiteratureReviewAgent();
        const review = yield agent.buildLiteratureReview(topic, papers);
        res.json(review);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to build literature review' });
    }
}));
router.get('/studyos/related-papers/:topic', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const topic = req.params.topic;
        const agent = new studyOS_1.LiteratureReviewAgent();
        const papers = yield agent.getRelatedPapers(topic);
        res.json({ papers });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to find related papers' });
    }
}));
router.post('/studyos/validate-thesis', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { thesis, context } = req.body;
        const agent = new studyOS_1.ThesisValidatorAgent();
        const result = yield agent.validateThesis(thesis, context);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to validate thesis' });
    }
}));
router.post('/studyos/research-gaps', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, existingPapers } = req.body;
        const agent = new studyOS_1.ResearchGapFinderAgent();
        const gaps = yield agent.findGaps(topic, existingPapers || []);
        res.json({ gaps });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to find research gaps' });
    }
}));
router.post('/studyos/citations', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { papers, format } = req.body;
        const agent = new studyOS_1.CitationGeneratorAgent();
        const citations = yield agent.formatReferences(papers, format || 'apa');
        res.json({ citations });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate citations' });
    }
}));
router.post('/studyos/compare-papers', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { papers } = req.body;
        const agent = new studyOS_1.PaperComparatorAgent();
        const result = yield agent.comparePapers(papers);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to compare papers' });
    }
}));
router.post('/studyos/mindmap', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, content } = req.body;
        const agent = new studyOS_1.MindMapGeneratorAgent();
        const mindmap = yield agent.generateMindMap(topic, content);
        const mermaidCode = agent.generateMermaidCode(mindmap);
        res.json({ mindmap, mermaidCode });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate mind map' });
    }
}));
router.post('/studyos/socratic/ask', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, context } = req.body;
        const agent = new studyOS_1.SocraticTutorAgent();
        const question = yield agent.askQuestion(topic, context);
        res.json(question);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to ask question' });
    }
}));
router.post('/studyos/socratic/evaluate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { question, answer } = req.body;
        const agent = new studyOS_1.SocraticTutorAgent();
        const result = yield agent.evaluateAnswer(question, answer);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to evaluate answer' });
    }
}));
router.post('/studyos/explain-level', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { concept, level } = req.body;
        const agent = new studyOS_1.SocraticTutorAgent();
        const explanation = yield agent.explainAtLevel(concept, level || 2);
        res.json({ explanation });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to explain concept' });
    }
}));
router.post('/studyos/dependency-graph', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { concepts, content } = req.body;
        const agent = new studyOS_1.ConceptDependencyAgent();
        const dependencies = yield agent.buildDependencyGraph(concepts, content);
        const learningPath = agent.suggestLearningPath(dependencies);
        res.json({ dependencies, learningPath });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to build dependency graph' });
    }
}));
router.post('/studyos/anki/export', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cards, deckName, format } = req.body;
        const agent = new studyOS_1.AnkiExportAgent();
        const deck = agent.generateAnkiDeck(cards, deckName || 'StudyOS Deck');
        if (format === 'csv') {
            const csv = yield agent.exportToCSV(deck);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${deckName}.csv"`);
            return res.send(csv);
        }
        res.json({ deck });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to export to Anki' });
    }
}));
router.get('/studyos/analytics', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.LearningAnalyticsAgent();
        const analytics = yield agent.getAnalytics(userId);
        const insights = agent.generateInsights(analytics);
        res.json({ analytics, insights });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
}));
router.post('/studyos/video/summarize', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { url } = req.body;
        const agent = new studyOS_1.VideoSummarizerAgent();
        const summary = yield agent.summarizeVideo(url);
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to summarize video' });
    }
}));
router.post('/studyos/room/create', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, topic } = req.body;
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.CollaborativeStudyRoomAgent();
        const room = yield agent.createRoom(name, topic, userId);
        res.json(room);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create room' });
    }
}));
router.post('/studyos/room/join', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.body;
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.CollaborativeStudyRoomAgent();
        const room = yield agent.joinRoom(roomId, userId);
        if (!room)
            return res.status(404).json({ error: 'Room not found' });
        res.json(room);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to join room' });
    }
}));
router.get('/studyos/room/active', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agent = new studyOS_1.CollaborativeStudyRoomAgent();
        const rooms = yield agent.getActiveRooms();
        res.json({ rooms });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get rooms' });
    }
}));
router.post('/studyos/pomodoro/start', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, duration, task } = req.body;
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.PomodoroAgent();
        const session = yield agent.startSession(userId, type, duration, task);
        res.json(session);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to start session' });
    }
}));
router.post('/studyos/pomodoro/complete', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.body;
        const agent = new studyOS_1.PomodoroAgent();
        const session = yield agent.completeSession(sessionId);
        res.json(session);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to complete session' });
    }
}));
router.get('/studyos/pomodoro/stats', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.PomodoroAgent();
        const stats = yield agent.getTodayStats(userId);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
}));
router.post('/studyos/errors/log', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, question, yourAnswer, correctAnswer, mistakeType } = req.body;
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.ErrorTrackingAgent();
        const error = yield agent.logError({ userId, topic, question, yourAnswer, correctAnswer, mistakeType });
        res.json(error);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to log error' });
    }
}));
router.get('/studyos/errors/weak-areas', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.ErrorTrackingAgent();
        const weakAreas = yield agent.getWeakAreas(userId);
        const plan = agent.generateRemedialStudyplan(weakAreas);
        res.json({ weakAreas, plan });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get weak areas' });
    }
}));
router.post('/studyos/question-bank/add', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { question, options, correctAnswer, explanation, topic, difficulty, author } = req.body;
        const agent = new studyOS_1.QuestionBankAgent();
        const item = yield agent.addQuestion({ question, options, correctAnswer, explanation, topic, difficulty, author: author || 'User' });
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add question' });
    }
}));
router.get('/studyos/question-bank', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, difficulty, limit } = req.query;
        const agent = new studyOS_1.QuestionBankAgent();
        const questions = yield agent.getQuestions(topic, difficulty, Number(limit) || 20);
        res.json({ questions });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get questions' });
    }
}));
router.post('/studyos/question-bank/generate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, content, count } = req.body;
        const agent = new studyOS_1.QuestionBankAgent();
        const questions = yield agent.generateFromContent(topic, content, count || 10);
        res.json({ questions });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate questions' });
    }
}));
router.get('/studyos/gamification/profile', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.GamificationAgent();
        const profile = yield agent.getUserProfile(userId);
        const levelInfo = agent.getLevelProgress(profile.xp);
        res.json({ profile, levelInfo });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
}));
router.post('/studyos/gamification/badges', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new studyOS_1.GamificationAgent();
        const newBadges = yield agent.checkAndAwardBadges(userId);
        res.json({ newBadges });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to check badges' });
    }
}));
router.post('/studyos/pdf/annotate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pdfId, annotations } = req.body;
        const agent = new studyOS_1.PDFAnnotationAgent();
        yield agent.annotatePDF(pdfId, annotations);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to annotate PDF' });
    }
}));
router.get('/studyos/pdf/annotations/:pdfId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pdfId = req.params.pdfId;
        const agent = new studyOS_1.PDFAnnotationAgent();
        const annotations = yield agent.getAnnotations(pdfId);
        res.json({ annotations });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get annotations' });
    }
}));
router.post('/studyos/pdf/highlights', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const agent = new studyOS_1.PDFAnnotationAgent();
        const highlights = yield agent.generateHighlights(content);
        res.json({ highlights });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate highlights' });
    }
}));
router.post('/studyos/exam/countdown', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, date, subject } = req.body;
        const examDate = new Date(date);
        const agent = new studyOS_1.ExamCountdownAgent();
        const countdown = agent.getCountdown(examDate);
        const urgency = agent.getUrgencyLevel(countdown.days);
        res.json({ name, subject, date: examDate, countdown, urgency });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to set countdown' });
    }
}));
// ============ NEW LEARNING OS MODULES ============
// Concept Coach Agent
router.post('/coach/explain', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, level, context } = req.body;
        const userId = req.userId || 'guest';
        const agent = new conceptCoach_1.ConceptCoachAgent(userId);
        const result = yield agent.explainStepwise(topic, level, context);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to explain concept' });
    }
}));
router.post('/coach/hint', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { question, attemptNumber, previousAnswer, context } = req.body;
        const userId = req.userId || 'guest';
        const agent = new conceptCoach_1.ConceptCoachAgent(userId);
        const result = yield agent.giveHint(question, attemptNumber, previousAnswer, context);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get hint' });
    }
}));
router.get('/coach/mastery/:topic', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const topic = req.params.topic;
        const userId = req.userId || 'guest';
        const agent = new conceptCoach_1.ConceptCoachAgent(userId);
        const result = yield agent.assessMastery(topic);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to assess mastery' });
    }
}));
router.get('/coach/weak-topics', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new conceptCoach_1.ConceptCoachAgent(userId);
        const result = yield agent.detectWeakTopics();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to detect weak topics' });
    }
}));
router.post('/coach/adapt-difficulty', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { correctAnswers, totalQuestions, avgResponseTime, hintsUsed } = req.body;
        const userId = req.userId || 'guest';
        const agent = new conceptCoach_1.ConceptCoachAgent(userId);
        const result = yield agent.adaptDifficulty({ correctAnswers, totalQuestions, avgResponseTime, hintsUsed });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to adapt difficulty' });
    }
}));
router.get('/coach/mastery-graph', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const generator = new conceptCoach_1.MasteryGraphGenerator();
        const result = yield generator.generateMasteryGraph(userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate mastery graph' });
    }
}));
// Assignment Evaluator
router.post('/evaluate/essay', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, rubric, assignmentType } = req.body;
        const userId = req.userId || 'guest';
        const agent = new assignmentEvaluator_1.AssignmentEvaluatorAgent(userId);
        const result = yield agent.evaluateEssay(content, rubric, assignmentType);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to evaluate essay' });
    }
}));
router.post('/evaluate/code', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, language, criteria } = req.body;
        const userId = req.userId || 'guest';
        const agent = new assignmentEvaluator_1.AssignmentEvaluatorAgent(userId);
        const result = yield agent.evaluateCode(code, language, criteria);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to evaluate code' });
    }
}));
router.post('/evaluate/presentation', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slides, rubric } = req.body;
        const userId = req.userId || 'guest';
        const agent = new assignmentEvaluator_1.AssignmentEvaluatorAgent(userId);
        const result = yield agent.evaluatePresentation(slides, rubric);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to evaluate presentation' });
    }
}));
router.post('/evaluate/lab-report', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, labType } = req.body;
        const userId = req.userId || 'guest';
        const agent = new assignmentEvaluator_1.AssignmentEvaluatorAgent(userId);
        const result = yield agent.evaluateLabReport(content, labType);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to evaluate lab report' });
    }
}));
router.post('/evaluate/improve', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { work, workType, targetGrade } = req.body;
        const userId = req.userId || 'guest';
        const agent = new assignmentEvaluator_1.AssignmentEvaluatorAgent(userId);
        const result = yield agent.suggestImprovements(work, workType, targetGrade);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to suggest improvements' });
    }
}));
router.post('/evaluate/compare', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { v1, v2, workType } = req.body;
        const userId = req.userId || 'guest';
        const agent = new assignmentEvaluator_1.AssignmentEvaluatorAgent(userId);
        const result = yield agent.compareVersions(v1, v2, workType);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to compare versions' });
    }
}));
router.post('/evaluate/rubric', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, type, criteria } = req.body;
        const userId = req.userId || 'guest';
        const agent = new assignmentEvaluator_1.AssignmentEvaluatorAgent(userId);
        const result = yield agent.createRubric(name, type, criteria);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create rubric' });
    }
}));
router.get('/evaluate/rubrics', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.query;
        const userId = req.userId || 'guest';
        const agent = new assignmentEvaluator_1.AssignmentEvaluatorAgent(userId);
        const result = yield agent.getRubrics(type);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get rubrics' });
    }
}));
// Integrity Agent
router.post('/integrity/check', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const userId = req.userId || 'guest';
        const agent = new integrity_1.IntegrityAgent(userId);
        const result = yield agent.checkOriginality(content);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to check originality' });
    }
}));
router.post('/integrity/ai-usage', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const userId = req.userId || 'guest';
        const agent = new integrity_1.IntegrityAgent(userId);
        const result = yield agent.detectAIUsage(content);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to detect AI usage' });
    }
}));
router.post('/integrity/citations', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, style } = req.body;
        const userId = req.userId || 'guest';
        const agent = new integrity_1.IntegrityAgent(userId);
        const result = yield agent.checkCitations(content, style);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to check citations' });
    }
}));
router.post('/integrity/generate-citations', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sources, format } = req.body;
        const userId = req.userId || 'guest';
        const agent = new integrity_1.IntegrityAgent(userId);
        const result = yield agent.generateCitations(sources, format);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate citations' });
    }
}));
router.post('/integrity/references', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, count } = req.body;
        const userId = req.userId || 'guest';
        const agent = new integrity_1.IntegrityAgent(userId);
        const result = yield agent.suggestReferences(topic, count);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to suggest references' });
    }
}));
router.post('/integrity/weak-arguments', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const userId = req.userId || 'guest';
        const agent = new integrity_1.IntegrityAgent(userId);
        const result = yield agent.detectWeakArguments(content);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to detect weak arguments' });
    }
}));
// Study Planner
router.post('/planner/generate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { syllabusText, examDate, dailyHours, weakTopicEmphasis, priorityBased } = req.body;
        const userId = req.userId || 'guest';
        const agent = new studyPlanner_1.StudyPlannerAgent(userId);
        const syllabus = yield agent.parseSyllabus(syllabusText, examDate ? new Date(examDate) : undefined);
        const plan = yield agent.generateStudyPlan(syllabus, { dailyHours, weakTopicEmphasis, priorityBased });
        res.json({ syllabus, plan });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate study plan' });
    }
}));
router.get('/planner/readiness', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { syllabus, performanceData } = req.body;
        const userId = req.userId || 'guest';
        const agent = new studyPlanner_1.StudyPlannerAgent(userId);
        const result = yield agent.calculateReadiness(syllabus, performanceData);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to calculate readiness' });
    }
}));
router.get('/planner/burnout', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new studyPlanner_1.StudyPlannerAgent(userId);
        const result = yield agent.detectBurnoutRisk(userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to detect burnout risk' });
    }
}));
router.post('/planner/flashcards', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { syllabus, cardsPerTopic } = req.body;
        const userId = req.userId || 'guest';
        const agent = new studyPlanner_1.StudyPlannerAgent(userId);
        const result = agent.generateFlashcardsFromSyllabus(syllabus, cardsPerTopic);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate flashcards' });
    }
}));
// Code Debug Coach
router.post('/debug/explain', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, language, error, expectedBehavior } = req.body;
        const userId = req.userId || 'guest';
        const agent = new codeDebugCoach_1.CodeDebugCoachAgent(userId);
        const result = yield agent.explainDebugStepwise(code, language, error, expectedBehavior);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to explain debug' });
    }
}));
router.post('/debug/analyze', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, language } = req.body;
        const userId = req.userId || 'guest';
        const agent = new codeDebugCoach_1.CodeDebugCoachAgent(userId);
        const result = yield agent.analyzeCode(code, language);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to analyze code' });
    }
}));
router.post('/debug/logic', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, expectedOutput, actualOutput, language } = req.body;
        const userId = req.userId || 'guest';
        const agent = new codeDebugCoach_1.CodeDebugCoachAgent(userId);
        const result = yield agent.explainWhyLogicFails(code, expectedOutput, actualOutput, language);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to explain logic' });
    }
}));
router.post('/debug/concepts', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, language, concepts } = req.body;
        const userId = req.userId || 'guest';
        const agent = new codeDebugCoach_1.CodeDebugCoachAgent(userId);
        const result = yield agent.suggestConceptResources(code, language, concepts);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to suggest concepts' });
    }
}));
router.post('/debug/unittest', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, testInput, expectedOutput, actualOutput, language } = req.body;
        const userId = req.userId || 'guest';
        const agent = new codeDebugCoach_1.CodeDebugCoachAgent(userId);
        const result = yield agent.learnFromUnitTest(code, testInput, expectedOutput, actualOutput, language);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to learn from unit test' });
    }
}));
router.post('/debug/exercise', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, language, difficulty } = req.body;
        const userId = req.userId || 'guest';
        const agent = new codeDebugCoach_1.CodeDebugCoachAgent(userId);
        const result = yield agent.createDebugExercise(topic, language, difficulty);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create debug exercise' });
    }
}));
// Career Navigator
router.post('/career/skills', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { skills, targetRoles } = req.body;
        const userId = req.userId || 'guest';
        const agent = new careerNavigator_1.CareerSkillNavigatorAgent(userId);
        const result = yield agent.mapSkills(skills, targetRoles);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to map skills' });
    }
}));
router.post('/career/resume', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { resume, targetRole } = req.body;
        const userId = req.userId || 'guest';
        const agent = new careerNavigator_1.CareerSkillNavigatorAgent(userId);
        const result = yield agent.reviewResume(resume, targetRole);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to review resume' });
    }
}));
router.post('/career/interview', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, type, difficulty, questionCount } = req.body;
        const userId = req.userId || 'guest';
        const agent = new careerNavigator_1.CareerSkillNavigatorAgent(userId);
        const result = yield agent.generateMockInterview(role, type, difficulty, questionCount);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate interview' });
    }
}));
router.post('/career/interview/evaluate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { question, answer } = req.body;
        const userId = req.userId || 'guest';
        const agent = new careerNavigator_1.CareerSkillNavigatorAgent(userId);
        const result = yield agent.evaluateAnswer(question, answer);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to evaluate answer' });
    }
}));
router.post('/career/portfolio', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projects } = req.body;
        const userId = req.userId || 'guest';
        const agent = new careerNavigator_1.CareerSkillNavigatorAgent(userId);
        const result = yield agent.reviewPortfolio(projects);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to review portfolio' });
    }
}));
router.post('/career/roadmap', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetRole, currentSkills, timelineMonths } = req.body;
        const userId = req.userId || 'guest';
        const agent = new careerNavigator_1.CareerSkillNavigatorAgent(userId);
        const result = yield agent.generateCareerRoadmap(targetRole, currentSkills, timelineMonths);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate roadmap' });
    }
}));
router.get('/career/jobs', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { skills, targetRoles, location, limit } = req.query;
        const userId = req.userId || 'guest';
        const agent = new careerNavigator_1.CareerSkillNavigatorAgent(userId);
        const result = yield agent.findJobMatches(skills, targetRoles, location, Number(limit) || 10);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to find jobs' });
    }
}));
router.get('/career/interview-tips/:role', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const role = req.params.role;
        const companyType = req.query.companyType || 'mid-size';
        const userId = req.userId || 'guest';
        const agent = new careerNavigator_1.CareerSkillNavigatorAgent(userId);
        const result = yield agent.getInterviewTips(role, companyType);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get interview tips' });
    }
}));
// Confidence Booster
router.post('/confidence/hesitation', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { response, responseTime } = req.body;
        const userId = req.userId || 'guest';
        const agent = new confidenceBooster_1.ConfidenceBoosterAgent(userId);
        const result = yield agent.detectHesitation(response, responseTime);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to detect hesitation' });
    }
}));
router.post('/confidence/encourage', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { context, tone } = req.body;
        const userId = req.userId || 'guest';
        const agent = new confidenceBooster_1.ConfidenceBoosterAgent(userId);
        const result = yield agent.generateEncouragement(context, tone);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate encouragement' });
    }
}));
router.post('/confidence/anxiety', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const userId = req.userId || 'guest';
        const agent = new confidenceBooster_1.ConfidenceBoosterAgent(userId);
        const result = yield agent.analyzeAnxietyFromText(text);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to analyze anxiety' });
    }
}));
router.post('/confidence/stress', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { anxietyLevel, context } = req.body;
        const userId = req.userId || 'guest';
        const agent = new confidenceBooster_1.ConfidenceBoosterAgent(userId);
        const result = yield agent.generateStressResponse(anxietyLevel, context);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate stress response' });
    }
}));
router.get('/confidence/trend', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period } = req.query;
        const userId = req.userId || 'guest';
        const agent = new confidenceBooster_1.ConfidenceBoosterAgent(userId);
        const result = yield agent.trackConfidenceTrend(period || 'week');
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to track confidence trend' });
    }
}));
// Critical Thinking / Fallacy Detector
router.post('/thinking/fallacies', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const userId = req.userId || 'guest';
        const agent = new fallacyDetector_1.LogicalFallacyDetectorAgent(userId);
        const result = yield agent.detectFallacies(text);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to detect fallacies' });
    }
}));
router.post('/thinking/analyze', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { argument, context } = req.body;
        const userId = req.userId || 'guest';
        const agent = new fallacyDetector_1.LogicalFallacyDetectorAgent(userId);
        const result = yield agent.analyzeArgument(argument, context);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to analyze argument' });
    }
}));
router.post('/thinking/debate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { yourArgument, opponentResponse, isProponent } = req.body;
        const userId = req.userId || 'guest';
        const agent = new fallacyDetector_1.LogicalFallacyDetectorAgent(userId);
        const result = yield agent.evaluateDebatePerformance(yourArgument, opponentResponse, isProponent);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to evaluate debate' });
    }
}));
router.post('/thinking/score', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const userId = req.userId || 'guest';
        const agent = new fallacyDetector_1.LogicalFallacyDetectorAgent(userId);
        const result = yield agent.assessCriticalThinking(text);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to assess thinking' });
    }
}));
router.post('/thinking/challenge', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { argument, count } = req.body;
        const userId = req.userId || 'guest';
        const agent = new fallacyDetector_1.LogicalFallacyDetectorAgent(userId);
        const result = yield agent.generateSocraticChallenges(argument, count);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate challenges' });
    }
}));
router.post('/thinking/bias', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const userId = req.userId || 'guest';
        const agent = new fallacyDetector_1.LogicalFallacyDetectorAgent(userId);
        const result = yield agent.detectBias(text);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to detect bias' });
    }
}));
router.get('/thinking/fallacy/:type', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        const userId = req.userId || 'guest';
        const agent = new fallacyDetector_1.LogicalFallacyDetectorAgent(userId);
        const result = yield agent.teachFallacy(type);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to teach fallacy' });
    }
}));
// ============ QUIZ GENERATOR ============
const quizGenerator_1 = require("../agents/quizGenerator");
router.post('/quiz/generate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, topic, questionCount, difficulty } = req.body;
        const userId = req.userId || 'guest';
        const agent = new quizGenerator_1.QuizGeneratorAgent(userId);
        const result = yield agent.generateFromContent(content, topic, { questionCount, difficulty });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
}));
router.post('/quiz/evaluate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { quizId, answers } = req.body;
        const userId = req.userId || 'guest';
        const agent = new quizGenerator_1.QuizGeneratorAgent(userId);
        const result = yield agent.evaluateQuiz(quizId, answers);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to evaluate quiz' });
    }
}));
router.get('/quiz/analytics/:quizId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const quizId = req.params.quizId;
        const userId = req.userId || 'guest';
        const agent = new quizGenerator_1.QuizGeneratorAgent(userId);
        const result = yield agent.getQuizAnalytics(quizId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
}));
// ============ LEARNING STYLE DETECTOR ============
const learningStyleDetector_1 = require("../agents/learningStyleDetector");
router.get('/learning-style/questionnaire', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new learningStyleDetector_1.LearningStyleDetectorAgent(userId);
        const result = yield agent.generateQuestionnaire();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get questionnaire' });
    }
}));
router.post('/learning-style/analyze', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { responses } = req.body;
        const userId = req.userId || 'guest';
        const agent = new learningStyleDetector_1.LearningStyleDetectorAgent(userId);
        const result = yield agent.analyzeResponses(responses);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to analyze learning style' });
    }
}));
router.get('/learning-style/profile', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new learningStyleDetector_1.LearningStyleDetectorAgent(userId);
        const result = yield agent.getProfile();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
}));
// ============ PREDICTIVE ANALYTICS ============
const predictiveAnalytics_1 = require("../agents/predictiveAnalytics");
router.post('/analytics/predict', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, examDate, performanceHistory, studyHoursRemaining } = req.body;
        const userId = req.userId || 'guest';
        const agent = new predictiveAnalytics_1.PredictiveAnalyticsAgent(userId);
        const result = yield agent.predictExamScore(topic, new Date(examDate), performanceHistory, studyHoursRemaining);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to predict score' });
    }
}));
router.get('/analytics/patterns', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new predictiveAnalytics_1.PredictiveAnalyticsAgent(userId);
        const result = yield agent.analyzeStudyPatterns();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to analyze patterns' });
    }
}));
router.get('/analytics/competency', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topics } = req.query;
        const userId = req.userId || 'guest';
        const agent = new predictiveAnalytics_1.PredictiveAnalyticsAgent(userId);
        const result = yield agent.getCompetencyRadar(topics);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get competency' });
    }
}));
// ============ CALENDAR INTEGRATION ============
const calendarIntegration_1 = require("../agents/calendarIntegration");
router.post('/calendar/schedule', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examDate, topics, dailyStudyHours } = req.body;
        const userId = req.userId || 'guest';
        const agent = new calendarIntegration_1.CalendarIntegrationAgent(userId);
        const result = yield agent.generateStudySchedule(new Date(examDate), topics, dailyStudyHours);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate schedule' });
    }
}));
router.get('/calendar/events', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { days } = req.query;
        const userId = req.userId || 'guest';
        const agent = new calendarIntegration_1.CalendarIntegrationAgent(userId);
        const result = yield agent.getUpcomingEvents(Number(days) || 7);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get events' });
    }
}));
router.get('/calendar/export', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schedule } = req.body;
        const userId = req.userId || 'guest';
        const agent = new calendarIntegration_1.CalendarIntegrationAgent(userId);
        const ics = yield agent.exportToICS(schedule);
        res.setHeader('Content-Type', 'text/calendar');
        res.send(ics);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to export calendar' });
    }
}));
// ============ SKILL INTELLIGENCE ============
const skillIntelligence_1 = require("../agents/skillIntelligence");
router.post('/skills/map', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { activities } = req.body;
        const userId = req.userId || 'guest';
        const agent = new skillIntelligence_1.SkillIntelligenceEngine(userId);
        const result = yield agent.buildCompetencyMap(activities);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to map skills' });
    }
}));
router.get('/skills/recommendations', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new skillIntelligence_1.SkillIntelligenceEngine(userId);
        const result = yield agent.getSkillRecommendations();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
}));
router.post('/skills/path', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetRole, currentLevel, targetLevel, skills } = req.body;
        const userId = req.userId || 'guest';
        const agent = new skillIntelligence_1.SkillIntelligenceEngine(userId);
        const result = yield agent.generateLearningPath(targetRole, currentLevel, targetLevel, skills);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate path' });
    }
}));
// ============ WEB SEARCH ============
const webSearch_1 = require("../agents/webSearch");
router.post('/search/learning', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, sources, maxResults, difficulty } = req.body;
        const userId = req.userId || 'guest';
        const agent = new webSearch_1.WebSearchAgent(userId);
        const result = yield agent.searchForLearningContent(topic, { sources, maxResults, difficulty });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to search' });
    }
}));
router.post('/search/summarize', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { url } = req.body;
        const userId = req.userId || 'guest';
        const agent = new webSearch_1.WebSearchAgent(userId);
        const result = yield agent.summarizeContent(url);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to summarize' });
    }
}));
// ============ PORTFOLIO GENERATOR ============
const portfolioGenerator_1 = require("../agents/portfolioGenerator");
router.post('/portfolio/generate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userData, projectData } = req.body;
        const userId = req.userId || 'guest';
        const agent = new portfolioGenerator_1.PortfolioGeneratorAgent(userId);
        const result = yield agent.generatePortfolio(userData, projectData);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate portfolio' });
    }
}));
router.get('/portfolio/export/markdown', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { portfolio } = req.body;
        const userId = req.userId || 'guest';
        const agent = new portfolioGenerator_1.PortfolioGeneratorAgent(userId);
        const markdown = yield agent.exportToMarkdown(portfolio);
        res.setHeader('Content-Type', 'text/markdown');
        res.send(markdown);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to export' });
    }
}));
// ============ CERTIFICATE GENERATOR ============
const certificateGenerator_1 = require("../agents/certificateGenerator");
router.post('/certificate/generate', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { recipient, course } = req.body;
        const userId = req.userId || 'guest';
        const agent = new certificateGenerator_1.CertificateGeneratorAgent(userId);
        const result = yield agent.generateCertificate(recipient, course);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
}));
router.get('/certificate/verify/:credentialId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const credentialId = req.params.credentialId;
        const userId = req.userId || 'guest';
        const agent = new certificateGenerator_1.CertificateGeneratorAgent(userId);
        const result = yield agent.verifyCertificate(credentialId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to verify' });
    }
}));
router.get('/certificate/html/:credentialId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const credentialId = req.params.credentialId;
        const userId = req.userId || 'guest';
        const agent = new certificateGenerator_1.CertificateGeneratorAgent(userId);
        const { certificate } = yield agent.verifyCertificate(credentialId);
        if (certificate) {
            const html = yield agent.generateHTML(certificate);
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        }
        else {
            res.status(404).json({ error: 'Certificate not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate HTML' });
    }
}));
// ============ LMS CONNECTOR ============
const lmsConnector_1 = require("../agents/lmsConnector");
router.post('/lms/connect', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { provider, baseUrl } = req.body;
        const userId = req.userId || 'guest';
        const agent = new lmsConnector_1.LMSConnectorAgent(userId);
        const result = yield agent.connect(provider, baseUrl);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to connect' });
    }
}));
router.get('/lms/courses', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new lmsConnector_1.LMSConnectorAgent(userId);
        const result = yield agent.getCourses();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get courses' });
    }
}));
router.get('/lms/assignments/:courseId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.courseId;
        const userId = req.userId || 'guest';
        const agent = new lmsConnector_1.LMSConnectorAgent(userId);
        const result = yield agent.getAssignments(courseId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get assignments' });
    }
}));
router.get('/lms/grades/:courseId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.courseId;
        const userId = req.userId || 'guest';
        const agent = new lmsConnector_1.LMSConnectorAgent(userId);
        const result = yield agent.getGrades(courseId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get grades' });
    }
}));
router.post('/lms/sync', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const agent = new lmsConnector_1.LMSConnectorAgent(userId);
        const result = yield agent.syncWithLMS();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to sync' });
    }
}));
exports.default = router;
