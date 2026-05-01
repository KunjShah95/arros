import { Router, Request, Response } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator';
import { HumanBrainOrchestrator } from '../agents/humanBrainOrchestrator';
import { SpacedRepetitionEngine } from '../agents/spacedRepetition';
import { NightResearchScheduler, nightScheduler } from '../agents/nightResearchScheduler';
import { PDFResearcher, YouTubeResearcher } from '../agents/pdfResearcher';
import { XPSystem } from '../agents/xpSystem';
import { prisma } from '../services/prisma';
import { sarvamClient } from '../services/sarvam';
import { ExportService } from '../services/export';
import { IntegrationService } from '../services/integrations';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Brain instance cache — one brain per user per server lifetime
const brainCache = new Map<string, HumanBrainOrchestrator>();
function getBrain(userId: string): HumanBrainOrchestrator {
  if (!brainCache.has(userId)) {
    brainCache.set(userId, new HumanBrainOrchestrator(userId, true));
  }
  return brainCache.get(userId)!;
}

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// ─── Authentication API ─────────────────────────────────────────────────────

/** GET /api/auth/google - Redirect to Google OAuth */
router.get('/auth/google', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_PLACEHOLDER';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  
  if (clientId === 'YOUR_CLIENT_ID_PLACEHOLDER') {
    console.warn('Google OAuth: Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
  }
  
  res.redirect(authUrl.toString());
});

/** GET /api/auth/google/callback - Handle OAuth callback */
router.get('/auth/google/callback', async (req: Request, res: Response) => {
  const { code, error: oauthError } = req.query;
  
  if (oauthError) {
    console.error('Google OAuth error:', oauthError);
    return res.redirect('/signin?error=oauth_failed');
  }
  
  if (!code) {
    return res.redirect('/signin?error=no_code');
  }
  
  const clientId = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_PLACEHOLDER';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_PLACEHOLDER';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  
  if (clientId === 'YOUR_CLIENT_ID_PLACEHOLDER') {
    return res.redirect('/signin?error=oauth_not_configured');
  }
  
  try {
    const tokenUrl = new URL('https://oauth2.googleapis.com/token');
    const tokenParams = new URLSearchParams({
      code: code as string,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    
    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: 'POST',
      body: tokenParams,
    });
    
    const tokens = await tokenResponse.json() as { id_token?: string; access_token?: string; error?: string };
    
    if (tokens.error) {
      console.error('Token exchange error:', tokens.error);
      return res.redirect('/signin?error=token_exchange_failed');
    }
    
    res.redirect('/signin?error=oauth_not_configured');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect('/signin?error=oauth_failed');
  }
});

/** GET /api/auth/session - Get current session */
router.get('/auth/session', authenticate({ optional: true }), (req: Request, res: Response) => {
  if (req.user) {
    res.json({ user: req.user, authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

/** POST /api/auth/logout - Logout */
router.post('/auth/logout', authenticate({ optional: true }), (req: Request, res: Response) => {
  res.json({ success: true });
});

router.post('/research', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { query, useBrain = true } = req.body;
    const userId = req.userId || 'guest';

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (useBrain) {
      // Use the Human Brain Orchestrator for human-like cognition
      const brain = getBrain(userId);
      const result = await brain.research(query);
      res.json(result);
    } else {
      // Fallback to standard orchestrator
      const orchestrator = new AgentOrchestrator(userId);
      const result = await orchestrator.research(query);
      res.json(result);
    }
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({ error: 'Research failed' });
  }
});

// ─── Human Brain API Endpoints ────────────────────────────────────────────────

/** GET /api/brain/state — Get current cognitive state of the brain */
router.get('/brain/state', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const brain = getBrain(userId);
    const state = await brain.getBrainState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get brain state' });
  }
});

/** POST /api/brain/sleep — Run offline memory consolidation */
router.post('/brain/sleep', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const brain = getBrain(userId);
    await brain.sleep();
    res.json({ success: true, message: 'Memory consolidation complete — brain refreshed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run consolidation' });
  }
});

/** GET /api/brain/curiosities — What the brain is most curious about */
router.get('/brain/curiosities', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    // Curiosity state comes from active interests
    const interests = await prisma.userInterest.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to get curiosities' });
  }
});

/** GET /api/brain/config — Brain architecture metadata */
router.get('/brain/config', authenticate({ optional: true }), async (_req: Request, res: Response) => {
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
});

// ─── Spaced Repetition API ────────────────────────────────────────────────────

/** GET /api/flashcards — Get all flashcards for user */
router.get('/flashcards', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { topic } = req.query as { topic?: string };
    const engine = new SpacedRepetitionEngine(userId);
    const cards = await engine.getAllCards();
    const filtered = topic ? cards.filter(c => c.topic.toLowerCase().includes(topic.toLowerCase())) : cards;
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get flashcards' });
  }
});

/** GET /api/flashcards/due — Get cards due for review */
router.get('/flashcards/due', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const limit = parseInt(req.query.limit as string) || 20;
    const engine = new SpacedRepetitionEngine(userId);
    const dueCards = await engine.getDueCards(limit);
    res.json(dueCards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get due cards' });
  }
});

/** GET /api/flashcards/stats — Study statistics */
router.get('/flashcards/stats', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const engine = new SpacedRepetitionEngine(userId);
    const stats = await engine.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/** POST /api/flashcards/review — Submit a review result */
router.post('/flashcards/review', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { cardId, quality, responseTimeMs } = req.body;
    if (!cardId || quality === undefined) return res.status(400).json({ error: 'cardId and quality required' });
    const engine = new SpacedRepetitionEngine(userId);
    const updated = await engine.processReview(cardId, quality, responseTimeMs || 5000);
    // Award XP
    const xp = new XPSystem(userId);
    await xp.awardXP('flashcard_review');
    if (quality === 5) await xp.awardXP('perfect_recall');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process review' });
  }
});

/** POST /api/flashcards/generate — Generate flashcards from a session */
router.post('/flashcards/generate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { sessionId, topic } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    // Get the session synthesis
    const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { outputs: true } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const synthesis = session.outputs?.[0]?.content ? JSON.parse(session.outputs[0].content as string) : null;
    if (!synthesis) return res.status(400).json({ error: 'No synthesis found for this session' });

    const engine = new SpacedRepetitionEngine(userId);
    const cards = await engine.generateFromResearch(synthesis, topic || session.query || 'Research', sessionId);
    res.json({ cardsGenerated: cards.length, cards });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

/** DELETE /api/flashcards/:id — Delete a flashcard */
router.delete('/flashcards/:id', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const engine = new SpacedRepetitionEngine(userId);
    await engine.deleteCard(String(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete flashcard' });
  }
});

// ─── Quiz Generation API ────────────────────────────────────────────────────────

/** POST /api/quiz/generate — Generate quiz from content or session */
router.post('/quiz/generate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { sessionId, content, topic, questionCount, difficulty } = req.body;

    let quizContent = '';
    let quizTopic = topic || 'General';

    if (sessionId) {
      const session = await prisma.session.findUnique({ 
        where: { id: sessionId },
        include: { outputs: true }
      });
      if (!session) return res.status(404).json({ error: 'Session not found' });
      
      const output = session.outputs?.[0]?.content;
      if (output && typeof output === 'object') {
        const out = output as any;
        quizContent = out.summary || out.keyFindings?.join('\n') || JSON.stringify(out);
        quizTopic = out.topics?.[0] || session.title || topic || 'Research';
      } else {
        quizContent = session.query || '';
      }
    } else if (content) {
      quizContent = content;
    } else {
      return res.status(400).json({ error: 'sessionId or content required' });
    }

    const quizAgent = new QuizGeneratorAgent(userId);
    const quiz = await quizAgent.generateFromContent(quizContent, quizTopic, {
      questionCount: questionCount || 10,
      difficulty: difficulty || 'mixed',
    });

    res.json({ quiz });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

/** POST /api/quiz/from-media — Generate quiz directly from media analysis result */
router.post('/quiz/from-media', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { mediaAnalysis, questionCount, difficulty } = req.body;

    if (!mediaAnalysis) {
      return res.status(400).json({ error: 'mediaAnalysis required' });
    }

    const combinedContent = [
      mediaAnalysis.summary,
      ...(mediaAnalysis.keyFindings || []),
      ...(mediaAnalysis.keyTakeaways || [])
    ].join('\n\n');

    const quizAgent = new QuizGeneratorAgent(userId);
    const quiz = await quizAgent.generateFromContent(
      combinedContent,
      mediaAnalysis.topics?.[0] || mediaAnalysis.title || 'Media Analysis',
      {
        questionCount: questionCount || 10,
        difficulty: difficulty || 'mixed',
      }
    );

    res.json({ quiz });
  } catch (error) {
    console.error('Quiz from media error:', error);
    res.status(500).json({ error: 'Failed to generate quiz from media' });
  }
});

