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
const prisma_1 = require("../services/prisma");
const sarvam_1 = require("../services/sarvam");
const export_1 = require("../services/export");
const integrations_1 = require("../services/integrations");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/research', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.body;
        const userId = req.userId || 'guest';
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
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
router.get('/session/:sessionId', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const orchestrator = new orchestrator_1.AgentOrchestrator(req.userId || 'guest');
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
router.get('/sessions', (0, auth_1.authenticate)({ optional: true }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || 'guest';
        const orchestrator = new orchestrator_1.AgentOrchestrator(userId);
        const sessions = yield orchestrator.getUserSessions();
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
        const orchestrator = new orchestrator_1.AgentOrchestrator(userId);
        res.write(`data: ${JSON.stringify({ type: 'started', query })}\n\n`);
        const result = yield orchestrator.research(query);
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
exports.default = router;
