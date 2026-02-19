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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orchestrator_1 = require("../agents/orchestrator");
const prisma_1 = require("../services/prisma");
const sarvam_1 = require("../services/sarvam");
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
exports.default = router;