/** POST /api/quiz/evaluate — Evaluate quiz answers */
router.post('/quiz/evaluate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { quizId, answers } = req.body;

    if (!quizId || !answers) {
      return res.status(400).json({ error: 'quizId and answers required' });
    }

    const quizAgent = new QuizGeneratorAgent(userId);
    const attempt = await quizAgent.evaluateQuiz(quizId, answers);

    res.json({ attempt });
  } catch (error) {
    console.error('Quiz evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate quiz' });
  }
});

// ─── Night Research Scheduler API ─────────────────────────────────────────────

/** GET /api/night/digest — Get today's morning digest */
router.get('/night/digest', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const scheduler = new NightResearchScheduler();
    const digest = await scheduler.getMorningDigest(userId);
    res.json(digest || { readyForReview: false, message: 'No digest for today yet' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get digest' });
  }
});

/** GET /api/night/digests — Get past digests */
router.get('/night/digests', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const days = parseInt(req.query.days as string) || 7;
    const scheduler = new NightResearchScheduler();
    const digests = await scheduler.getPastDigests(userId, days);
    res.json(digests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get past digests' });
  }
});

/** POST /api/night/run — Manually trigger overnight research */
router.post('/night/run', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const scheduler = new NightResearchScheduler();
    const digest = await scheduler.triggerManual(userId);
    // Award XP for night discovery
    const xp = new XPSystem(userId);
    await xp.awardXP('night_discovery');
    res.json(digest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run overnight research' });
  }
});

// ─── PDF & YouTube Research API ────────────────────────────────────────────────

/** POST /api/media/pdf — Analyze an uploaded PDF */
const pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/media/pdf', authenticate({ optional: true }), pdfUpload.single('file'), async (req: MulterRequest, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Extract text from PDF buffer
    let text = '';
    try {
      // Try using pdf-parse if installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } catch {
      // Fallback: treat as plain text
      text = req.file.buffer.toString('utf-8');
    }

    const researcher = new PDFResearcher(userId);
    const analysis = await researcher.analyzeText(text, req.file.originalname);

    // Award XP
    const xp = new XPSystem(userId);
    await xp.awardXP('pdf_upload', { filename: req.file.originalname });

    res.json(analysis);
  } catch (error) {
    console.error('PDF analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze PDF' });
  }
});

/** POST /api/media/youtube — Analyze a YouTube video */
router.post('/media/youtube', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'YouTube URL required' });

    const researcher = new YouTubeResearcher(userId);
    const analysis = await researcher.analyzeVideo(url);

    // Award XP
    const xp = new XPSystem(userId);
    await xp.awardXP('youtube_research', { url });

    res.json(analysis);
  } catch (error) {
    console.error('YouTube analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze YouTube video' });
  }
});

// ─── XP & Gamification API ─────────────────────────────────────────────────────

/** GET /api/xp/profile — Full XP profile */
router.get('/xp/profile', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const xp = new XPSystem(userId);
    const profile = await xp.getProfile();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get XP profile' });
  }
});

/** POST /api/xp/award — Award XP (internal, but useful for testing) */
router.post('/xp/award', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { action, metadata } = req.body;
    const xp = new XPSystem(userId);
    const result = await xp.awardXP(action, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

router.get('/session/:sessionId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const brain = getBrain(req.userId || 'guest');
    const session = await brain.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

router.get('/sessions', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const brain = getBrain(userId);
    const sessions = await brain.getUserSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.get('/sources/:sessionId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const sources = await prisma.source.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sources' });
  }
});

router.get('/memory', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';

    const memories = await prisma.userMemory.findMany({
      where: { userId },
      orderBy: { importance: 'desc' },
      take: 50,
    });

    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get memories' });
  }
});

router.get('/interests', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';

    const interests = await prisma.userInterest.findMany({
      where: { userId },
      orderBy: { depth: 'desc' },
    });

    res.json(interests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get interests' });
  }
});

router.get('/knowledge-graph', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';

    const nodes = await prisma.knowledgeNode.findMany({
      include: {
        edgesFrom: true,
        edgesTo: true,
      },
    });

    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get knowledge graph' });
  }
});

router.get('/research/export/:sessionId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;

    const task = await prisma.agentTask.findFirst({
      where: { sessionId: sessionId as string, type: 'synthesizer' as any },
      orderBy: { createdAt: 'desc' }
    });

    if (!task || !task.output) {
      return res.status(404).json({ error: 'Synthesis not found for this session' });
    }

    const markdown = ExportService.toMarkdown(task.output as any);

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="ARROS-Research-${sessionId}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ─── Export API ──────────────────────────────────────────────────────────────────

/** GET /api/media/export/:sessionId — Export media analysis as markdown/html */
router.get('/media/export/:sessionId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const format = req.query.format as string || 'markdown';

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { outputs: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const output = session.outputs?.[0]?.content;
    if (!output || typeof output !== 'object') {
      return res.status(404).json({ error: 'Analysis output not found' });
    }

    const analysis = output as any;

    if (format === 'html') {
      const html = ExportService.toHTML(analysis);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${session.title || 'research'}.html"`);
      res.send(html);
    } else {
      const markdown = ExportService.toMarkdownFromMedia(analysis);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${session.title || 'research'}.md"`);
      res.send(markdown);
    }
  } catch (error) {
    console.error('Media export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

/** POST /api/media/export — Export provided content */
router.post('/media/export', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content, format, title } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    if (format === 'html') {
      const html = ExportService.toHTML(content);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'research'}.html"`);
      res.send(html);
    } else {
      const markdown = ExportService.toMarkdownFromMedia(content);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'research'}.md"`);
      res.send(markdown);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/integrations', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const integrations = await IntegrationService.getIntegrations(req.userId || 'guest');
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get integrations' });
  }
});

router.post('/research/action/execute', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { action, integrationId } = req.body;
    const result = await IntegrationService.executeAction(action, integrationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute action' });
  }
});

router.post('/research/stream', authenticate({ optional: true }), async (req: Request, res: Response) => {
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

    const result = await brain.research(query);

    res.write(`data: ${JSON.stringify({ type: 'completed', result })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Streaming research error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Research failed' })}\n\n`);
    res.end();
  }
});

router.get('/agents/config', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    res.json({
      researchTypes: ['web', 'academic', 'code', 'news'],
      criticTypes: ['verifier', 'bias', 'contradiction'],
      memoryTypes: ['shortTerm', 'longTerm', 'knowledgeGraph'],
      actionTypes: ['prd', 'ticket', 'code', 'decision'],
      availableModels: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-haiku'],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent config' });
  }
});

