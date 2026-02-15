import { z } from 'zod';

export const researchRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  options: z.object({
    maxSources: z.number().min(1).max(50).default(10),
    includeActions: z.boolean().default(true),
    model: z.enum(['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-haiku']).optional(),
  }).optional(),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().uuid(),
});

export const userIdSchema = z.object({
  userId: z.string().uuid(),
});

export const knowledgeGraphQuerySchema = z.object({
  userId: z.string().uuid(),
  query: z.string().min(1).max(500).optional(),
  limit: z.number().min(1).max(100).default(20),
});

export const memoryQuerySchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['preference', 'interest', 'strategy', 'fact']).optional(),
  limit: z.number().min(1).max(100).default(20),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

export type ResearchRequest = z.infer<typeof researchRequestSchema>;
export type SessionIdParam = z.infer<typeof sessionIdSchema>;
export type UserIdParam = z.infer<typeof userIdSchema>;
export type KnowledgeGraphQuery = z.infer<typeof knowledgeGraphQuerySchema>;
export type MemoryQuery = z.infer<typeof memoryQuerySchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
