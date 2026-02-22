import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createServer } from 'http';
import { connectDatabase, disconnectDatabase } from './services/prisma';
import { cacheService } from './services/cache';
import { wsService } from './services/websocket';
import apiRoutes from './routes/api';
import { authenticate } from './middleware/auth';
import { generalLimiter, researchLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { researchRequestSchema } from './validations';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3001;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const corsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost'];

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = await checkDatabaseHealth();
  const redisStatus = cacheService.getStatus();
  
  const isHealthy = dbStatus && redisStatus;
  
  res.status(isHealthy ? 200 : 503).json({ 
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus ? 'connected' : 'disconnected',
      redis: redisStatus ? 'connected' : 'disconnected',
    }
  });
});

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { prisma } = await import('./services/prisma');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

app.use('/api', researchLimiter, apiRoutes);
app.use('/api/auth', authLimiter);

app.post('/api/research', authenticate({ optional: true }), async (req: Request, res: Response) => {
  try {
    const parsed = researchRequestSchema.parse(req.body);
    const { AgentOrchestrator } = await import('./agents/orchestrator');
    
    const orchestrator = new AgentOrchestrator(parsed.userId || req.userId || 'guest');
    const result = await orchestrator.research(parsed.query);
    
    res.json(result);
  } catch (error) {
    errorHandler(error as Error, req, res, () => {});
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    await cacheService.connect();
    wsService.initialize(httpServer);
    
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

startServer();

export { app, httpServer };