router.get('/evaluations/:sessionId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;

    const evaluations = await prisma.evaluation.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get evaluations' });
  }
});

router.get('/analytics/usage', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await prisma.session.findMany({
      where: { userId, createdAt: { gte: startDate } },
      include: { tasks: true, sources: true },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalSources = sessions.reduce((acc, s) => acc + s.sources.length, 0);
    const totalTasks = sessions.reduce((acc, s) => acc + s.tasks.length, 0);
    const totalCost = sessions.reduce((acc, s) =>
      acc + s.tasks.reduce((tacc, t) => tacc + (t.cost || 0), 0), 0
    );

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
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ─── Study Analytics API ────────────────────────────────────────────────────────

/** GET /api/study/stats — Get study statistics and streak info */
router.get('/study/stats', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get XP profile for streak info
    const xpSystem = new XPSystem(userId);
    const profile = await xpSystem.getProfile();

    // Get sessions count
    const sessionsCount = await prisma.session.count({
      where: { userId, createdAt: { gte: startDate }, status: 'completed' },
    });

    // Get flashcards reviewed (from memory type)
    const flashcardReviews = await prisma.userMemory.count({
      where: { userId, type: 'flashcard_review', createdAt: { gte: startDate } },
    });

    // Get quiz attempts
    const quizOutputs = await prisma.agentOutput.findMany({
      where: { 
        sessionId: { startsWith: 'quiz_' },
        type: 'quiz_attempt' as any,
        createdAt: { gte: startDate },
      },
    });

    // Calculate daily activity
    const dailyActivity: Record<string, { sessions: number; xp: number }> = {};
    const allSessions = await prisma.session.findMany({
      where: { userId, createdAt: { gte: startDate } },
      select: { createdAt: true, id: true },
    });
    
    for (const s of allSessions) {
      const day = s.createdAt.toISOString().split('T')[0];
      dailyActivity[day] = dailyActivity[day] || { sessions: 0, xp: 0 };
      dailyActivity[day].sessions++;
    }

    // Get weak topics from concept coach if available
    const conceptCoach = await import('../agents/conceptCoach');
    let weakTopics: { topic: string; errorRate: number; priority: string }[] = [];
    try {
      const cc = new conceptCoach.ConceptCoachAgent(userId);
      const weakResult = await cc.detectWeakTopics();
      weakTopics = weakResult.slice(0, 5).map(w => ({ 
        topic: w.topic, 
        errorRate: w.errorRate, 
        priority: w.priority 
      }));
    } catch {}

    res.json({
      streak: {
        current: profile.streakDays,
        longest: profile.longestStreak,
        lastActive: profile.streakDays > 0 ? new Date().toISOString() : null,
      },
      period: { days, startDate, endDate: new Date() },
      summary: {
        totalSessions: sessionsCount,
        sessionsThisPeriod: allSessions.length,
        flashcardReviews,
        quizAttempts: quizOutputs.length,
        totalXP: profile.totalXP,
        level: profile.level,
      },
      dailyActivity,
      weakTopics,
    });
  } catch (error) {
    console.error('Study stats error:', error);
    res.status(500).json({ error: 'Failed to get study stats' });
  }
});

/** GET /api/study/weak-topics — Get topics that need more study */
router.get('/study/weak-topics', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';

    const conceptCoach = await import('../agents/conceptCoach');
    const cc = new conceptCoach.ConceptCoachAgent(userId);
    const weakResult = await cc.detectWeakTopics();
    
    res.json(weakResult);
  } catch (error) {
    console.error('Weak topics error:', error);
    res.status(500).json({ error: 'Failed to get weak topics' });
  }
});

/** GET /api/study/revision-priority — Get priority revision list based on weak topics */
router.get('/study/revision-priority', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';

    // Get weak topics
    const conceptCoach = await import('../agents/conceptCoach');
    const cc = new conceptCoach.ConceptCoachAgent(userId);
    const weakTopics = await cc.detectWeakTopics();

    // Get due flashcards
    const engine = new SpacedRepetitionEngine(userId);
    const dueCards = await engine.getDueCards(20);

    // Combine into priority list
    const revisionItems: Array<{
      type: 'flashcard' | 'weak_topic';
      topic: string;
      priority: number;
      itemsDue?: number;
      errorRate?: number;
    }> = [];

    // Add weak topics with their error rates
    weakTopics.slice(0, 5).forEach((wt, idx) => {
      revisionItems.push({
        type: 'weak_topic',
        topic: wt.topic,
        priority: idx + 1,
        errorRate: wt.errorRate,
      });
    });

    // Group due cards by topic
    const cardsByTopic: Record<string, number> = {};
    dueCards.forEach(card => {
      cardsByTopic[card.topic] = (cardsByTopic[card.topic] || 0) + 1;
    });

    // Add topics with due cards
    Object.entries(cardsByTopic).forEach(([topic, count]) => {
      const existing = revisionItems.find(r => r.topic.toLowerCase() === topic.toLowerCase());
      if (existing) {
        existing.itemsDue = count;
      } else {
        revisionItems.push({
          type: 'flashcard',
          topic,
          priority: revisionItems.length + 1,
          itemsDue: count,
        });
      }
    });

    // Sort by priority
    revisionItems.sort((a, b) => a.priority - b.priority);

    res.json({
      totalItems: revisionItems.length,
      recommendedOrder: revisionItems,
      summary: {
        weakTopicsCount: weakTopics.length,
        flashcardsDue: dueCards.length,
      },
    });
  } catch (error) {
    console.error('Revision priority error:', error);
    res.status(500).json({ error: 'Failed to get revision priority' });
  }
});

/** GET /api/study/search — Search sessions */
router.get('/study/search', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q as string, mode: 'insensitive' } },
          { query: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      select: {
        id: true,
        title: true,
        query: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({ results: sessions, count: sessions.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search sessions' });
  }
});

router.post('/memory/search', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const { MemoryFleet } = await import('../agents/subagents/memoryFleet');
    const memoryFleet = new MemoryFleet(userId, 'search-session');

    const memories = await memoryFleet.retrieveMemory(query, limit);

    res.json(memories);
  } catch (error) {
    console.error('Memory search error:', error);
    res.status(500).json({ error: 'Failed to search memories' });
  }
});

