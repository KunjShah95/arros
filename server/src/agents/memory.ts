import type { MemoryItem, SynthesisResult, SessionContext } from '../types';
import { prisma } from '../services/prisma';
import { Prisma } from '@prisma/client';

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

    for (const finding of synthesisResult.keyFindings.slice(0, 5)) {
      memories.push({
        type: 'fact',
        content: finding,
        importance: synthesisResult.confidence,
      });
    }

    memories.push({
      type: 'strategy',
      content: `Research strategy: ${synthesisResult.keyFindings.length} key findings identified`,
      importance: 0.5,
    });

    await prisma.userMemory.createMany({
      data: memories.map(m => ({
        userId: this.userId,
        type: m.type,
        content: m.content,
        importance: m.importance,
      })),
    });

    await this.updateKnowledgeGraph(synthesisResult, query);

    await prisma.agentTask.update({
      where: { id: this.taskId },
      data: { status: 'completed', output: { memoriesStored: memories.length } as Prisma.InputJsonValue },
    });
  }

  async getRelevantMemories(query: string, limit: number = 5): Promise<MemoryItem[]> {
    const memories = await prisma.userMemory.findMany({
      where: { userId: this.userId },
      orderBy: { importance: 'desc' },
      take: limit,
    });

    return memories.map((m: { id: string; type: string; content: string; importance: number }) => ({
      id: m.id,
      type: m.type as MemoryItem['type'],
      content: m.content,
      importance: m.importance,
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
