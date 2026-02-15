import { Router, Request, Response } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator';
import { prisma } from '../services/prisma';
import { sarvamClient } from '../services/sarvam';

const router = Router();

router.post('/research', async (req: Request, res: Response) => {
  try {
    const { query, userId } = req.body;

    if (!query || !userId) {
      return res.status(400).json({ error: 'Query and userId are required' });
    }

    const orchestrator = new AgentOrchestrator(userId);
    const result = await orchestrator.research(query);

    res.json(result);
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({ error: 'Research failed' });
  }
});

router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const orchestrator = new AgentOrchestrator('');
    const session = await orchestrator.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const orchestrator = new AgentOrchestrator(userId);
    const sessions = await orchestrator.getUserSessions();

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.get('/sources/:sessionId', async (req: Request, res: Response) => {
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

router.get('/memory', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

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

router.get('/interests', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const interests = await prisma.userInterest.findMany({
      where: { userId },
      orderBy: { depth: 'desc' },
    });

    res.json(interests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get interests' });
  }
});

router.get('/knowledge-graph', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

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

// Sarvam AI Integration Routes
router.post('/sarvam/ocr', async (req: Request, res: Response) => {
  try {
    const { imageUrl, imageBase64, language = 'en' } = req.body;

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ error: 'imageUrl or imageBase64 is required' });
    }

    let result;
    if (imageBase64) {
      // Convert base64 to blob for processing
      result = await sarvamClient.performOCR(imageBase64, language);
    } else {
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
    const { text, language = 'en', voice = 'female', speed = 1.0, pitch = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await sarvamClient.textToSpeech({
      text,
      language,
      voice,
      speed,
      pitch,
    });

    res.json(result);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Text-to-speech conversion failed' });
  }
});

router.post('/sarvam/stt', async (req: Request, res: Response) => {
  try {
    const { audioUrl, audioBase64, language = 'en' } = req.body;

    if (!audioUrl && !audioBase64) {
      return res.status(400).json({ error: 'audioUrl or audioBase64 is required' });
    }

    let result;
    if (audioBase64) {
      result = await sarvamClient.speechToText(audioBase64, language);
    } else {
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

export default router;