router.delete('/memory/:memoryId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const memoryId = req.params.memoryId as string;

    await prisma.userMemory.deleteMany({
      where: { id: memoryId, userId: userId as string },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

router.delete('/knowledge-graph/:nodeId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.nodeId as string;

    await prisma.knowledgeEdge.deleteMany({
      where: {
        OR: [{ fromNodeId: nodeId as string }, { toNodeId: nodeId as string }],
      },
    });

    await prisma.knowledgeNode.delete({
      where: { id: nodeId as string },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete node' });
  }
});

router.get('/tasks/:sessionId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;

    const tasks = await prisma.agentTask.findMany({
      where: { sessionId: sessionId as string },
      orderBy: { createdAt: 'asc' },
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Sarvam AI Integration Routes
// Note: Sarvam AI does not provide OCR service. This is a placeholder.
// For OCR, consider using Google Cloud Vision, AWS Textract, or Tesseract.js

router.post('/sarvam/ocr', upload.single('image'), async (req: MulterRequest, res: Response) => {
  try {
    const { imageUrl, language = 'en' } = req.body;
    const imageFile = req.file;

    if (!imageUrl && !imageFile) {
      return res.status(400).json({ error: 'imageUrl or image file is required' });
    }

    let result;
    if (imageFile) {
      result = await sarvamClient.performOCR(imageFile, language);
    } else if (imageUrl) {
      result = await sarvamClient.performOCR(imageUrl, language);
    }

    res.json(result);
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'OCR processing failed' });
  }
});

router.post('/sarvam/tts', async (req: Request, res: Response) => {
  try {
    const { text, language = 'en', voice = 'female' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await sarvamClient.textToSpeech({
      text,
      language,
      voice,
    });

    res.json(result);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Text-to-speech conversion failed' });
  }
});

router.post('/sarvam/stt', upload.single('audio'), async (req: MulterRequest, res: Response) => {
  try {
    const { audioUrl, language = 'en' } = req.body;
    const audioFile = req.file;

    if (!audioUrl && !audioFile) {
      return res.status(400).json({ error: 'audioUrl or audio file is required' });
    }

    let result;
    if (audioFile) {
      result = await sarvamClient.speechToText(audioFile, language);
    } else if (audioUrl) {
      result = await sarvamClient.speechToText(audioUrl, language);
    }

    res.json(result);
  } catch (error) {
    console.error('STT error:', error);
    res.status(500).json({ error: 'Speech-to-text conversion failed' });
  }
});

router.get('/sarvam/voices', async (req: Request, res: Response) => {
  try {
    const voices = await sarvamClient.getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({ error: 'Failed to get available voices' });
  }
});

router.get('/sarvam/languages', async (req: Request, res: Response) => {
  try {
    const languages = await sarvamClient.getSupportedLanguages();
    res.json({ languages });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Failed to get supported languages' });
  }
});

import {
  StudyOSAgent,
  SpacedRepetitionAgent,
  FormulaSheetAgent,
  MockExamAgent,
  RevisionSchedulerAgent,
  LiteratureReviewAgent,
  ThesisValidatorAgent,
  ResearchGapFinderAgent,
  CitationGeneratorAgent,
  PaperComparatorAgent,
  MindMapGeneratorAgent,
  SocraticTutorAgent,
  ConceptDependencyAgent,
  AnkiExportAgent,
  LearningAnalyticsAgent,
  DecentralizedShareAgent,
  VideoSummarizerAgent,
  CollaborativeStudyRoomAgent,
  PomodoroAgent,
  ErrorTrackingAgent,
  QuestionBankAgent,
  GamificationAgent,
  PDFAnnotationAgent,
  ExamCountdownAgent
} from '../agents/studyOS';

import { ConceptCoachAgent, MasteryGraphGenerator } from '../agents/conceptCoach';
import { AssignmentEvaluatorAgent, QuickFeedbackGenerator } from '../agents/assignmentEvaluator';
import { IntegrityAgent, TransparencyLogger } from '../agents/integrity';
import { StudyPlannerAgent, FocusModeAgent } from '../agents/studyPlanner';
import { CodeDebugCoachAgent, CodeEvolutionWatcher } from '../agents/codeDebugCoach';
import { CareerSkillNavigatorAgent } from '../agents/careerNavigator';
import { ConfidenceBoosterAgent } from '../agents/confidenceBooster';
import { LogicalFallacyDetectorAgent } from '../agents/fallacyDetector';

import { v4 as uuid } from 'uuid';

router.post('/studyos/exam-prep', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content, topic, options } = req.body;
    const userId = req.userId || 'guest';
    const sessionId = req.body.sessionId || uuid();
    const taskId = uuid();

    if (!content || !topic) {
      return res.status(400).json({ error: 'Content and topic are required' });
    }

    const studyAgent = new StudyOSAgent(sessionId, userId, taskId);
    const result = await studyAgent.generateExamPrepMaterials(content, topic, options || {});

    res.json(result);
  } catch (error) {
    console.error('StudyOS exam prep error:', error);
    res.status(500).json({ error: 'Failed to generate exam prep materials' });
  }
});

router.post('/studyos/from-pdf', authenticate({ optional: true }), async (req: MulterRequest, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const sessionId = uuid();
    const taskId = uuid();
    const title = req.body.title || 'PDF Study Session';

    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const pdfText = req.file.buffer.toString('utf-8');

    const studyAgent = new StudyOSAgent(sessionId, userId, taskId);
    const result = await studyAgent.generateFromPDF(pdfText, title);

    res.json(result);
  } catch (error) {
    console.error('StudyOS PDF error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

router.post('/studyos/continue', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { previousMaterials, focusAreas } = req.body;
    const userId = req.userId || 'guest';
    const sessionId = uuid();
    const taskId = uuid();

    if (!previousMaterials) {
      return res.status(400).json({ error: 'Previous materials are required' });
    }

    const studyAgent = new StudyOSAgent(sessionId, userId, taskId);
    const result = await studyAgent.continueStudySession(previousMaterials, focusAreas);

    res.json(result);
  } catch (error) {
    console.error('StudyOS continue error:', error);
    res.status(500).json({ error: 'Failed to continue study session' });
  }
});

router.post('/studyos/share', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { materials, options } = req.body;
    const userId = req.userId || 'guest';

    if (!materials) {
      return res.status(400).json({ error: 'Materials are required' });
    }

    const shareAgent = new DecentralizedShareAgent(userId);
    const result = await shareAgent.createShareableStudyBundle(materials, options || {});

    res.json(result);
  } catch (error) {
    console.error('StudyOS share error:', error);
    res.status(500).json({ error: 'Failed to create shareable bundle' });
  }
});

router.get('/studyos/bundle/:bundleId', async (req: Request, res: Response) => {
  try {
    const bundleId = req.params.bundleId as string;

    const bundle = await prisma.agentOutput.findFirst({
      where: { sessionId: bundleId },
    });

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    res.json(bundle);
  } catch (error) {
    console.error('StudyOS bundle error:', error);
    res.status(500).json({ error: 'Failed to get bundle' });
  }
});

router.post('/studyos/srs/create-queue', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { cards, settings } = req.body;
    const userId = req.userId || 'guest';
    const srsAgent = new SpacedRepetitionAgent(userId);
    const result = await srsAgent.createSRSQueue(cards, settings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create SRS queue' });
  }
});

router.post('/studyos/srs/review', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { cardId, quality } = req.body;
    const srsAgent = new SpacedRepetitionAgent(req.userId || 'guest');
    const result = await srsAgent.reviewCard(cardId, quality);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to review card' });
  }
});

router.get('/studyos/srs/due', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const srsAgent = new SpacedRepetitionAgent(req.userId || 'guest');
    const cards = await srsAgent.getDueCards();
    const stats = await srsAgent.getReviewStats();
    res.json({ dueCards: cards, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get due cards' });
  }
});

router.post('/studyos/formulas', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, content } = req.body;
    const agent = new FormulaSheetAgent();
    const result = await agent.generateFormulaSheet(topic, content);
    const cheatSheet = agent.generateCheatSheet([result]);
    res.json({ formulaSheet: result, cheatSheet });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate formula sheet' });
  }
});

router.post('/studyos/mock-exam', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, content, options } = req.body;
    const agent = new MockExamAgent();
    const exam = await agent.generateMockExam(topic, content, options);
    const answerKey = agent.generateAnswerKey(exam);
    res.json({ exam, answerKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate mock exam' });
  }
});

router.post('/studyos/schedule', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, subtopics, examDate, dailyHours } = req.body;
    const agent = new RevisionSchedulerAgent();
    const schedule = await agent.generateSchedule(topic, subtopics, new Date(examDate), dailyHours);
    const progress = agent.getProgress(schedule);
    res.json({ schedule, progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

router.post('/studyos/literature-review', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, papers } = req.body;
    const agent = new LiteratureReviewAgent();
    const review = await agent.buildLiteratureReview(topic, papers);
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to build literature review' });
  }
});

router.get('/studyos/related-papers/:topic', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const topic = req.params.topic as string;
    const agent = new LiteratureReviewAgent();
    const papers = await agent.getRelatedPapers(topic);
    res.json({ papers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to find related papers' });
  }
});

