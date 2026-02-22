import type { MemoryItem, SynthesisResult, SessionContext } from '../types';
import { prisma } from '../services/prisma';
import { Prisma } from '@prisma/client';
import { llmService } from '../services/llm';
import { v4 as uuid } from 'uuid';

export class MemoryAgent {
  private sessionId: string;
  private userId: string;
  private taskId: string;

  constructor(sessionId: string, userId: string, taskId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.taskId = taskId;
  }

  async storeResults(synthesisResult: SynthesisResult, query: string): Promise<void> {
    const memories: Array<{ type: string; content: string; importance: number }> = [];

    const topic = this.extractTopic(query);
    if (topic) {
      await prisma.userInterest.upsert({
        where: { userId_topic: { userId: this.userId, topic } },
        update: { lastResearchedAt: new Date(), depth: { increment: 1 } },
        create: { userId: this.userId, topic, depth: 1, lastResearchedAt: new Date() },
      });
    }

    // Store key findings as memories with embeddings
    for (const finding of synthesisResult.keyFindings.slice(0, 5)) {
      const embedding = await llmService.generateEmbedding(finding);

      // Use raw SQL for vector insertion because Prisma doesn't support the vector type natively in the create API for Unsupported fields easily
      const memoryId = uuid();
      await prisma.$executeRaw`
        INSERT INTO "UserMemory" ("id", "userId", "type", "content", "importance", "embedding", "lastUsedAt", "createdAt", "updatedAt")
        VALUES (${memoryId}, ${this.userId}, 'fact', ${finding}, ${synthesisResult.confidence}, ${embedding}::vector, now(), now(), now())
      `;

      memories.push({
        type: 'fact',
        content: finding,
        importance: synthesisResult.confidence,
      });
    }

    await this.updateKnowledgeGraph(synthesisResult, query);

    await prisma.agentTask.update({
      where: { id: this.taskId },
      data: { status: 'completed', output: { memoriesStored: memories.length } as Prisma.InputJsonValue },
    });
  }

  async getRelevantMemories(query: string, limit: number = 5): Promise<MemoryItem[]> {
    const queryEmbedding = await llmService.generateEmbedding(query);

    // Semantic search using pgvector cosine distance (<=>)
    const relevantMemories = await prisma.$queryRaw<any[]>`
      SELECT id, type, content, importance, 
             1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "UserMemory"
      WHERE "userId" = ${this.userId}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return relevantMemories.map(m => ({
      id: m.id,
      type: m.type as MemoryItem['type'],
      content: m.content,
      importance: m.importance,
      similarity: m.similarity,
    }));
  }

  async getUserInterests(): Promise<Array<{ topic: string; depth: number }>> {
    const interests = await prisma.userInterest.findMany({
      where: { userId: this.userId },
      orderBy: { depth: 'desc' },
    });

    return interests.map((i: { topic: string; depth: number }) => ({ topic: i.topic, depth: i.depth }));
  }

  private async updateKnowledgeGraph(synthesisResult: SynthesisResult, query: string): Promise<void> {
    const topicNode = await prisma.knowledgeNode.create({
      data: {
        type: 'concept',
        name: this.extractTopic(query) || 'Research Topic',
        description: query,
      },
    });

    for (const finding of synthesisResult.keyFindings.slice(0, 5)) {
      const findingNode = await prisma.knowledgeNode.create({
        data: {
          type: 'fact',
          name: finding.substring(0, 100),
          description: finding,
        },
      });

      await prisma.knowledgeEdge.create({
        data: {
          fromNodeId: topicNode.id,
          toNodeId: findingNode.id,
          relation: 'contains',
          strength: synthesisResult.confidence,
        },
      });
    }
  }

  private extractTopic(query: string): string | null {
    const stopWords = ['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'a', 'an', 'to', 'for'];
    const words = query.toLowerCase().split(/\s+/).filter(w => !stopWords.includes(w));
    return words.slice(0, 3).join(' ') || null;
  }
}