router.post('/studyos/validate-thesis', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { thesis, context } = req.body;
    const agent = new ThesisValidatorAgent();
    const result = await agent.validateThesis(thesis, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate thesis' });
  }
});

router.post('/studyos/research-gaps', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, existingPapers } = req.body;
    const agent = new ResearchGapFinderAgent();
    const gaps = await agent.findGaps(topic, existingPapers || []);
    res.json({ gaps });
  } catch (error) {
    res.status(500).json({ error: 'Failed to find research gaps' });
  }
});

router.post('/studyos/citations', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { papers, format } = req.body;
    const agent = new CitationGeneratorAgent();
    const citations = await agent.formatReferences(papers, format || 'apa');
    res.json({ citations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate citations' });
  }
});

router.post('/studyos/compare-papers', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { papers } = req.body;
    const agent = new PaperComparatorAgent();
    const result = await agent.comparePapers(papers);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare papers' });
  }
});

router.post('/studyos/mindmap', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, content } = req.body;
    const agent = new MindMapGeneratorAgent();
    const mindmap = await agent.generateMindMap(topic, content);
    const mermaidCode = agent.generateMermaidCode(mindmap);
    res.json({ mindmap, mermaidCode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate mind map' });
  }
});

router.post('/studyos/socratic/ask', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, context } = req.body;
    const agent = new SocraticTutorAgent();
    const question = await agent.askQuestion(topic, context);
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to ask question' });
  }
});

router.post('/studyos/socratic/evaluate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { question, answer } = req.body;
    const agent = new SocraticTutorAgent();
    const result = await agent.evaluateAnswer(question, answer);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

router.post('/studyos/explain-level', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { concept, level } = req.body;
    const agent = new SocraticTutorAgent();
    const explanation = await agent.explainAtLevel(concept, level || 2);
    res.json({ explanation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to explain concept' });
  }
});

router.post('/studyos/dependency-graph', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { concepts, content } = req.body;
    const agent = new ConceptDependencyAgent();
    const dependencies = await agent.buildDependencyGraph(concepts, content);
    const learningPath = agent.suggestLearningPath(dependencies);
    res.json({ dependencies, learningPath });
  } catch (error) {
    res.status(500).json({ error: 'Failed to build dependency graph' });
  }
});

router.post('/studyos/anki/export', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { cards, deckName, format } = req.body;
    const agent = new AnkiExportAgent();
    const deck = agent.generateAnkiDeck(cards, deckName || 'StudyOS Deck');

    if (format === 'csv') {
      const csv = await agent.exportToCSV(deck);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${deckName}.csv"`);
      return res.send(csv);
    }

    res.json({ deck });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export to Anki' });
  }
});

router.get('/studyos/analytics', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new LearningAnalyticsAgent();
    const analytics = await agent.getAnalytics(userId);
    const insights = agent.generateInsights(analytics);
    res.json({ analytics, insights });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

router.post('/studyos/video/summarize', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const agent = new VideoSummarizerAgent();
    const summary = await agent.summarizeVideo(url);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize video' });
  }
});

router.post('/studyos/room/create', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { name, topic } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CollaborativeStudyRoomAgent();
    const room = await agent.createRoom(name, topic, userId);
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.post('/studyos/room/join', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CollaborativeStudyRoomAgent();
    const room = await agent.joinRoom(roomId, userId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join room' });
  }
});

router.get('/studyos/room/active', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const agent = new CollaborativeStudyRoomAgent();
    const rooms = await agent.getActiveRooms();
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

router.post('/studyos/pomodoro/start', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { type, duration, task } = req.body;
    const userId = req.userId || 'guest';
    const agent = new PomodoroAgent();
    const session = await agent.startSession(userId, type, duration, task);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

router.post('/studyos/pomodoro/complete', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const agent = new PomodoroAgent();
    const session = await agent.completeSession(sessionId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

router.get('/studyos/pomodoro/stats', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new PomodoroAgent();
    const stats = await agent.getTodayStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.post('/studyos/errors/log', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, question, yourAnswer, correctAnswer, mistakeType } = req.body;
    const userId = req.userId || 'guest';
    const agent = new ErrorTrackingAgent();
    const error = await agent.logError({ userId, topic, question, yourAnswer, correctAnswer, mistakeType });
    res.json(error);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log error' });
  }
});

router.get('/studyos/errors/weak-areas', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new ErrorTrackingAgent();
    const weakAreas = await agent.getWeakAreas(userId);
    const plan = agent.generateRemedialStudyplan(weakAreas);
    res.json({ weakAreas, plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get weak areas' });
  }
});

router.post('/studyos/question-bank/add', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { question, options, correctAnswer, explanation, topic, difficulty, author } = req.body;
    const agent = new QuestionBankAgent();
    const item = await agent.addQuestion({ question, options, correctAnswer, explanation, topic, difficulty, author: author || 'User' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add question' });
  }
});

router.get('/studyos/question-bank', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, difficulty, limit } = req.query;
    const agent = new QuestionBankAgent();
    const questions = await agent.getQuestions(topic as string, difficulty as string, Number(limit) || 20);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

router.post('/studyos/question-bank/generate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, content, count } = req.body;
    const agent = new QuestionBankAgent();
    const questions = await agent.generateFromContent(topic, content, count || 10);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

router.get('/studyos/gamification/profile', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new GamificationAgent();
    const profile = await agent.getUserProfile(userId);
    const levelInfo = agent.getLevelProgress(profile.xp);
    res.json({ profile, levelInfo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.post('/studyos/gamification/badges', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new GamificationAgent();
    const newBadges = await agent.checkAndAwardBadges(userId);
    res.json({ newBadges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check badges' });
  }
});

router.post('/studyos/pdf/annotate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { pdfId, annotations } = req.body;
    const agent = new PDFAnnotationAgent();
    await agent.annotatePDF(pdfId, annotations);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to annotate PDF' });
  }
});

router.get('/studyos/pdf/annotations/:pdfId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const pdfId = req.params.pdfId as string;
    const agent = new PDFAnnotationAgent();
    const annotations = await agent.getAnnotations(pdfId);
    res.json({ annotations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get annotations' });
  }
});

router.post('/studyos/pdf/highlights', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const agent = new PDFAnnotationAgent();
    const highlights = await agent.generateHighlights(content);
    res.json({ highlights });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate highlights' });
  }
});

router.post('/studyos/exam/countdown', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { name, date, subject } = req.body;
    const examDate = new Date(date);
    const agent = new ExamCountdownAgent();
    const countdown = agent.getCountdown(examDate);
    const urgency = agent.getUrgencyLevel(countdown.days);
    res.json({ name, subject, date: examDate, countdown, urgency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set countdown' });
  }
});

// ─── Voice Command Processing ──────────────────────────────────────────────────

/** POST /api/voice/command — Process voice command for study actions */
router.post('/voice/command', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const { command, context } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'command is required' });
    }

    const commandLower = command.toLowerCase();
    
    let action: string;
    let params: Record<string, any> = {};

    // Parse study commands
    if (commandLower.includes('flashcard') || commandLower.includes('create card') || commandLower.includes('make card')) {
      action = 'create_flashcard';
      const topicMatch = command.match(/(?:about|on|for)\s+([a-zA-Z\s]+?)(?:\s|$)/);
      params.topic = topicMatch ? topicMatch[1].trim() : context?.topic || 'General';
    } else if (commandLower.includes('quiz') || commandLower.includes('test') || commandLower.includes('exam')) {
      action = 'generate_quiz';
      params.topic = context?.topic || 'General';
    } else if (commandLower.includes('summarize') || commandLower.includes('summary')) {
      action = 'summarize';
      params.content = context?.content || '';
    } else if (commandLower.includes('study') || commandLower.includes('review')) {
      action = 'start_study_session';
      params.topic = context?.topic || 'General';
    } else if (commandLower.includes('repeat') || commandLower.includes('read') || commandLower.includes('speak')) {
      action = 'read_aloud';
      params.text = context?.text || '';
    } else if (commandLower.includes('next') || commandLower.includes('show')) {
      action = 'next_item';
    } else {
      action = 'unknown';
    }

    // Execute action based on parsed command
    let result: any = { action, parsed: true };

    switch (action) {
      case 'create_flashcard': {
        const engine = new SpacedRepetitionEngine(userId);
        result.cards = await engine.generateFromResearch(
          { keyFindings: [command], summary: command },
          params.topic,
          `voice_${Date.now()}`
        );
        result.message = `Created ${result.cards.length} flashcard(s) for "${params.topic}"`;
        break;
      }
      case 'generate_quiz': {
        const quizAgent = new QuizGeneratorAgent(userId);
        const quiz = await quizAgent.generateFromContent(
          context?.content || `Study material on ${params.topic}`,
          params.topic,
          { questionCount: 5 }
        );
        result.quiz = quiz;
        result.message = `Generated quiz with ${quiz.questions.length} questions on "${params.topic}"`;
        break;
      }
      case 'read_aloud': {
        const sarvamTTS = await import('../services/sarvam');
        const ttsResult = await sarvamTTS.sarvamClient.textToSpeech({
          text: params.text || context?.text || 'No text provided',
          language: context?.language || 'en-IN',
          voice: context?.voice || 'anushka',
        });
        result.audioUrl = ttsResult.audioUrl;
        result.message = 'Generated audio for read-aloud';
        break;
      }
      case 'start_study_session': {
        const engine = new SpacedRepetitionEngine(userId);
        const dueCards = await engine.getDueCards(10);
        result.dueCards = dueCards;
        result.message = `Found ${dueCards.length} cards due for review`;
        break;
      }
      case 'summarize':
        result.message = 'Use /api/media/pdf or /api/media/youtube to get summaries';
        break;
      case 'next_item':
        result.message = 'Use /api/flashcards/due to get next card';
        break;
      default:
        result.message = 'Command not recognized. Try: "create flashcard", "generate quiz", "read aloud", or "start study session"';
    }

    // Award XP for voice command usage
    if (action !== 'unknown') {
      const xp = new XPSystem(userId);
      await xp.awardXP('voice_command');
    }

    res.json(result);
  } catch (error) {
    console.error('Voice command error:', error);
    res.status(500).json({ error: 'Failed to process voice command' });
  }
});

/** POST /api/voice/read-aloud — Convert text to speech for study */
router.post('/voice/read-aloud', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { text, language, voice } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await sarvamClient.textToSpeech({
      text,
      language: language || 'en-IN',
      voice: voice || 'anushka',
    });

    res.json({ audioUrl: result.audioUrl, text });
  } catch (error) {
    console.error('Read aloud error:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

/** GET /api/voice/flashcards/read/:cardId — Read a flashcard aloud */
router.get('/voice/flashcards/read/:cardId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const cardId = req.params.cardId;
    const { language } = req.query;

    const engine = new SpacedRepetitionEngine(req.userId || 'guest');
    const allCards = await engine.getAllCards();
    const card = allCards.find(c => c.id === cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const textToRead = `${card.front}. ${card.back}`;
    const result = await sarvamClient.textToSpeech({
      text: textToRead,
      language: language as string || 'en-IN',
      voice: 'anushka',
    });

    res.json({ audioUrl: result.audioUrl, front: card.front, back: card.back });
  } catch (error) {
    console.error('Flashcard TTS error:', error);
    res.status(500).json({ error: 'Failed to read flashcard' });
  }
});

// ============ NEW LEARNING OS MODULES ============

// Concept Coach Agent
router.post('/coach/explain', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, level, context } = req.body;
    const userId = req.userId || 'guest';
    const agent = new ConceptCoachAgent(userId);
    const result = await agent.explainStepwise(topic, level, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to explain concept' });
  }
});

router.post('/coach/hint', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { question, attemptNumber, previousAnswer, context } = req.body;
    const userId = req.userId || 'guest';
    const agent = new ConceptCoachAgent(userId);
    const result = await agent.giveHint(question, attemptNumber, previousAnswer, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

router.get('/coach/mastery/:topic', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const topic = req.params.topic as string;
    const userId = req.userId || 'guest';
    const agent = new ConceptCoachAgent(userId);
    const result = await agent.assessMastery(topic);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assess mastery' });
  }
});

router.get('/coach/weak-topics', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new ConceptCoachAgent(userId);
    const result = await agent.detectWeakTopics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect weak topics' });
  }
});

router.post('/coach/adapt-difficulty', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { correctAnswers, totalQuestions, avgResponseTime, hintsUsed } = req.body;
    const userId = req.userId || 'guest';
    const agent = new ConceptCoachAgent(userId);
    const result = await agent.adaptDifficulty({ correctAnswers, totalQuestions, avgResponseTime, hintsUsed });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to adapt difficulty' });
  }
});

router.get('/coach/mastery-graph', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const generator = new MasteryGraphGenerator();
    const result = await generator.generateMasteryGraph(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate mastery graph' });
  }
});

// Assignment Evaluator
router.post('/evaluate/essay', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content, rubric, assignmentType } = req.body;
    const userId = req.userId || 'guest';
    const agent = new AssignmentEvaluatorAgent(userId);
    const result = await agent.evaluateEssay(content, rubric, assignmentType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate essay' });
  }
});

router.post('/evaluate/code', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { code, language, criteria } = req.body;
    const userId = req.userId || 'guest';
    const agent = new AssignmentEvaluatorAgent(userId);
    const result = await agent.evaluateCode(code, language, criteria);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate code' });
  }
});

router.post('/evaluate/presentation', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { slides, rubric } = req.body;
    const userId = req.userId || 'guest';
    const agent = new AssignmentEvaluatorAgent(userId);
    const result = await agent.evaluatePresentation(slides, rubric);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate presentation' });
  }
});

router.post('/evaluate/lab-report', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content, labType } = req.body;
    const userId = req.userId || 'guest';
    const agent = new AssignmentEvaluatorAgent(userId);
    const result = await agent.evaluateLabReport(content, labType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate lab report' });
  }
});

router.post('/evaluate/improve', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { work, workType, targetGrade } = req.body;
    const userId = req.userId || 'guest';
    const agent = new AssignmentEvaluatorAgent(userId);
    const result = await agent.suggestImprovements(work, workType, targetGrade);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to suggest improvements' });
  }
});

router.post('/evaluate/compare', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { v1, v2, workType } = req.body;
    const userId = req.userId || 'guest';
    const agent = new AssignmentEvaluatorAgent(userId);
    const result = await agent.compareVersions(v1, v2, workType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare versions' });
  }
});

router.post('/evaluate/rubric', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { name, type, criteria } = req.body;
    const userId = req.userId || 'guest';
    const agent = new AssignmentEvaluatorAgent(userId);
    const result = await agent.createRubric(name, type, criteria);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create rubric' });
  }
});

router.get('/evaluate/rubrics', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const userId = req.userId || 'guest';
    const agent = new AssignmentEvaluatorAgent(userId);
    const result = await agent.getRubrics(type as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get rubrics' });
  }
});

// Integrity Agent
router.post('/integrity/check', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.userId || 'guest';
    const agent = new IntegrityAgent(userId);
    const result = await agent.checkOriginality(content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check originality' });
  }
});

router.post('/integrity/ai-usage', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.userId || 'guest';
    const agent = new IntegrityAgent(userId);
    const result = await agent.detectAIUsage(content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect AI usage' });
  }
});

router.post('/integrity/citations', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content, style } = req.body;
    const userId = req.userId || 'guest';
    const agent = new IntegrityAgent(userId);
    const result = await agent.checkCitations(content, style);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check citations' });
  }
});

router.post('/integrity/generate-citations', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { sources, format } = req.body;
    const userId = req.userId || 'guest';
    const agent = new IntegrityAgent(userId);
    const result = await agent.generateCitations(sources, format);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate citations' });
  }
});

router.post('/integrity/references', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, count } = req.body;
    const userId = req.userId || 'guest';
    const agent = new IntegrityAgent(userId);
    const result = await agent.suggestReferences(topic, count);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to suggest references' });
  }
});

router.post('/integrity/weak-arguments', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.userId || 'guest';
    const agent = new IntegrityAgent(userId);
    const result = await agent.detectWeakArguments(content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect weak arguments' });
  }
});

// Study Planner
router.post('/planner/generate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { syllabusText, examDate, dailyHours, weakTopicEmphasis, priorityBased } = req.body;
    const userId = req.userId || 'guest';
    const agent = new StudyPlannerAgent(userId);
    const syllabus = await agent.parseSyllabus(syllabusText, examDate ? new Date(examDate) : undefined);
    const plan = await agent.generateStudyPlan(syllabus, { dailyHours, weakTopicEmphasis, priorityBased });
    res.json({ syllabus, plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

router.get('/planner/readiness', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { syllabus, performanceData } = req.body;
    const userId = req.userId || 'guest';
    const agent = new StudyPlannerAgent(userId);
    const result = await agent.calculateReadiness(syllabus, performanceData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate readiness' });
  }
});

router.get('/planner/burnout', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new StudyPlannerAgent(userId);
    const result = await agent.detectBurnoutRisk(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect burnout risk' });
  }
});

router.post('/planner/flashcards', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { syllabus, cardsPerTopic } = req.body;
    const userId = req.userId || 'guest';
    const agent = new StudyPlannerAgent(userId);
    const result = agent.generateFlashcardsFromSyllabus(syllabus, cardsPerTopic);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// Code Debug Coach
router.post('/debug/explain', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { code, language, error, expectedBehavior } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CodeDebugCoachAgent(userId);
    const result = await agent.explainDebugStepwise(code, language, error, expectedBehavior);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to explain debug' });
  }
});

router.post('/debug/analyze', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CodeDebugCoachAgent(userId);
    const result = await agent.analyzeCode(code, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze code' });
  }
});

router.post('/debug/logic', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { code, expectedOutput, actualOutput, language } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CodeDebugCoachAgent(userId);
    const result = await agent.explainWhyLogicFails(code, expectedOutput, actualOutput, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to explain logic' });
  }
});

router.post('/debug/concepts', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { code, language, concepts } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CodeDebugCoachAgent(userId);
    const result = await agent.suggestConceptResources(code, language, concepts);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to suggest concepts' });
  }
});

router.post('/debug/unittest', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { code, testInput, expectedOutput, actualOutput, language } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CodeDebugCoachAgent(userId);
    const result = await agent.learnFromUnitTest(code, testInput, expectedOutput, actualOutput, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to learn from unit test' });
  }
});

router.post('/debug/exercise', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, language, difficulty } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CodeDebugCoachAgent(userId);
    const result = await agent.createDebugExercise(topic, language, difficulty);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create debug exercise' });
  }
});

// Career Navigator
router.post('/career/skills', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { skills, targetRoles } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CareerSkillNavigatorAgent(userId);
    const result = await agent.mapSkills(skills, targetRoles);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to map skills' });
  }
});

router.post('/career/resume', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { resume, targetRole } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CareerSkillNavigatorAgent(userId);
    const result = await agent.reviewResume(resume, targetRole);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to review resume' });
  }
});

router.post('/career/interview', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { role, type, difficulty, questionCount } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CareerSkillNavigatorAgent(userId);
    const result = await agent.generateMockInterview(role, type, difficulty, questionCount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate interview' });
  }
});

router.post('/career/interview/evaluate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { question, answer } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CareerSkillNavigatorAgent(userId);
    const result = await agent.evaluateAnswer(question, answer);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

router.post('/career/portfolio', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { projects } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CareerSkillNavigatorAgent(userId);
    const result = await agent.reviewPortfolio(projects);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to review portfolio' });
  }
});

router.post('/career/roadmap', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { targetRole, currentSkills, timelineMonths } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CareerSkillNavigatorAgent(userId);
    const result = await agent.generateCareerRoadmap(targetRole, currentSkills, timelineMonths);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

router.get('/career/jobs', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { skills, targetRoles, location, limit } = req.query;
    const userId = req.userId || 'guest';
    const agent = new CareerSkillNavigatorAgent(userId);
    const result = await agent.findJobMatches(
      skills as any,
      targetRoles as string[],
      location as string,
      Number(limit) || 10
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find jobs' });
  }
});

router.get('/career/interview-tips/:role', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const role = req.params.role as string;
    const companyType = (req.query.companyType as string) || 'mid-size';
    const userId = req.userId || 'guest';
    const agent = new CareerSkillNavigatorAgent(userId);
    const result = await agent.getInterviewTips(role, companyType as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get interview tips' });
  }
});

// Confidence Booster
router.post('/confidence/hesitation', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { response, responseTime } = req.body;
    const userId = req.userId || 'guest';
    const agent = new ConfidenceBoosterAgent(userId);
    const result = await agent.detectHesitation(response, responseTime);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect hesitation' });
  }
});

router.post('/confidence/encourage', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { context, tone } = req.body;
    const userId = req.userId || 'guest';
    const agent = new ConfidenceBoosterAgent(userId);
    const result = await agent.generateEncouragement(context, tone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate encouragement' });
  }
});

router.post('/confidence/anxiety', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const userId = req.userId || 'guest';
    const agent = new ConfidenceBoosterAgent(userId);
    const result = await agent.analyzeAnxietyFromText(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze anxiety' });
  }
});

router.post('/confidence/stress', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { anxietyLevel, context } = req.body;
    const userId = req.userId || 'guest';
    const agent = new ConfidenceBoosterAgent(userId);
    const result = await agent.generateStressResponse(anxietyLevel, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate stress response' });
  }
});

router.get('/confidence/trend', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const userId = req.userId || 'guest';
    const agent = new ConfidenceBoosterAgent(userId);
    const result = await agent.trackConfidenceTrend(period as any || 'week');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track confidence trend' });
  }
});

// Critical Thinking / Fallacy Detector
router.post('/thinking/fallacies', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const userId = req.userId || 'guest';
    const agent = new LogicalFallacyDetectorAgent(userId);
    const result = await agent.detectFallacies(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect fallacies' });
  }
});

router.post('/thinking/analyze', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { argument, context } = req.body;
    const userId = req.userId || 'guest';
    const agent = new LogicalFallacyDetectorAgent(userId);
    const result = await agent.analyzeArgument(argument, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze argument' });
  }
});

router.post('/thinking/debate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { yourArgument, opponentResponse, isProponent } = req.body;
    const userId = req.userId || 'guest';
    const agent = new LogicalFallacyDetectorAgent(userId);
    const result = await agent.evaluateDebatePerformance(yourArgument, opponentResponse, isProponent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate debate' });
  }
});

router.post('/thinking/score', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const userId = req.userId || 'guest';
    const agent = new LogicalFallacyDetectorAgent(userId);
    const result = await agent.assessCriticalThinking(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assess thinking' });
  }
});

router.post('/thinking/challenge', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { argument, count } = req.body;
    const userId = req.userId || 'guest';
    const agent = new LogicalFallacyDetectorAgent(userId);
    const result = await agent.generateSocraticChallenges(argument, count);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate challenges' });
  }
});

router.post('/thinking/bias', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const userId = req.userId || 'guest';
    const agent = new LogicalFallacyDetectorAgent(userId);
    const result = await agent.detectBias(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect bias' });
  }
});

router.get('/thinking/fallacy/:type', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const userId = req.userId || 'guest';
    const agent = new LogicalFallacyDetectorAgent(userId);
    const result = await agent.teachFallacy(type as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to teach fallacy' });
  }
});

// ============ QUIZ GENERATOR ============
import { QuizGeneratorAgent, QuizBankAgent } from '../agents/quizGenerator';
import { QuizGeneratorAgent as QuizAgent } from '../agents/quizGenerator';

router.post('/quiz/generate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { content, topic, questionCount, difficulty } = req.body;
    const userId = req.userId || 'guest';
    const agent = new QuizGeneratorAgent(userId);
    const result = await agent.generateFromContent(content, topic, { questionCount, difficulty });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

router.post('/quiz/evaluate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.userId || 'guest';
    const agent = new QuizGeneratorAgent(userId);
    const result = await agent.evaluateQuiz(quizId, answers);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate quiz' });
  }
});

router.get('/quiz/analytics/:quizId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const userId = req.userId || 'guest';
    const agent = new QuizGeneratorAgent(userId);
    const result = await agent.getQuizAnalytics(quizId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ============ LEARNING STYLE DETECTOR ============
import { LearningStyleDetectorAgent } from '../agents/learningStyleDetector';

router.get('/learning-style/questionnaire', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new LearningStyleDetectorAgent(userId);
    const result = await agent.generateQuestionnaire();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get questionnaire' });
  }
});

router.post('/learning-style/analyze', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { responses } = req.body;
    const userId = req.userId || 'guest';
    const agent = new LearningStyleDetectorAgent(userId);
    const result = await agent.analyzeResponses(responses);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze learning style' });
  }
});

router.get('/learning-style/profile', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new LearningStyleDetectorAgent(userId);
    const result = await agent.getProfile();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ============ PREDICTIVE ANALYTICS ============
import { PredictiveAnalyticsAgent } from '../agents/predictiveAnalytics';

router.post('/analytics/predict', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, examDate, performanceHistory, studyHoursRemaining } = req.body;
    const userId = req.userId || 'guest';
    const agent = new PredictiveAnalyticsAgent(userId);
    const result = await agent.predictExamScore(topic, new Date(examDate), performanceHistory, studyHoursRemaining);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict score' });
  }
});

router.get('/analytics/patterns', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new PredictiveAnalyticsAgent(userId);
    const result = await agent.analyzeStudyPatterns();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

router.get('/analytics/competency', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topics } = req.query;
    const userId = req.userId || 'guest';
    const agent = new PredictiveAnalyticsAgent(userId);
    const result = await agent.getCompetencyRadar(topics as string[]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get competency' });
  }
});

// ============ CALENDAR INTEGRATION ============
import { CalendarIntegrationAgent } from '../agents/calendarIntegration';

router.post('/calendar/schedule', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { examDate, topics, dailyStudyHours } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CalendarIntegrationAgent(userId);
    const result = await agent.generateStudySchedule(new Date(examDate), topics, dailyStudyHours);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

router.get('/calendar/events', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const userId = req.userId || 'guest';
    const agent = new CalendarIntegrationAgent(userId);
    const result = await agent.getUpcomingEvents(Number(days) || 7);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get events' });
  }
});

router.get('/calendar/export', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { schedule } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CalendarIntegrationAgent(userId);
    const ics = await agent.exportToICS(schedule);
    res.setHeader('Content-Type', 'text/calendar');
    res.send(ics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export calendar' });
  }
});

// ============ SKILL INTELLIGENCE ============
import { SkillIntelligenceEngine } from '../agents/skillIntelligence';

router.post('/skills/map', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { activities } = req.body;
    const userId = req.userId || 'guest';
    const agent = new SkillIntelligenceEngine(userId);
    const result = await agent.buildCompetencyMap(activities);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to map skills' });
  }
});

router.get('/skills/recommendations', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new SkillIntelligenceEngine(userId);
    const result = await agent.getSkillRecommendations();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

router.post('/skills/path', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { targetRole, currentLevel, targetLevel, skills } = req.body;
    const userId = req.userId || 'guest';
    const agent = new SkillIntelligenceEngine(userId);
    const result = await agent.generateLearningPath(targetRole, currentLevel, targetLevel, skills);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate path' });
  }
});

// ============ WEB SEARCH ============
import { WebSearchAgent } from '../agents/webSearch';

router.post('/search/learning', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { topic, sources, maxResults, difficulty } = req.body;
    const userId = req.userId || 'guest';
    const agent = new WebSearchAgent(userId);
    const result = await agent.searchForLearningContent(topic, { sources, maxResults, difficulty });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search' });
  }
});

router.post('/search/summarize', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const userId = req.userId || 'guest';
    const agent = new WebSearchAgent(userId);
    const result = await agent.summarizeContent(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize' });
  }
});

// ============ PORTFOLIO GENERATOR ============
import { PortfolioGeneratorAgent } from '../agents/portfolioGenerator';

router.post('/portfolio/generate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { userData, projectData } = req.body;
    const userId = req.userId || 'guest';
    const agent = new PortfolioGeneratorAgent(userId);
    const result = await agent.generatePortfolio(userData, projectData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate portfolio' });
  }
});

router.get('/portfolio/export/markdown', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { portfolio } = req.body;
    const userId = req.userId || 'guest';
    const agent = new PortfolioGeneratorAgent(userId);
    const markdown = await agent.exportToMarkdown(portfolio);
    res.setHeader('Content-Type', 'text/markdown');
    res.send(markdown);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ============ CERTIFICATE GENERATOR ============
import { CertificateGeneratorAgent } from '../agents/certificateGenerator';

router.post('/certificate/generate', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { recipient, course } = req.body;
    const userId = req.userId || 'guest';
    const agent = new CertificateGeneratorAgent(userId);
    const result = await agent.generateCertificate(recipient, course);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

router.get('/certificate/verify/:credentialId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const credentialId = req.params.credentialId as string;
    const userId = req.userId || 'guest';
    const agent = new CertificateGeneratorAgent(userId);
    const result = await agent.verifyCertificate(credentialId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify' });
  }
});

router.get('/certificate/html/:credentialId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const credentialId = req.params.credentialId as string;
    const userId = req.userId || 'guest';
    const agent = new CertificateGeneratorAgent(userId);
    const { certificate } = await agent.verifyCertificate(credentialId);
    if (certificate) {
      const html = await agent.generateHTML(certificate);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      res.status(404).json({ error: 'Certificate not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate HTML' });
  }
});

// ============ LMS CONNECTOR ============
import { LMSConnectorAgent } from '../agents/lmsConnector';

router.post('/lms/connect', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const { provider, baseUrl } = req.body;
    const userId = req.userId || 'guest';
    const agent = new LMSConnectorAgent(userId);
    const result = await agent.connect(provider, baseUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect' });
  }
});

router.get('/lms/courses', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new LMSConnectorAgent(userId);
    const result = await agent.getCourses();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get courses' });
  }
});

router.get('/lms/assignments/:courseId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const userId = req.userId || 'guest';
    const agent = new LMSConnectorAgent(userId);
    const result = await agent.getAssignments(courseId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

router.get('/lms/grades/:courseId', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const userId = req.userId || 'guest';
    const agent = new LMSConnectorAgent(userId);
    const result = await agent.getGrades(courseId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get grades' });
  }
});

router.post('/lms/sync', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId || 'guest';
    const agent = new LMSConnectorAgent(userId);
    const result = await agent.syncWithLMS();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync' });
  }
});

export default router;
